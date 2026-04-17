import prisma from "../prisma/client.js";

function getStartOfToday() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function normalizarAulaInstrutor(aula) {
    return {
        ...aula,
        instrutorEfetivo:
            aula.instrutor ||
            aula.turmaDisciplina?.instrutorPadrao ||
            null,
    };
}

export async function getMinhasAulasInstrutor(req, res, next) {
    try {
        const userId = Number(req.user.sub);
        const somenteFuturas = req.query.somenteFuturas === "true";

        const whereBase = {
            ativo: true,
            OR: [
                { instrutorId: userId },
                {
                    instrutorId: null,
                    turmaDisciplina: {
                        instrutorPadraoId: userId,
                    },
                },
            ],
        };

        if (somenteFuturas) {
            whereBase.data = {
                gte: getStartOfToday(),
            };
        }

        const aulas = await prisma.cronogramaAula.findMany({
            where: whereBase,
            include: {
                turma: {
                    include: {
                        curso: true,
                    },
                },
                instrutor: true,
                turmaDisciplina: {
                    include: {
                        disciplina: true,
                        instrutorPadrao: true,
                    },
                },
                reservas: true,
            },
            orderBy: [{ data: "asc" }, { numeroEncontroGeral: "asc" }],
        });

        return res.status(200).json(aulas.map(normalizarAulaInstrutor));
    } catch (error) {
        next(error);
    }
}

export async function getMinhasAulasAluno(req, res, next) {
    try {
        const userId = Number(req.user.sub);
        const somenteFuturas = req.query.somenteFuturas === "true";

        const aluno = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                turma: true,
            },
        });

        if (!aluno) {
            return res.status(404).json({
                message: "Usuário não encontrado.",
            });
        }

        if (!aluno.turmaId) {
            return res.status(400).json({
                message: "Aluno não está vinculado a nenhuma turma.",
            });
        }

        const whereBase = {
            turmaId: aluno.turmaId,
            ativo: true,
        };

        if (somenteFuturas) {
            whereBase.data = {
                gte: getStartOfToday(),
            };
        }

        const aulas = await prisma.cronogramaAula.findMany({
            where: whereBase,
            include: {
                turma: {
                    include: {
                        curso: true,
                    },
                },
                instrutor: true,
                turmaDisciplina: {
                    include: {
                        disciplina: true,
                        instrutorPadrao: true,
                    },
                },
                reservas: true,
            },
            orderBy: [{ data: "asc" }, { numeroEncontroGeral: "asc" }],
        });

        return res.status(200).json(aulas.map(normalizarAulaInstrutor));
    } catch (error) {
        next(error);
    }
}