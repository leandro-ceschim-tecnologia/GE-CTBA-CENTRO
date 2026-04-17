import { z } from "zod";

export const tarefaPedagogicaTipoEnum = z.enum([
    "LEVANTAMENTO_CH_ESTAGIO",
    "CONTATO_INSTRUTOR",
    "AJUSTE_CRONOGRAMA",
    "DOCUMENTACAO_ESTAGIO",
    "LANCAMENTO_SISTEMA",
    "CONFERENCIA_DIARIOS",
    "RESPONDER_WHATS_AD",
    "CONTATO_ALUNO",
    "EMISSAO_DOCUMENTO",
    "LIGACOES_PARA_LFR",
    "LIGACOES_PARA_LFI",
    "LIGACOES_PARA_NC_LAC",
    "LIGACOES_FALTOSOS",
    "REQUERIMENTOS_SECRETARIA",
    "SEPARAR_MATERIAL",
    "OUTRO",
]);

export const tarefaPedagogicaTurnoEnum = z.enum([
    "MANHA",
    "TARDE",
    "NOITE",
    "INTEGRAL",
    "SABADO",
]);

export const tarefaPedagogicaStatusEnum = z.enum([
    "PENDENTE",
    "EM_EXECUCAO",
    "CONCLUIDA",
    "CANCELADA",
]);

const idSchema = z.coerce.number().int().positive();

const dataSchema = z.string().min(1, "Data obrigatória.");

export const createTarefaPedagogicaSchema = z.object({
    titulo: z.string().trim().min(3, "Título obrigatório."),
    descricao: z.string().trim().optional().or(z.literal("")),
    tipo: tarefaPedagogicaTipoEnum,
    prazo: dataSchema,
    turno: tarefaPedagogicaTurnoEnum,
    responsavelId: idSchema,
    observacoes: z.string().trim().optional().or(z.literal("")),
    confirmarAutoAgendamento: z.boolean().optional().default(false),
});

export const createTarefasPedagogicasLoteSchema = z.object({
    titulo: z.string().trim().min(3, "Título obrigatório."),
    descricao: z.string().trim().optional().or(z.literal("")),
    tipo: tarefaPedagogicaTipoEnum,
    datas: z.array(dataSchema).min(1, "Informe ao menos uma data."),
    turno: tarefaPedagogicaTurnoEnum,
    responsavelId: idSchema,
    observacoes: z.string().trim().optional().or(z.literal("")),
});

export const updateStatusTarefaPedagogicaSchema = z.object({
    status: tarefaPedagogicaStatusEnum,
});

export const tarefaPedagogicaIdParamSchema = z.object({
    id: idSchema,
});

export const listTarefasPedagogicasQuerySchema = z.object({
    responsavelId: z.coerce.number().int().positive().optional(),
    status: tarefaPedagogicaStatusEnum.optional(),
});

export const validarSugestaoPrazoLevantamentoCHSchema = z.object({
    prazoDesejado: dataSchema,
    confirmarAutoAgendamento: z.boolean().optional().default(false),
});