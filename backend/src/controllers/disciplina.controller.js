import { z } from "zod";
import prisma from "../prisma/client.js";

const createDisciplinaSchema = z.object({
    nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres."),
    cursoId: z.coerce.number().int().positive("Curso inválido."),
    quantidadeEncontros: z.coerce.number().int().positive("Quantidade de encontros inválida."),
    modulo: z.coerce.number().int().min(1).max(4),
    ordem: z.coerce.number().int().positive("Ordem inválida."),
});

export async function listDisciplinas(req, res, next) {
    try {
        const disciplinas = await prisma.disciplina.findMany({
            include: {
                curso: true,
            },
            orderBy: [
                { cursoId: "asc" },
                { ordem: "asc" },
                { id: "asc" },
            ],
        });

        return res.status(200).json(disciplinas);
    } catch (error) {
        next(error);
    }
}

export async function createDisciplina(req, res, next) {
    try {
        const data = createDisciplinaSchema.parse(req.body);

        const curso = await prisma.curso.findUnique({
            where: { id: data.cursoId },
        });

        if (!curso) {
            return res.status(404).json({
                message: "Curso não encontrado.",
            });
        }

        const disciplina = await prisma.disciplina.create({
            data: {
                nome: data.nome,
                cursoId: data.cursoId,
                quantidadeEncontros: data.quantidadeEncontros,
                modulo: data.modulo,
                ordem: data.ordem,
                ativo: true,
            },
            include: {
                curso: true,
            },
        });

        return res.status(201).json(disciplina);
    } catch (error) {
        next(error);
    }
}

export async function updateDisciplina(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = req.body;

        const disciplina = await prisma.disciplina.update({
            where: { id },
            data,
        });

        return res.status(200).json(disciplina);
    } catch (error) {
        next(error);
    }
}

export async function updateDisciplinaStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { ativo } = req.body;

        const disciplina = await prisma.disciplina.update({
            where: { id },
            data: { ativo },
        });

        return res.status(200).json(disciplina);
    } catch (error) {
        next(error);
    }
}