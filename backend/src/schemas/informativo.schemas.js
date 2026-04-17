import { z } from "zod";

const publicoRoleEnum = z.enum([
    "ALUNO",
    "INSTRUTOR",
    "COORDENACAO",
    "COORDSETOR",
    "PEDAGOGICO",
    "ADMIN",
    "COMERCIAL",
    "SECRETARIA",
]);

const prioridadeEnum = z.enum(["ALTA", "MEDIA", "BAIXA"]);
const statusEnum = z.enum(["RASCUNHO", "PUBLICADO", "INATIVO", "EXPIRADO"]);

const idArraySchema = z.array(z.coerce.number().int().positive()).optional().default([]);

const baseInformativoSchema = z.object({
    titulo: z.string().min(3, "Título obrigatório."),
    descricao: z.string().min(3, "Descrição obrigatória."),
    prioridade: prioridadeEnum.default("MEDIA"),
    status: statusEnum.optional().default("RASCUNHO"),

    dataPublicacao: z.string().optional(),
    dataExpiracao: z.string().optional(),

    publicos: z
        .array(publicoRoleEnum)
        .min(1, "Selecione ao menos um público-alvo."),

    cursoIds: idArraySchema,
    turmaIds: idArraySchema,
    destinatarioIds: idArraySchema,
});

export const createInformativoSchema = baseInformativoSchema;

export const updateInformativoSchema = baseInformativoSchema.partial();

export const updateInformativoStatusSchema = z.object({
    status: z.enum(["RASCUNHO", "PUBLICADO", "INATIVO"]),
});