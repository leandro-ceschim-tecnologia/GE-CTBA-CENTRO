import { z } from "zod";

const ofertaPublicoRoleEnum = z.enum([
    "ALUNO",
    "INSTRUTOR",
    "COMERCIAL",
    "SECRETARIA",
    "COORDENACAO",
    "COORDSETOR",
    "PEDAGOGICO",
    "ADMIN",
]);

const ofertaTipoEnum = z.enum([
    "CURSO_INTENSIVO",
    "PALESTRA",
    "WORKSHOP",
    "TREINAMENTO",
    "MINICURSO",
    "EVENTO",
    "SEGUNDA_CHAMADA_RECUPERACAO",
    "OUTRO",
]);

const ofertaStatusEnum = z.enum([
    "RASCUNHO",
    "PUBLICADO",
    "ENCERRADO",
    "CANCELADO",
]);

const ofertaInscricaoStatusEnum = z.enum([
    "INSCRITO",
    "CANCELADO",
    "PRESENTE",
    "AUSENTE",
    "LISTA_ESPERA",
]);

const espacoSchema = z
    .object({
        salaId: z.coerce.number().int().positive().optional().nullable(),
        textoLivre: z.string().trim().max(200).optional().nullable(),
        observacoes: z.string().trim().max(500).optional().nullable(),
    })
    .superRefine((value, ctx) => {
        const temSalaId = Number.isInteger(value?.salaId);
        const temTextoLivre =
            typeof value?.textoLivre === "string" && value.textoLivre.trim().length > 0;

        if (!temSalaId && !temTextoLivre) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe uma sala ou um texto livre para o espaço.",
                path: ["textoLivre"],
            });
        }
    });

const baseOfertaSchema = z.object({
    titulo: z.string().trim().min(3, "Informe o título da oferta."),
    tipo: ofertaTipoEnum,

    descricao: z.string().trim().optional().nullable(),
    observacoes: z.string().trim().optional().nullable(),
    local: z.string().trim().max(200).optional().nullable(),

    dataEvento: z.string().min(1, "Informe a data do evento."),
    horaInicio: z.string().trim().optional().nullable(),
    horaFim: z.string().trim().optional().nullable(),

    inicioInscricoes: z.string().trim().optional().nullable(),
    fimInscricoes: z.string().trim().optional().nullable(),

    vagas: z.coerce.number().int().nonnegative().optional().nullable(),
    permiteInscricao: z.boolean().default(true),
    possuiCertificacao: z.boolean().default(false),

    cargaHoraria: z.coerce.number().int().nonnegative().optional().nullable(),
    temaCertificado: z.string().trim().optional().nullable(),

    instrutorId: z.coerce.number().int().positive().optional().nullable(),

    publicosAlvo: z
        .array(ofertaPublicoRoleEnum)
        .min(1, "Selecione ao menos um público-alvo."),

    espacos: z.array(espacoSchema).optional().default([]),
});

export const createOfertaSchema = baseOfertaSchema.superRefine((data, ctx) => {
    if (data.possuiCertificacao) {
        if (!data.cargaHoraria || data.cargaHoraria <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Informe a carga horária para ofertas com certificação.",
                path: ["cargaHoraria"],
            });
        }
    }

    if (data.inicioInscricoes && data.fimInscricoes) {
        const inicio = new Date(`${data.inicioInscricoes}T00:00:00`);
        const fim = new Date(`${data.fimInscricoes}T00:00:00`);

        if (inicio > fim) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "A data inicial de inscrição não pode ser maior que a data final.",
                path: ["fimInscricoes"],
            });
        }
    }
});

export const updateOfertaSchema = baseOfertaSchema.partial().superRefine((data, ctx) => {
    if (
        data.possuiCertificacao === true &&
        data.cargaHoraria !== undefined &&
        data.cargaHoraria !== null &&
        data.cargaHoraria <= 0
    ) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A carga horária deve ser maior que zero.",
            path: ["cargaHoraria"],
        });
    }

    if (data.inicioInscricoes && data.fimInscricoes) {
        const inicio = new Date(`${data.inicioInscricoes}T00:00:00`);
        const fim = new Date(`${data.fimInscricoes}T00:00:00`);

        if (inicio > fim) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "A data inicial de inscrição não pode ser maior que a data final.",
                path: ["fimInscricoes"],
            });
        }
    }
});

export const updateStatusSchema = z.object({
    status: ofertaStatusEnum,
});

export const updateInscricaoSchema = z.object({
    status: ofertaInscricaoStatusEnum.optional(),
    presenca: z.boolean().optional(),
    observacoes: z.string().trim().max(1000).optional(),
    certificadoEmitido: z.boolean().optional(),
});