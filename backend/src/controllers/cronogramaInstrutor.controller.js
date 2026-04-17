import { z } from "zod";
import prisma from "../prisma/client.js";

const schema = z.object({
    instrutorId: z.coerce.number().int().positive().nullable(),
});

const schemaAPartir = z.object({
    instrutorId: z.coerce.number().int().positive().nullable(),
    atualizarPadrao: z.boolean().optional().default(false),
});

async function validarInstrutor(instrutorId) {
    if (instrutorId === null) return;

    const instrutor = await prisma.user.findUnique({
        where: { id: instrutorId },
    });

    if (!instrutor) {
        const error = new Error("Instrutor não encontrado.");
        error.status = 404;
        throw error;
    }

    if (!["instrutor", "coordenacao"].includes(instrutor.role)) {
        const error = new Error("Usuário selecionado não é um instrutor válido.");
        error.status = 400;
        throw error;
    }
}

export async function setInstrutorNaAula(req, res, next) {
    try {
        const aulaId = Number(req.params.aulaId);
        const data = schema.parse(req.body);

        await validarInstrutor(data.instrutorId);

        const aula = await prisma.cronogramaAula.update({
            where: { id: aulaId },
            data: {
                instrutorId: data.instrutorId,
            },
            include: {
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

        return res.status(200).json(aula);
    } catch (error) {
        next(error);
    }
}

export async function setInstrutorAPartirDaAula(req, res, next) {
    try {
        const aulaId = Number(req.params.aulaId);
        const data = schemaAPartir.parse(req.body);

        await validarInstrutor(data.instrutorId);

        const aulaBase = await prisma.cronogramaAula.findUnique({
            where: { id: aulaId },
        });

        if (!aulaBase) {
            return res.status(404).json({
                message: "Aula não encontrada.",
            });
        }

        const result = await prisma.cronogramaAula.updateMany({
            where: {
                turmaDisciplinaId: aulaBase.turmaDisciplinaId,
                numeroEncontroDisciplina: {
                    gte: aulaBase.numeroEncontroDisciplina,
                },
                ativo: true,
            },
            data: {
                instrutorId: data.instrutorId,
            },
        });

        if (data.atualizarPadrao) {
            await prisma.turmaDisciplina.update({
                where: { id: aulaBase.turmaDisciplinaId },
                data: {
                    instrutorPadraoId: data.instrutorId,
                },
            });
        }

        return res.status(200).json({
            message: "Instrutor atualizado a partir da aula selecionada.",
            totalAtualizado: result.count,
            atualizarPadrao: data.atualizarPadrao,
        });
    } catch (error) {
        next(error);
    }
}