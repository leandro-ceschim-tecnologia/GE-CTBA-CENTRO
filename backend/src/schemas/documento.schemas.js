import { z } from "zod";

const cpfSchema = z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, "");
        return digits.length === 11;
    }, "CPF inválido.");

const telefoneSchema = z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, "");
        return digits.length === 10 || digits.length === 11;
    }, "Telefone inválido.");

export const emitirDocumentoSchema = z.object({
    tipo: z.enum(["DECLARACAO", "OFICIO", "REQUERIMENTO"]),
    userId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),

    titulo: z.string().min(3, "Título deve ter ao menos 3 caracteres."),
    assunto: z.string().trim().optional().nullable(),
    observacoes: z.string().trim().optional().nullable(),

    nomeSolicitante: z.string().trim().optional().nullable(),
    cpfSolicitante: cpfSchema,
    matriculaSolicitante: z.string().trim().optional().nullable(),
    fone1Solicitante: telefoneSchema,
    fone2Solicitante: telefoneSchema,
    cursoSolicitante: z.string().trim().optional().nullable(),
    turmaSolicitante: z.string().trim().optional().nullable(),

    destinatarioNome: z.string().trim().optional().nullable(),
    destinatarioCargo: z.string().trim().optional().nullable(),
    destinatarioOrgao: z.string().trim().optional().nullable(),

    variaveis: z.record(z.any()).optional().default({}),
});

export const regenerarDocumentoSchema = z.object({
    sobrescrever: z.boolean().optional().default(true),
});

export const filtroDocumentoSchema = z.object({
    tipo: z.enum(["DECLARACAO", "OFICIO", "REQUERIMENTO"]).optional(),
    cancelado: z
        .union([z.literal("true"), z.literal("false")])
        .optional(),
});

export const validarCodigoDocumentoSchema = z.object({
    codigo: z.string().min(3, "Código inválido."),
});