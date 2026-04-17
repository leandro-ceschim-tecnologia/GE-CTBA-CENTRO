import { z } from "zod";
import prisma from "../prisma/client.js";

const createCursoSchema = z.object({
    nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres."),
});

export async function listCursos(req, res, next) {
    try {
        const cursos = await prisma.curso.findMany({
            orderBy: { id: "asc" },
        });

        return res.status(200).json(cursos);
    } catch (error) {
        next(error);
    }
}

export async function createCurso(req, res, next) {
    try {
        const data = createCursoSchema.parse(req.body);

        const curso = await prisma.curso.create({
            data: {
                nome: data.nome,
                ativo: true,
            },
        });

        return res.status(201).json(curso);
    } catch (error) {
        next(error);
    }
}

export async function updateCurso(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { nome } = req.body;

        const curso = await prisma.curso.update({
            where: { id },
            data: { nome },
        });

        return res.status(200).json(curso);
    } catch (error) {
        next(error);
    }
}

export async function updateCursoStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { ativo } = req.body;

        const curso = await prisma.curso.update({
            where: { id },
            data: { ativo },
        });

        return res.status(200).json(curso);
    } catch (error) {
        next(error);
    }
}