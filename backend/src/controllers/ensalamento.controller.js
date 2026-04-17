import { z } from "zod";
import prisma from "../prisma/client.js";

const ensalamentoSchema = z
    .object({
        salaId: z.coerce.number().int().positive("Sala inválida."),
        turmaId: z.coerce.number().int().positive().optional().nullable(),
        diaSemana: z.enum([
            "SEGUNDA",
            "TERCA",
            "QUARTA",
            "QUINTA",
            "SEXTA",
            "SABADO",
        ]),
        periodo: z.enum(["MANHA", "TARDE", "NOITE"]),
        textoLivre: z.string().trim().optional().nullable(),
        observacoes: z.string().trim().optional().nullable(),
        ativo: z.boolean().optional().default(true),
    })
    .superRefine((data, ctx) => {
        const temTurma = Number.isInteger(data.turmaId);
        const temTextoLivre =
            typeof data.textoLivre === "string" && data.textoLivre.trim().length > 0;

        if (!temTurma && !temTextoLivre) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe uma turma ou um texto livre.",
                path: ["textoLivre"],
            });
        }
    });

const ensalamentoLoteSchema = z.object({
    itens: z
        .array(ensalamentoSchema)
        .min(1, "Selecione ao menos uma combinação para o cadastro em lote."),
});

export async function listEnsalamentos(req, res, next) {
    try {
        const ensalamentos = await prisma.ensalamentoItem.findMany({
            include: {
                sala: true,
                turma: {
                    include: {
                        curso: true,
                    },
                },
            },
            orderBy: [
                {
                    salaId: "asc",
                },
                {
                    diaSemana: "asc",
                },
                {
                    periodo: "asc",
                },
            ],
        });

        const salas = await prisma.sala.findMany({
            where: { ativo: true },
            select: {
                id: true,
                nome: true,
                ordem: true,
            },
        });

        const salaMap = new Map(salas.map((sala) => [sala.id, sala]));

        ensalamentos.sort((a, b) => {
            const salaA = salaMap.get(a.salaId);
            const salaB = salaMap.get(b.salaId);

            const ordemA = salaA?.ordem ?? 0;
            const ordemB = salaB?.ordem ?? 0;

            if (ordemA !== ordemB) return ordemA - ordemB;

            const nomeA = salaA?.nome || "";
            const nomeB = salaB?.nome || "";
            if (nomeA !== nomeB) return nomeA.localeCompare(nomeB);

            if (a.diaSemana !== b.diaSemana) {
                return String(a.diaSemana).localeCompare(String(b.diaSemana));
            }

            return String(a.periodo).localeCompare(String(b.periodo));
        });

        return res.status(200).json(ensalamentos);
    } catch (error) {
        next(error);
    }
}

export async function getEnsalamentoById(req, res, next) {
    try {
        const id = Number(req.params.id);

        const ensalamento = await prisma.ensalamentoItem.findUnique({
            where: { id },
            include: {
                sala: true,
                turma: {
                    include: {
                        curso: true,
                    },
                },
            },
        });

        if (!ensalamento) {
            return res.status(404).json({
                message: "Item de ensalamento não encontrado.",
            });
        }

        return res.status(200).json(ensalamento);
    } catch (error) {
        next(error);
    }
}

export async function createEnsalamento(req, res, next) {
    try {
        const data = ensalamentoSchema.parse(req.body);

        const sala = await prisma.sala.findUnique({
            where: { id: data.salaId },
        });

        if (!sala) {
            return res.status(404).json({
                message: "Sala não encontrada.",
            });
        }

        if (data.turmaId) {
            const turma = await prisma.turma.findUnique({
                where: { id: data.turmaId },
            });

            if (!turma) {
                return res.status(404).json({
                    message: "Turma não encontrada.",
                });
            }
        }

        const existente = await prisma.ensalamentoItem.findFirst({
            where: {
                salaId: data.salaId,
                diaSemana: data.diaSemana,
                periodo: data.periodo,
            },
        });

        if (existente) {
            return res.status(400).json({
                message:
                    "Já existe um ensalamento cadastrado para esta sala, dia e período.",
            });
        }

        const ensalamento = await prisma.ensalamentoItem.create({
            data: {
                salaId: data.salaId,
                turmaId: data.turmaId ?? null,
                diaSemana: data.diaSemana,
                periodo: data.periodo,
                textoLivre: data.textoLivre?.trim() || null,
                observacoes: data.observacoes?.trim() || null,
                ativo: data.ativo ?? true,
            },
            include: {
                sala: true,
                turma: {
                    include: {
                        curso: true,
                    },
                },
            },
        });

        return res.status(201).json(ensalamento);
    } catch (error) {
        next(error);
    }
}

export async function createEnsalamentoLote(req, res, next) {
    try {
        const data = ensalamentoLoteSchema.parse(req.body);
        const itens = data.itens;

        const salaIds = [...new Set(itens.map((item) => item.salaId))];
        const turmaIds = [...new Set(itens.map((item) => item.turmaId).filter(Boolean))];

        const salas = await prisma.sala.findMany({
            where: {
                id: { in: salaIds },
            },
            select: {
                id: true,
                nome: true,
                ativo: true,
            },
        });

        const turmas = turmaIds.length
            ? await prisma.turma.findMany({
                where: {
                    id: { in: turmaIds },
                },
                select: {
                    id: true,
                    nome: true,
                    ativo: true,
                },
            })
            : [];

        const salaMap = new Map(salas.map((item) => [item.id, item]));
        const turmaMap = new Map(turmas.map((item) => [item.id, item]));

        const combinacoesUnicas = new Set();
        const created = [];
        const errors = [];

        for (const item of itens) {
            const chave = `${item.salaId}_${item.diaSemana}_${item.periodo}`;

            if (combinacoesUnicas.has(chave)) {
                errors.push({
                    salaId: item.salaId,
                    turmaId: item.turmaId ?? null,
                    diaSemana: item.diaSemana,
                    periodo: item.periodo,
                    message: "Combinação duplicada dentro do próprio lote.",
                });
                continue;
            }

            combinacoesUnicas.add(chave);

            const sala = salaMap.get(item.salaId);
            if (!sala) {
                errors.push({
                    salaId: item.salaId,
                    turmaId: item.turmaId ?? null,
                    diaSemana: item.diaSemana,
                    periodo: item.periodo,
                    message: "Sala não encontrada.",
                });
                continue;
            }

            if (sala.ativo === false) {
                errors.push({
                    salaId: item.salaId,
                    turmaId: item.turmaId ?? null,
                    diaSemana: item.diaSemana,
                    periodo: item.periodo,
                    message: "Sala inativa.",
                });
                continue;
            }

            if (item.turmaId) {
                const turma = turmaMap.get(item.turmaId);

                if (!turma) {
                    errors.push({
                        salaId: item.salaId,
                        turmaId: item.turmaId,
                        diaSemana: item.diaSemana,
                        periodo: item.periodo,
                        message: "Turma não encontrada.",
                    });
                    continue;
                }
            }

            const existente = await prisma.ensalamentoItem.findFirst({
                where: {
                    salaId: item.salaId,
                    diaSemana: item.diaSemana,
                    periodo: item.periodo,
                },
            });

            if (existente) {
                errors.push({
                    salaId: item.salaId,
                    turmaId: item.turmaId ?? null,
                    diaSemana: item.diaSemana,
                    periodo: item.periodo,
                    message: "Já existe ensalamento cadastrado para esta sala, dia e período.",
                });
                continue;
            }

            const novo = await prisma.ensalamentoItem.create({
                data: {
                    salaId: item.salaId,
                    turmaId: item.turmaId ?? null,
                    diaSemana: item.diaSemana,
                    periodo: item.periodo,
                    textoLivre: item.textoLivre?.trim() || null,
                    observacoes: item.observacoes?.trim() || null,
                    ativo: item.ativo ?? true,
                },
                include: {
                    sala: true,
                    turma: {
                        include: {
                            curso: true,
                        },
                    },
                },
            });

            created.push(novo);
        }

        return res.status(200).json({
            message:
                errors.length > 0
                    ? "Cadastro em lote concluído com pendências."
                    : "Cadastro em lote realizado com sucesso.",
            successCount: created.length,
            errorCount: errors.length,
            created,
            errors,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateEnsalamento(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = ensalamentoSchema.parse(req.body);

        const ensalamentoExistente = await prisma.ensalamentoItem.findUnique({
            where: { id },
        });

        if (!ensalamentoExistente) {
            return res.status(404).json({
                message: "Item de ensalamento não encontrado.",
            });
        }

        const sala = await prisma.sala.findUnique({
            where: { id: data.salaId },
        });

        if (!sala) {
            return res.status(404).json({
                message: "Sala não encontrada.",
            });
        }

        if (data.turmaId) {
            const turma = await prisma.turma.findUnique({
                where: { id: data.turmaId },
            });

            if (!turma) {
                return res.status(404).json({
                    message: "Turma não encontrada.",
                });
            }
        }

        const conflito = await prisma.ensalamentoItem.findFirst({
            where: {
                id: { not: id },
                salaId: data.salaId,
                diaSemana: data.diaSemana,
                periodo: data.periodo,
            },
        });

        if (conflito) {
            return res.status(400).json({
                message:
                    "Já existe outro ensalamento cadastrado para esta sala, dia e período.",
            });
        }

        const ensalamento = await prisma.ensalamentoItem.update({
            where: { id },
            data: {
                salaId: data.salaId,
                turmaId: data.turmaId ?? null,
                diaSemana: data.diaSemana,
                periodo: data.periodo,
                textoLivre: data.textoLivre?.trim() || null,
                observacoes: data.observacoes?.trim() || null,
                ativo: data.ativo ?? true,
            },
            include: {
                sala: true,
                turma: {
                    include: {
                        curso: true,
                    },
                },
            },
        });

        return res.status(200).json(ensalamento);
    } catch (error) {
        next(error);
    }
}

export async function deleteEnsalamento(req, res, next) {
    try {
        const id = Number(req.params.id);

        const ensalamentoExistente = await prisma.ensalamentoItem.findUnique({
            where: { id },
        });

        if (!ensalamentoExistente) {
            return res.status(404).json({
                message: "Item de ensalamento não encontrado.",
            });
        }

        await prisma.ensalamentoItem.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Item de ensalamento excluído com sucesso.",
        });
    } catch (error) {
        next(error);
    }
}

export async function getMeuEnsalamento(req, res, next) {
    try {
        const userId = Number(req.user?.id || req.user?.sub);

        if (!userId) {
            return res.status(401).json({
                message: "Usuário autenticado inválido.",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                turma: {
                    include: {
                        curso: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuário não encontrado.",
            });
        }

        if (!user.turmaId) {
            return res.status(200).json({
                turma: null,
                ensalamentos: [],
            });
        }

        const ensalamentos = await prisma.ensalamentoItem.findMany({
            where: {
                turmaId: user.turmaId,
                ativo: true,
            },
            include: {
                sala: true,
                turma: {
                    include: {
                        curso: true,
                    },
                },
            },
        });

        return res.status(200).json({
            turma: user.turma,
            ensalamentos,
        });
    } catch (error) {
        next(error);
    }
}