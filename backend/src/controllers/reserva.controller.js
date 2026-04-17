import { z } from "zod";
import prisma from "../prisma/client.js";

const LABORATORIOS_VALIDOS = [
    "Laboratório de Radiologia",
    "Laboratório de Enfermagem",
    "Laboratório de Massagem Profissional",
    "Laboratório de Corte e Costura",
    "Laboratório de Edificações",
    "Laboratório de Eletrotécnica",
    "Laboratório de Informática",
];

const createReservaSchema = z.object({
    cronogramaAulaId: z.coerce.number().int().positive(),
    tipo: z.enum(["laboratorio", "vpo"]),
    recursoNome: z.string().min(2),
    data: z.string().min(1, "Data obrigatória."),
    turno: z.enum(["manha", "tarde", "noite"]),
    horarioInicio: z.string().min(1, "Horário inicial obrigatório."),
    horarioFim: z.string().min(1, "Horário final obrigatório."),
    observacoes: z.string().optional().nullable(),
});

const updateStatusSchema = z.object({
    status: z.enum(["ativa", "cancelada"]),
});

function parseTimeToMinutes(time) {
    const [hours, minutes] = String(time).split(":").map(Number);
    return hours * 60 + minutes;
}

function hasTimeOverlap(startA, endA, startB, endB) {
    const aStart = parseTimeToMinutes(startA);
    const aEnd = parseTimeToMinutes(endA);
    const bStart = parseTimeToMinutes(startB);
    const bEnd = parseTimeToMinutes(endB);

    return aStart < bEnd && aEnd > bStart;
}

function sameDate(dateA, dateB) {
    return new Date(dateA).toISOString().slice(0, 10) === new Date(dateB).toISOString().slice(0, 10);
}

async function getAulaComContexto(aulaId) {
    return prisma.cronogramaAula.findUnique({
        where: { id: aulaId },
        include: {
            turma: true,
            instrutor: true,
            turmaDisciplina: {
                include: {
                    disciplina: true,
                    instrutorPadrao: true,
                },
            },
            reservas: true,
        },
    });
}

function getInstrutorEfetivoId(aula) {
    return aula.instrutorId || aula.turmaDisciplina?.instrutorPadraoId || null;
}

function canManageReserva(userRole) {
    return ["admin", "pedagogico", "coordenacao"].includes(userRole);
}

export async function createReserva(req, res, next) {
    try {
        const currentUserId = Number(req.user.sub);
        const currentUserRole = req.user.role;
        const data = createReservaSchema.parse(req.body);

        if (
            data.tipo === "laboratorio" &&
            !LABORATORIOS_VALIDOS.includes(data.recursoNome)
        ) {
            return res.status(400).json({
                message: "Laboratório inválido.",
            });
        }

        const aula = await getAulaComContexto(data.cronogramaAulaId);

        if (!aula) {
            return res.status(404).json({
                message: "Aula não encontrada.",
            });
        }

        const instrutorEfetivoId = getInstrutorEfetivoId(aula);

        if (!canManageReserva(currentUserRole)) {
            if (currentUserRole !== "instrutor") {
                return res.status(403).json({
                    message: "Você não tem permissão para criar reservas.",
                });
            }

            if (!instrutorEfetivoId || instrutorEfetivoId !== currentUserId) {
                return res.status(403).json({
                    message: "O instrutor só pode reservar recursos para aulas atribuídas a ele.",
                });
            }
        }

        if (!instrutorEfetivoId) {
            return res.status(400).json({
                message: "A aula precisa ter um instrutor definido antes da reserva.",
            });
        }

        const reservasAtivas = await prisma.reserva.findMany({
            where: {
                status: "ativa",
            },
        });

        const conflitoInstrutorMesmoHorario = reservasAtivas.find((reserva) => {
            if (reserva.instrutorId !== instrutorEfetivoId) return false;
            if (!sameDate(reserva.data, data.data)) return false;

            return hasTimeOverlap(
                reserva.horarioInicio,
                reserva.horarioFim,
                data.horarioInicio,
                data.horarioFim
            );
        });

        if (conflitoInstrutorMesmoHorario) {
            return res.status(409).json({
                message: "O instrutor já possui outra reserva ativa nesse horário.",
            });
        }

        const conflitoMesmoDiaTurnoTipoOposto = reservasAtivas.find((reserva) => {
            if (reserva.instrutorId !== instrutorEfetivoId) return false;
            if (!sameDate(reserva.data, data.data)) return false;
            if (reserva.turno !== data.turno) return false;

            const combinacaoBloqueada =
                (reserva.tipo === "laboratorio" && data.tipo === "vpo") ||
                (reserva.tipo === "vpo" && data.tipo === "laboratorio");

            return combinacaoBloqueada;
        });

        if (conflitoMesmoDiaTurnoTipoOposto) {
            return res.status(409).json({
                message: "O instrutor não pode ter VPO e laboratório no mesmo dia e turno.",
            });
        }

        if (data.tipo === "laboratorio") {
            const conflitoLaboratorio = reservasAtivas.find((reserva) => {
                if (reserva.tipo !== "laboratorio") return false;
                if (reserva.recursoNome !== data.recursoNome) return false;
                if (!sameDate(reserva.data, data.data)) return false;

                return hasTimeOverlap(
                    reserva.horarioInicio,
                    reserva.horarioFim,
                    data.horarioInicio,
                    data.horarioFim
                );
            });

            if (conflitoLaboratorio) {
                return res.status(409).json({
                    message: "Esse laboratório já está reservado nesse horário.",
                });
            }
        }

        const reserva = await prisma.reserva.create({
            data: {
                cronogramaAulaId: data.cronogramaAulaId,
                turmaId: aula.turmaId,
                instrutorId: instrutorEfetivoId,
                tipo: data.tipo,
                recursoNome: data.recursoNome,
                data: new Date(data.data),
                turno: data.turno,
                horarioInicio: data.horarioInicio,
                horarioFim: data.horarioFim,
                observacoes:
                    data.observacoes && data.observacoes.trim()
                        ? data.observacoes.trim()
                        : null,
                status: "ativa",
                origem: "cronograma",
            },
            include: {
                instrutor: true,
                turma: true,
                cronogramaAula: true,
            },
        });

        return res.status(201).json(reserva);
    } catch (error) {
        next(error);
    }
}

export async function updateReservaStatus(req, res, next) {
    try {
        const currentUserId = Number(req.user.sub);
        const currentUserRole = req.user.role;
        const id = Number(req.params.id);
        const data = updateStatusSchema.parse(req.body);

        const reserva = await prisma.reserva.findUnique({
            where: { id },
        });

        if (!reserva) {
            return res.status(404).json({
                message: "Reserva não encontrada.",
            });
        }

        if (!canManageReserva(currentUserRole)) {
            if (currentUserRole !== "instrutor" || reserva.instrutorId !== currentUserId) {
                return res.status(403).json({
                    message: "Você não tem permissão para alterar essa reserva.",
                });
            }
        }

        const updated = await prisma.reserva.update({
            where: { id },
            data: {
                status: data.status,
            },
        });

        return res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
}

export async function listMinhasReservasInstrutor(req, res, next) {
    try {
        const currentUserId = Number(req.user.sub);

        const reservas = await prisma.reserva.findMany({
            where: {
                instrutorId: currentUserId,
            },
            include: {
                turma: {
                    include: {
                        curso: true,
                    },
                },
                cronogramaAula: {
                    include: {
                        turmaDisciplina: {
                            include: {
                                disciplina: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ data: "asc" }, { horarioInicio: "asc" }],
        });

        return res.status(200).json(reservas);
    } catch (error) {
        next(error);
    }
}