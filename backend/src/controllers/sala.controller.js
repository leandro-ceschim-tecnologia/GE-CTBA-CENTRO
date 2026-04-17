import { z } from "zod";
import prisma from "../prisma/client.js";

const salaSchema = z.object({
    nome: z.string().trim().min(2, "Nome da sala deve ter ao menos 2 caracteres."),
    capacidade: z.coerce.number().int().nonnegative().optional().nullable(),
    bloco: z.string().trim().optional().nullable(),
    ordem: z.coerce.number().int().nonnegative().optional().default(0),
});

const statusSchema = z.object({
    ativo: z.boolean(),
});

export async function listSalas(req, res, next) {
    try {
        const salas = await prisma.sala.findMany({
            orderBy: [
                { ordem: "asc" },
                { nome: "asc" },
            ],
        });

        return res.status(200).json(salas);
    } catch (error) {
        next(error);
    }
}

export async function getSalaById(req, res, next) {
    try {
        const id = Number(req.params.id);

        const sala = await prisma.sala.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        ensalamentos: true,
                        ofertasEspaco: true,
                    },
                },
            },
        });

        if (!sala) {
            return res.status(404).json({
                message: "Sala não encontrada.",
            });
        }

        return res.status(200).json(sala);
    } catch (error) {
        next(error);
    }
}

export async function createSala(req, res, next) {
    try {
        const data = salaSchema.parse(req.body);

        const salaExistente = await prisma.sala.findFirst({
            where: {
                nome: {
                    equals: data.nome,
                    mode: "insensitive",
                },
            },
        });

        if (salaExistente) {
            return res.status(400).json({
                message: "Já existe uma sala cadastrada com esse nome.",
            });
        }

        const sala = await prisma.sala.create({
            data: {
                nome: data.nome,
                capacidade:
                    data.capacidade === undefined ? null : data.capacidade,
                bloco: data.bloco || null,
                ordem: data.ordem ?? 0,
                ativo: true,
            },
        });

        return res.status(201).json(sala);
    } catch (error) {
        next(error);
    }
}

export async function updateSala(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = salaSchema.parse(req.body);

        const salaExistente = await prisma.sala.findUnique({
            where: { id },
        });

        if (!salaExistente) {
            return res.status(404).json({
                message: "Sala não encontrada.",
            });
        }

        const duplicada = await prisma.sala.findFirst({
            where: {
                id: { not: id },
                nome: {
                    equals: data.nome,
                    mode: "insensitive",
                },
            },
        });

        if (duplicada) {
            return res.status(400).json({
                message: "Já existe outra sala cadastrada com esse nome.",
            });
        }

        const sala = await prisma.sala.update({
            where: { id },
            data: {
                nome: data.nome,
                capacidade:
                    data.capacidade === undefined ? null : data.capacidade,
                bloco: data.bloco || null,
                ordem: data.ordem ?? 0,
            },
        });

        return res.status(200).json(sala);
    } catch (error) {
        next(error);
    }
}

export async function updateSalaStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = statusSchema.parse(req.body);

        const salaExistente = await prisma.sala.findUnique({
            where: { id },
        });

        if (!salaExistente) {
            return res.status(404).json({
                message: "Sala não encontrada.",
            });
        }

        const sala = await prisma.sala.update({
            where: { id },
            data: {
                ativo: data.ativo,
            },
        });

        return res.status(200).json(sala);
    } catch (error) {
        next(error);
    }
}

export async function deleteSala(req, res, next) {
    try {
        const id = Number(req.params.id);

        const salaExistente = await prisma.sala.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        ensalamentos: true,
                        ofertasEspaco: true,
                    },
                },
            },
        });

        if (!salaExistente) {
            return res.status(404).json({
                message: "Sala não encontrada.",
            });
        }

        const possuiVinculos =
            salaExistente._count.ensalamentos > 0 ||
            salaExistente._count.ofertasEspaco > 0;

        if (possuiVinculos) {
            const salaInativada = await prisma.sala.update({
                where: { id },
                data: { ativo: false },
            });

            return res.status(200).json({
                message:
                    "A sala possui vínculos com ensalamento ou ofertas e não pode ser excluída fisicamente. Ela foi inativada com sucesso.",
                softDeleted: true,
                sala: salaInativada,
            });
        }

        await prisma.sala.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Sala excluída com sucesso.",
            softDeleted: false,
        });
    } catch (error) {
        next(error);
    }
}