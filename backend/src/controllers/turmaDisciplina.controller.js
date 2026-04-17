import { z } from "zod";
import prisma from "../prisma/client.js";

const createTurmaDisciplinaSchema = z.object({
    turmaId: z.coerce.number().int().positive("Turma inválida."),
    disciplinaId: z.coerce.number().int().positive("Disciplina inválida."),
    ordem: z.coerce.number().int().positive("Ordem inválida."),
    modulo: z.coerce.number().int().min(1).max(4),
    quantidadeEncontros: z.coerce.number().int().positive("Quantidade de encontros inválida."),
});

const instrutorPadraoSchema = z.object({
    instrutorId: z.coerce.number().int().positive().nullable(),
});

const updateTurmaDisciplinaSchema = z.object({
    modulo: z.coerce.number().int().min(1).max(4),
    quantidadeEncontros: z.coerce.number().int().positive("Quantidade de encontros inválida."),
});

const syncTurmaSchema = z.object({
    turmaId: z.coerce.number().int().positive("Turma inválida."),
});

const moverTurmaDisciplinaSchema = z.object({
    direcao: z.enum(["cima", "baixo"], {
        errorMap: () => ({ message: "Direção inválida." }),
    }),
});

async function syncTurmaDisciplinasInterno(turmaId) {
    const turma = await prisma.turma.findUnique({
        where: { id: Number(turmaId) },
    });

    if (!turma) {
        throw new Error("Turma não encontrada.");
    }

    const disciplinasDoCurso = await prisma.disciplina.findMany({
        where: {
            cursoId: turma.cursoId,
            ativo: true,
        },
        orderBy: [{ ordem: "asc" }, { id: "asc" }],
    });

    const vinculosExistentes = await prisma.turmaDisciplina.findMany({
        where: {
            turmaId: turma.id,
        },
    });

    const disciplinaIdsExistentes = new Set(
        vinculosExistentes.map((item) => item.disciplinaId)
    );

    const novosVinculos = disciplinasDoCurso
        .filter((disciplina) => !disciplinaIdsExistentes.has(disciplina.id))
        .map((disciplina) => ({
            turmaId: turma.id,
            disciplinaId: disciplina.id,
            ordem: disciplina.ordem,
            modulo: disciplina.modulo,
            quantidadeEncontros: disciplina.quantidadeEncontros,
            ativo: true,
        }));

    if (novosVinculos.length) {
        await prisma.turmaDisciplina.createMany({
            data: novosVinculos,
        });
    }

    return novosVinculos.length;
}

function getIncludePadrao() {
    return {
        turma: {
            include: {
                curso: true,
            },
        },
        disciplina: {
            include: {
                curso: true,
            },
        },
        instrutorPadrao: {
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
            },
        },
    };
}

async function listarVinculosDaTurma(turmaId) {
    return prisma.turmaDisciplina.findMany({
        where: {
            turmaId,
            ativo: true,
        },
        include: getIncludePadrao(),
        orderBy: [{ ordem: "asc" }, { id: "asc" }],
    });
}

export async function listTurmaDisciplinas(req, res, next) {
    try {
        const turmaId = req.query.turmaId ? Number(req.query.turmaId) : null;

        const turmaDisciplinas = await prisma.turmaDisciplina.findMany({
            where: turmaId ? { turmaId } : undefined,
            include: getIncludePadrao(),
            orderBy: [{ turmaId: "asc" }, { ordem: "asc" }, { id: "asc" }],
        });

        return res.status(200).json(turmaDisciplinas);
    } catch (error) {
        next(error);
    }
}

export async function createTurmaDisciplina(req, res, next) {
    try {
        const data = createTurmaDisciplinaSchema.parse(req.body);

        const turma = await prisma.turma.findUnique({
            where: { id: data.turmaId },
            include: { curso: true },
        });

        if (!turma) {
            return res.status(404).json({ message: "Turma não encontrada." });
        }

        const disciplina = await prisma.disciplina.findUnique({
            where: { id: data.disciplinaId },
            include: { curso: true },
        });

        if (!disciplina) {
            return res.status(404).json({ message: "Disciplina não encontrada." });
        }

        if (turma.cursoId !== disciplina.cursoId) {
            return res.status(400).json({
                message: "A disciplina deve pertencer ao mesmo curso da turma.",
            });
        }

        const existing = await prisma.turmaDisciplina.findUnique({
            where: {
                turmaId_disciplinaId: {
                    turmaId: data.turmaId,
                    disciplinaId: data.disciplinaId,
                },
            },
        });

        if (existing) {
            return res.status(409).json({
                message: "Essa disciplina já está vinculada à turma.",
            });
        }

        const turmaDisciplina = await prisma.turmaDisciplina.create({
            data: {
                turmaId: data.turmaId,
                disciplinaId: data.disciplinaId,
                ordem: data.ordem,
                modulo: data.modulo,
                quantidadeEncontros: data.quantidadeEncontros,
                ativo: true,
            },
            include: getIncludePadrao(),
        });

        return res.status(201).json(turmaDisciplina);
    } catch (error) {
        next(error);
    }
}

export async function syncTurmaDisciplinas(req, res, next) {
    try {
        const data = syncTurmaSchema.parse(req.body);

        const totalCriado = await syncTurmaDisciplinasInterno(data.turmaId);

        const vinculos = await prisma.turmaDisciplina.findMany({
            where: { turmaId: data.turmaId },
            include: getIncludePadrao(),
            orderBy: [{ ordem: "asc" }, { id: "asc" }],
        });

        return res.status(200).json({
            message: "Disciplinas sincronizadas com sucesso.",
            totalCriado,
            vinculos,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTurmaDisciplina(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = updateTurmaDisciplinaSchema.parse(req.body);

        const existente = await prisma.turmaDisciplina.findUnique({
            where: { id },
        });

        if (!existente) {
            return res.status(404).json({
                message: "Vínculo turma-disciplina não encontrado.",
            });
        }

        const updated = await prisma.turmaDisciplina.update({
            where: { id },
            data: {
                modulo: data.modulo,
                quantidadeEncontros: data.quantidadeEncontros,
            },
            include: getIncludePadrao(),
        });

        return res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
}

export async function moverTurmaDisciplina(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { direcao } = moverTurmaDisciplinaSchema.parse(req.body);

        const vinculoAtual = await prisma.turmaDisciplina.findUnique({
            where: { id },
        });

        if (!vinculoAtual) {
            return res.status(404).json({
                message: "Vínculo turma-disciplina não encontrado.",
            });
        }

        const vinculos = await prisma.turmaDisciplina.findMany({
            where: {
                turmaId: vinculoAtual.turmaId,
                ativo: true,
            },
            orderBy: [{ ordem: "asc" }, { id: "asc" }],
        });

        const indexAtual = vinculos.findIndex((item) => item.id === id);

        if (indexAtual === -1) {
            return res.status(404).json({
                message: "Vínculo não encontrado na turma.",
            });
        }

        const novoIndex = direcao === "cima" ? indexAtual - 1 : indexAtual + 1;

        if (novoIndex < 0 || novoIndex >= vinculos.length) {
            return res.status(200).json({
                message: "Nenhuma alteração de ordem foi necessária.",
                vinculos: await listarVinculosDaTurma(vinculoAtual.turmaId),
            });
        }

        const itemAtual = vinculos[indexAtual];
        const itemDestino = vinculos[novoIndex];

        await prisma.$transaction([
            prisma.turmaDisciplina.update({
                where: { id: itemAtual.id },
                data: { ordem: itemDestino.ordem },
            }),
            prisma.turmaDisciplina.update({
                where: { id: itemDestino.id },
                data: { ordem: itemAtual.ordem },
            }),
        ]);

        const vinculosAtualizados = await listarVinculosDaTurma(vinculoAtual.turmaId);

        return res.status(200).json({
            message: "Ordem das disciplinas atualizada com sucesso.",
            vinculos: vinculosAtualizados,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteTurmaDisciplina(req, res, next) {
    try {
        const id = Number(req.params.id);

        const vinculo = await prisma.turmaDisciplina.findUnique({
            where: { id },
            include: {
                turma: true,
                disciplina: true,
            },
        });

        if (!vinculo) {
            return res.status(404).json({
                message: "Vínculo turma-disciplina não encontrado.",
            });
        }

        const aulas = await prisma.cronogramaAula.findMany({
            where: {
                turmaDisciplinaId: id,
                ativo: true,
            },
            include: {
                reservas: {
                    where: {
                        status: "ativa",
                    },
                },
            },
        });

        const possuiAulaProtegida = aulas.some(
            (aula) => aula.status !== "planejada" || (aula.reservas?.length ?? 0) > 0
        );

        if (possuiAulaProtegida) {
            return res.status(400).json({
                message:
                    "Não é possível excluir esta disciplina da turma porque existem aulas já realizadas/ajustadas/canceladas ou reservas ativas vinculadas a ela.",
            });
        }

        const aulaIds = aulas.map((aula) => aula.id);

        await prisma.$transaction(async (tx) => {
            if (aulaIds.length) {
                await tx.reserva.deleteMany({
                    where: {
                        cronogramaAulaId: {
                            in: aulaIds,
                        },
                    },
                });

                await tx.cronogramaAula.deleteMany({
                    where: {
                        id: {
                            in: aulaIds,
                        },
                    },
                });
            }

            await tx.turmaDisciplina.delete({
                where: { id },
            });

            const vinculosRestantes = await tx.turmaDisciplina.findMany({
                where: {
                    turmaId: vinculo.turmaId,
                    ativo: true,
                },
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            });

            for (let index = 0; index < vinculosRestantes.length; index++) {
                const item = vinculosRestantes[index];
                await tx.turmaDisciplina.update({
                    where: { id: item.id },
                    data: { ordem: index + 1 },
                });
            }
        });

        const vinculosAtualizados = await listarVinculosDaTurma(vinculo.turmaId);

        return res.status(200).json({
            message: `Disciplina "${vinculo.disciplina?.nome}" removida da turma com sucesso.`,
            vinculos: vinculosAtualizados,
        });
    } catch (error) {
        next(error);
    }
}

export async function setInstrutorPadraoTurmaDisciplina(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = instrutorPadraoSchema.parse(req.body);

        const turmaDisciplina = await prisma.turmaDisciplina.findUnique({
            where: { id },
        });

        if (!turmaDisciplina) {
            return res.status(404).json({
                message: "Vínculo turma-disciplina não encontrado.",
            });
        }

        if (data.instrutorId !== null) {
            const instrutor = await prisma.user.findUnique({
                where: { id: data.instrutorId },
            });

            if (!instrutor) {
                return res.status(404).json({
                    message: "Instrutor não encontrado.",
                });
            }

            if (!["instrutor", "coordenacao"].includes(instrutor.role)) {
                return res.status(400).json({
                    message: "Usuário selecionado não é um instrutor válido.",
                });
            }
        }

        const updated = await prisma.turmaDisciplina.update({
            where: { id },
            data: {
                instrutorPadraoId: data.instrutorId,
            },
            include: getIncludePadrao(),
        });

        return res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
}

export async function replicarInstrutorPadraoNasAulas(req, res, next) {
    try {
        const id = Number(req.params.id);

        const turmaDisciplina = await prisma.turmaDisciplina.findUnique({
            where: { id },
        });

        if (!turmaDisciplina) {
            return res.status(404).json({
                message: "Vínculo turma-disciplina não encontrado.",
            });
        }

        if (!turmaDisciplina.instrutorPadraoId) {
            return res.status(400).json({
                message: "Defina um instrutor padrão antes de replicar.",
            });
        }

        const result = await prisma.cronogramaAula.updateMany({
            where: {
                turmaDisciplinaId: id,
                instrutorId: null,
                status: "planejada",
                ativo: true,
            },
            data: {
                instrutorId: turmaDisciplina.instrutorPadraoId,
            },
        });

        return res.status(200).json({
            message: "Instrutor replicado com sucesso.",
            totalAtualizado: result.count,
        });
    } catch (error) {
        next(error);
    }
}