import { z } from "zod";
import prisma from "../prisma/client.js";

const turmaSchema = z.object({
    nome: z.string().min(2, "Nome da turma deve ter ao menos 2 caracteres."),
    turno: z.enum(["manha", "tarde", "noite", "sabado"]),
    cursoId: z.coerce.number().int().positive("Curso inválido."),
    dataInicio: z.string().min(1, "Data de início obrigatória."),
    diasAula: z.array(z.string()).min(1, "Informe ao menos um dia de aula."),
    datasPuladas: z.array(z.string()).optional().default([]),

    tipoHorario: z.enum(["somente_semana", "somente_sabado", "semana_e_sabado"]),
    horarioSemanaInicio: z.string().optional().nullable(),
    horarioSemanaFim: z.string().optional().nullable(),
    horarioSabadoInicio: z.string().optional().nullable(),
    horarioSabadoFim: z.string().optional().nullable(),
    sabadoIntegral: z.boolean().optional().default(false),
});

const statusSchema = z.object({
    ativo: z.boolean(),
});

function toDateOnly(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export async function listTurmas(req, res, next) {
    try {
        const turmas = await prisma.turma.findMany({
            include: {
                curso: true,
                _count: {
                    select: {
                        disciplinas: true,
                        cronogramaAulas: true,
                    },
                },
            },
            orderBy: {
                id: "asc",
            },
        });

        return res.status(200).json(turmas);
    } catch (error) {
        next(error);
    }
}

export async function getTurmaById(req, res, next) {
    try {
        const id = Number(req.params.id);

        const turma = await prisma.turma.findUnique({
            where: { id },
            include: {
                curso: true,
                disciplinas: {
                    include: {
                        disciplina: true,
                    },
                    orderBy: {
                        ordem: "asc",
                    },
                },
                cronogramaAulas: {
                    orderBy: {
                        data: "asc",
                    },
                    take: 20,
                },
            },
        });

        if (!turma) {
            return res.status(404).json({
                message: "Turma não encontrada.",
            });
        }

        return res.status(200).json(turma);
    } catch (error) {
        next(error);
    }
}

export async function createTurma(req, res, next) {
    try {
        const data = turmaSchema.parse(req.body);

        const curso = await prisma.curso.findUnique({
            where: { id: data.cursoId },
        });

        if (!curso) {
            return res.status(404).json({
                message: "Curso não encontrado.",
            });
        }

        const turma = await prisma.turma.create({
            data: {
                nome: data.nome,
                turno: data.turno,
                cursoId: data.cursoId,
                dataInicio: toDateOnly(data.dataInicio),
                diasAula: data.diasAula,
                datasPuladas: data.datasPuladas ?? [],
                tipoHorario: data.tipoHorario,
                horarioSemanaInicio: data.horarioSemanaInicio || null,
                horarioSemanaFim: data.horarioSemanaFim || null,
                horarioSabadoInicio: data.horarioSabadoInicio || null,
                horarioSabadoFim: data.horarioSabadoFim || null,
                sabadoIntegral: data.sabadoIntegral ?? false,
                ativo: true,
            },
            include: {
                curso: true,
                _count: {
                    select: {
                        disciplinas: true,
                        cronogramaAulas: true,
                    },
                },
            },
        });

        return res.status(201).json(turma);
    } catch (error) {
        next(error);
    }
}

export async function updateTurma(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = turmaSchema.parse(req.body);

        const turmaExistente = await prisma.turma.findUnique({
            where: { id },
        });

        if (!turmaExistente) {
            return res.status(404).json({
                message: "Turma não encontrada.",
            });
        }

        const curso = await prisma.curso.findUnique({
            where: { id: data.cursoId },
        });

        if (!curso) {
            return res.status(404).json({
                message: "Curso não encontrado.",
            });
        }

        const turma = await prisma.turma.update({
            where: { id },
            data: {
                nome: data.nome,
                turno: data.turno,
                cursoId: data.cursoId,
                dataInicio: toDateOnly(data.dataInicio),
                diasAula: data.diasAula,
                datasPuladas: data.datasPuladas ?? turmaExistente.datasPuladas ?? [],
                tipoHorario: data.tipoHorario,
                horarioSemanaInicio: data.horarioSemanaInicio || null,
                horarioSemanaFim: data.horarioSemanaFim || null,
                horarioSabadoInicio: data.horarioSabadoInicio || null,
                horarioSabadoFim: data.horarioSabadoFim || null,
                sabadoIntegral: data.sabadoIntegral ?? false,
            },
            include: {
                curso: true,
                _count: {
                    select: {
                        disciplinas: true,
                        cronogramaAulas: true,
                    },
                },
            },
        });

        return res.status(200).json(turma);
    } catch (error) {
        next(error);
    }
}

export async function updateTurmaStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = statusSchema.parse(req.body);

        const turmaExistente = await prisma.turma.findUnique({
            where: { id },
        });

        if (!turmaExistente) {
            return res.status(404).json({
                message: "Turma não encontrada.",
            });
        }

        const turma = await prisma.turma.update({
            where: { id },
            data: {
                ativo: data.ativo,
            },
            include: {
                curso: true,
                _count: {
                    select: {
                        disciplinas: true,
                        cronogramaAulas: true,
                    },
                },
            },
        });

        return res.status(200).json(turma);
    } catch (error) {
        next(error);
    }
}

export async function deleteTurma(req, res, next) {
    try {
        const id = Number(req.params.id);

        const turmaExistente = await prisma.turma.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        disciplinas: true,
                        cronogramaAulas: true,
                    },
                },
            },
        });

        if (!turmaExistente) {
            return res.status(404).json({
                message: "Turma não encontrada.",
            });
        }

        const possuiVinculos =
            turmaExistente._count.disciplinas > 0 ||
            turmaExistente._count.cronogramaAulas > 0;

        if (possuiVinculos) {
            const turmaInativada = await prisma.turma.update({
                where: { id },
                data: { ativo: false },
                include: {
                    curso: true,
                    _count: {
                        select: {
                            disciplinas: true,
                            cronogramaAulas: true,
                        },
                    },
                },
            });

            return res.status(200).json({
                message:
                    "A turma possui vínculos e não pode ser excluída fisicamente. Ela foi inativada com sucesso.",
                softDeleted: true,
                turma: turmaInativada,
            });
        }

        await prisma.turma.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Turma excluída com sucesso.",
            softDeleted: false,
        });
    } catch (error) {
        next(error);
    }
}