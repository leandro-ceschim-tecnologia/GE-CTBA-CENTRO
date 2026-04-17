import { z } from "zod";
import prisma from "../prisma/client.js";

const updateAulaSchema = z.object({
    status: z.enum(["planejada", "realizada", "cancelada", "ajustada"]).optional(),
    observacoes: z.string().nullable().optional(),
});

export async function updateCronogramaAula(req, res, next) {
    try {
        const aulaId = Number(req.params.aulaId);
        const data = updateAulaSchema.parse(req.body);

        const aulaExistente = await prisma.cronogramaAula.findUnique({
            where: { id: aulaId },
        });

        if (!aulaExistente) {
            return res.status(404).json({
                message: "Aula não encontrada.",
            });
        }

        const aula = await prisma.cronogramaAula.update({
            where: { id: aulaId },
            data: {
                ...(data.status !== undefined ? { status: data.status } : {}),
                ...(data.observacoes !== undefined ? { observacoes: data.observacoes } : {}),
            },
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

        return res.status(200).json(aula);
    } catch (error) {
        next(error);
    }
}