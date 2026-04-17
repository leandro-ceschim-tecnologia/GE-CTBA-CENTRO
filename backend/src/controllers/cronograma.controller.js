import { z } from "zod";
import prisma from "../prisma/client.js";
import {
    gerarCronogramaDaTurma,
    regenerarCronogramaDaTurma,
} from "../services/cronograma.service.js";

const gerarSchema = z.object({
    turmaId: z.coerce.number().int().positive("Turma inválida."),
});

const regenerarSchema = z.object({
    turmaId: z.coerce.number().int().positive("Turma inválida."),
    dataCorte: z.string().min(1, "Data de corte obrigatória."),
});

function getStartOfToday() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getEndOfToday() {
    const today = new Date();
    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999
    );
}

export async function gerarCronograma(req, res, next) {
    try {
        const data = gerarSchema.parse(req.body);
        const cronograma = await gerarCronogramaDaTurma(data.turmaId);

        return res.status(201).json(cronograma);
    } catch (error) {
        next(error);
    }
}

export async function regenerarCronograma(req, res, next) {
    try {
        const data = regenerarSchema.parse(req.body);
        const cronograma = await regenerarCronogramaDaTurma({
            turmaId: data.turmaId,
            dataCorte: data.dataCorte,
        });

        return res.status(200).json(cronograma);
    } catch (error) {
        next(error);
    }
}

export async function getCronogramaByTurma(req, res, next) {
    try {
        const turmaId = Number(req.params.turmaId);

        if (!turmaId || Number.isNaN(turmaId)) {
            return res.status(400).json({
                message: "Turma inválida.",
            });
        }

        const {
            somenteFuturas,
            somenteHoje,
            modulo,
            disciplinaId,
            semInstrutor,
            comLaboratorio,
            comVpo,
            avaliacaoFinal,
        } = req.query;

        const where = {
            turmaId,
            ativo: true,
        };

        if (somenteHoje === "true") {
            where.data = {
                gte: getStartOfToday(),
                lte: getEndOfToday(),
            };
        } else if (somenteFuturas === "true") {
            where.data = {
                gte: getStartOfToday(),
            };
        }

        if (semInstrutor === "true") {
            where.instrutorId = null;
        }

        if (avaliacaoFinal === "true") {
            where.tipoAula = "Avaliação Final";
        }

        const aulas = await prisma.cronogramaAula.findMany({
            where,
            include: {
                turma: true,
                instrutor: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        role: true,
                    },
                },
                turmaDisciplina: {
                    include: {
                        disciplina: true,
                        instrutorPadrao: {
                            select: {
                                id: true,
                                nome: true,
                                email: true,
                                role: true,
                            },
                        },
                    },
                },
                reservas: true,
            },
            orderBy: [{ data: "asc" }, { numeroEncontroGeral: "asc" }],
        });

        let filtradas = aulas;

        if (modulo) {
            filtradas = filtradas.filter(
                (item) => item.turmaDisciplina?.modulo === Number(modulo)
            );
        }

        if (disciplinaId) {
            filtradas = filtradas.filter(
                (item) => item.turmaDisciplina?.disciplinaId === Number(disciplinaId)
            );
        }

        if (comLaboratorio === "true") {
            filtradas = filtradas.filter((item) =>
                item.reservas?.some(
                    (reserva) =>
                        reserva.tipo === "laboratorio" && reserva.status === "ativa"
                )
            );
        }

        if (comVpo === "true") {
            filtradas = filtradas.filter((item) =>
                item.reservas?.some(
                    (reserva) => reserva.tipo === "vpo" && reserva.status === "ativa"
                )
            );
        }

        if (semInstrutor === "true") {
            filtradas = filtradas.filter(
                (item) => !item.instrutorId && !item.turmaDisciplina?.instrutorPadraoId
            );
        }

        return res.status(200).json(filtradas);
    } catch (error) {
        next(error);
    }
}