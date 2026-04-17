import { z } from "zod";
import {
    cancelarOcorrenciaEvasao,
    finalizarOcorrenciaEvasao,
    getHistoricoEvasaoAluno,
    listarOcorrenciasEvasao,
    marcarOcorrenciaComoLancadaSistema,
    processarEvasaoPorAluno,
    processarEvasaoPorAula,
    registrarTratativaEvasao,
} from "../services/evasao.service.js";

const listarOcorrenciasQuerySchema = z.object({
    status: z.string().trim().optional(),
    regraTipo: z.string().trim().optional(),
    cursoId: z.coerce.number().int().positive().optional(),
    turmaId: z.coerce.number().int().positive().optional(),
    disciplinaId: z.coerce.number().int().positive().optional(),
    alunoId: z.coerce.number().int().positive().optional(),
    somenteAtivas: z
        .union([z.literal("true"), z.literal("false")])
        .optional(),
});

const processarAlunoSchema = z.object({
    alunoId: z.coerce.number().int().positive("Aluno inválido."),
});

const processarAulaSchema = z.object({
    cronogramaAulaId: z.coerce.number().int().positive("Aula inválida."),
});

const registrarTratativaSchema = z.object({
    ocorrenciaId: z.coerce.number().int().positive("Ocorrência inválida."),
    tipoContato: z
        .enum(["LIGACAO", "WHATSAPP", "PRESENCIAL", "OUTRO"])
        .optional(),
    descricao: z.string().trim().min(1, "Descrição obrigatória."),
    retornoAluno: z.string().trim().optional().nullable(),
    observacoes: z.string().trim().optional().nullable(),
});

const marcarLancadoSchema = z.object({
    ocorrenciaId: z.coerce.number().int().positive("Ocorrência inválida."),
    observacoes: z.string().trim().optional().nullable(),
});

const finalizarSchema = z.object({
    ocorrenciaId: z.coerce.number().int().positive("Ocorrência inválida."),
});

const cancelarSchema = z.object({
    ocorrenciaId: z.coerce.number().int().positive("Ocorrência inválida."),
});

const historicoAlunoParamsSchema = z.object({
    alunoId: z.coerce.number().int().positive("Aluno inválido."),
});

export async function listarOcorrencias(req, res, next) {
    try {
        const query = listarOcorrenciasQuerySchema.parse(req.query);

        const data = await listarOcorrenciasEvasao({
            status: query.status,
            regraTipo: query.regraTipo,
            cursoId: query.cursoId,
            turmaId: query.turmaId,
            disciplinaId: query.disciplinaId,
            alunoId: query.alunoId,
            somenteAtivas: query.somenteAtivas === "true",
        });

        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
}

export async function processarAluno(req, res, next) {
    try {
        const data = processarAlunoSchema.parse(req.body);

        const result = await processarEvasaoPorAluno(
            data.alunoId,
            req.user?.id || null
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function processarAula(req, res, next) {
    try {
        const data = processarAulaSchema.parse(req.body);

        const result = await processarEvasaoPorAula(
            data.cronogramaAulaId,
            req.user?.id || null
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function registrarTratativa(req, res, next) {
    try {
        const data = registrarTratativaSchema.parse(req.body);

        const result = await registrarTratativaEvasao({
            ocorrenciaId: data.ocorrenciaId,
            responsavelId: req.user?.id || null,
            tipoContato: data.tipoContato || "LIGACAO",
            descricao: data.descricao,
            retornoAluno: data.retornoAluno || null,
            observacoes: data.observacoes || null,
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function marcarComoLancadoSistema(req, res, next) {
    try {
        const data = marcarLancadoSchema.parse(req.body);

        const result = await marcarOcorrenciaComoLancadaSistema({
            ocorrenciaId: data.ocorrenciaId,
            responsavelId: req.user?.id || null,
            observacoes: data.observacoes || null,
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function finalizarOcorrencia(req, res, next) {
    try {
        const data = finalizarSchema.parse(req.body);

        const result = await finalizarOcorrenciaEvasao({
            ocorrenciaId: data.ocorrenciaId,
            responsavelId: req.user?.id || null,
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function cancelarOcorrencia(req, res, next) {
    try {
        const data = cancelarSchema.parse(req.body);

        const result = await cancelarOcorrenciaEvasao({
            ocorrenciaId: data.ocorrenciaId,
            responsavelId: req.user?.id || null,
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function buscarHistoricoAluno(req, res, next) {
    try {
        const params = historicoAlunoParamsSchema.parse(req.params);

        const data = await getHistoricoEvasaoAluno(params.alunoId);

        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
}