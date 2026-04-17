import { z } from "zod";
import prisma from "../prisma/client.js";

const recessoSchema = z.object({
    titulo: z.string().min(2, "Título deve ter ao menos 2 caracteres."),
    dataInicio: z.string().min(1, "Data de início obrigatória."),
    dataFim: z.string().min(1, "Data de fim obrigatória."),
    tipo: z.string().min(2, "Tipo obrigatório."),
    aplicaTodosCursos: z.boolean(),
    cursoId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
});

const importRecessoItemSchema = z.object({
    titulo: z.string().min(2, "Título deve ter ao menos 2 caracteres."),
    dataInicio: z.string().min(1, "Data de início obrigatória."),
    dataFim: z.string().min(1, "Data de fim obrigatória."),
    tipo: z.enum(["feriado", "recesso", "ata", "outro"]),
    aplicaTodosCursos: z.boolean(),
    cursoNome: z.string().optional().nullable(),
});

const importRecessosSchema = z.object({
    itens: z.array(importRecessoItemSchema).min(1, "Nenhum item enviado para importação."),
});

const statusSchema = z.object({
    ativo: z.boolean(),
});

function parseLocalDate(dateString) {
    if (!dateString) return null;

    if (dateString instanceof Date) {
        return new Date(
            dateString.getFullYear(),
            dateString.getMonth(),
            dateString.getDate()
        );
    }

    const match = String(dateString).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
        const [, year, month, day] = match;
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    const parsed = new Date(dateString);

    return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
    );
}

function normalizeString(value) {
    if (value == null) return "";
    return String(value).trim();
}

function normalizeCursoNome(value) {
    return normalizeString(value).toLowerCase();
}

export async function listRecessos(req, res, next) {
    try {
        const recessos = await prisma.recesso.findMany({
            include: {
                curso: true,
            },
            orderBy: [{ dataInicio: "asc" }, { id: "asc" }],
        });

        return res.status(200).json(recessos);
    } catch (error) {
        next(error);
    }
}

export async function createRecesso(req, res, next) {
    try {
        const data = recessoSchema.parse(req.body);

        let cursoId = null;

        if (!data.aplicaTodosCursos) {
            if (!data.cursoId) {
                return res.status(400).json({
                    message:
                        "Selecione um curso ou marque que o recesso aplica para todos os cursos.",
                });
            }

            const curso = await prisma.curso.findUnique({
                where: { id: Number(data.cursoId) },
            });

            if (!curso) {
                return res.status(404).json({
                    message: "Curso não encontrado.",
                });
            }

            cursoId = Number(data.cursoId);
        }

        const recesso = await prisma.recesso.create({
            data: {
                titulo: data.titulo,
                dataInicio: parseLocalDate(data.dataInicio),
                dataFim: parseLocalDate(data.dataFim),
                tipo: data.tipo,
                aplicaTodosCursos: data.aplicaTodosCursos,
                cursoId,
                ativo: true,
            },
            include: {
                curso: true,
            },
        });

        return res.status(201).json(recesso);
    } catch (error) {
        next(error);
    }
}

export async function importRecessos(req, res, next) {
    try {
        const data = importRecessosSchema.parse(req.body);

        const cursos = await prisma.curso.findMany({
            select: {
                id: true,
                nome: true,
            },
        });

        const cursoMap = new Map(
            cursos.map((curso) => [normalizeCursoNome(curso.nome), curso])
        );

        const erros = [];
        const itensValidos = [];

        data.itens.forEach((item, index) => {
            const linha = index + 2; // cabeçalho = linha 1

            try {
                const titulo = normalizeString(item.titulo);
                const tipo = normalizeString(item.tipo).toLowerCase();
                const cursoNome = normalizeString(item.cursoNome);
                const dataInicio = normalizeString(item.dataInicio);
                const dataFim = normalizeString(item.dataFim);

                const parsed = importRecessoItemSchema.parse({
                    titulo,
                    dataInicio,
                    dataFim,
                    tipo,
                    aplicaTodosCursos: item.aplicaTodosCursos,
                    cursoNome,
                });

                const dataInicioObj = parseLocalDate(parsed.dataInicio);
                const dataFimObj = parseLocalDate(parsed.dataFim);

                if (!dataInicioObj || Number.isNaN(dataInicioObj.getTime())) {
                    throw new Error("Data de início inválida.");
                }

                if (!dataFimObj || Number.isNaN(dataFimObj.getTime())) {
                    throw new Error("Data de fim inválida.");
                }

                if (dataFimObj < dataInicioObj) {
                    throw new Error("A data fim não pode ser menor que a data início.");
                }

                let cursoId = null;

                if (!parsed.aplicaTodosCursos) {
                    if (!cursoNome) {
                        throw new Error(
                            "Informe o cursoNome quando aplicaTodosCursos for false."
                        );
                    }

                    const cursoEncontrado = cursoMap.get(normalizeCursoNome(cursoNome));

                    if (!cursoEncontrado) {
                        throw new Error(`Curso "${cursoNome}" não encontrado.`);
                    }

                    cursoId = cursoEncontrado.id;
                }

                itensValidos.push({
                    titulo: parsed.titulo,
                    dataInicio: dataInicioObj,
                    dataFim: dataFimObj,
                    tipo: parsed.tipo,
                    aplicaTodosCursos: parsed.aplicaTodosCursos,
                    cursoId,
                    ativo: true,
                });
            } catch (error) {
                erros.push({
                    linha,
                    titulo: item?.titulo || "",
                    message: error.message || "Erro ao validar linha.",
                });
            }
        });

        if (erros.length) {
            return res.status(400).json({
                message: "Foram encontrados erros no arquivo. Corrija e tente novamente.",
                totalRecebido: data.itens.length,
                totalValidos: itensValidos.length,
                totalErros: erros.length,
                erros,
            });
        }

        if (!itensValidos.length) {
            return res.status(400).json({
                message: "Nenhum item válido para importar.",
            });
        }

        await prisma.recesso.createMany({
            data: itensValidos,
        });

        const recessos = await prisma.recesso.findMany({
            include: {
                curso: true,
            },
            orderBy: [{ dataInicio: "asc" }, { id: "asc" }],
        });

        return res.status(201).json({
            message: `${itensValidos.length} recesso(s) importado(s) com sucesso.`,
            totalImportado: itensValidos.length,
            recessos,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateRecesso(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = recessoSchema.parse(req.body);

        const recessoExistente = await prisma.recesso.findUnique({
            where: { id },
        });

        if (!recessoExistente) {
            return res.status(404).json({
                message: "Recesso não encontrado.",
            });
        }

        let cursoId = null;

        if (!data.aplicaTodosCursos) {
            if (!data.cursoId) {
                return res.status(400).json({
                    message:
                        "Selecione um curso ou marque que o recesso aplica para todos os cursos.",
                });
            }

            const curso = await prisma.curso.findUnique({
                where: { id: Number(data.cursoId) },
            });

            if (!curso) {
                return res.status(404).json({
                    message: "Curso não encontrado.",
                });
            }

            cursoId = Number(data.cursoId);
        }

        const recesso = await prisma.recesso.update({
            where: { id },
            data: {
                titulo: data.titulo,
                dataInicio: parseLocalDate(data.dataInicio),
                dataFim: parseLocalDate(data.dataFim),
                tipo: data.tipo,
                aplicaTodosCursos: data.aplicaTodosCursos,
                cursoId,
            },
            include: {
                curso: true,
            },
        });

        return res.status(200).json(recesso);
    } catch (error) {
        next(error);
    }
}

export async function updateRecessoStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = statusSchema.parse(req.body);

        const recessoExistente = await prisma.recesso.findUnique({
            where: { id },
        });

        if (!recessoExistente) {
            return res.status(404).json({
                message: "Recesso não encontrado.",
            });
        }

        const recesso = await prisma.recesso.update({
            where: { id },
            data: {
                ativo: data.ativo,
            },
            include: {
                curso: true,
            },
        });

        return res.status(200).json(recesso);
    } catch (error) {
        next(error);
    }
}