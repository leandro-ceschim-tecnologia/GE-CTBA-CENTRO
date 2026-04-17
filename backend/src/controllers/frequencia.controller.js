import { z } from "zod";
import {
    adicionarAlunoNaDisciplina,
    getFiltrosFrequencia,
    getGradeFrequencia,
    getHistoricoAluno,
    salvarLancamentoFrequencia,
} from "../services/frequencia.service.js";

const gradeQuerySchema = z.object({
    cursoId: z.coerce.number().int().positive().optional(),
    turno: z.string().trim().optional(),
    turmaId: z.coerce.number().int().positive("Turma inválida."),
    disciplinaId: z.coerce.number().int().positive("Disciplina inválida."),
});

const salvarLancamentoSchema = z.object({
    cronogramaAulaId: z.coerce.number().int().positive("Aula inválida."),
    observacoes: z.string().trim().optional().nullable(),
    alunos: z
        .array(
            z.object({
                alunoId: z.coerce.number().int().positive("Aluno inválido."),
                alunoTurmaDisciplinaId: z.coerce.number().int().positive().optional().nullable(),
                status: z.enum([
                    "NAO_LANCADO",
                    "PRESENTE",
                    "FALTA",
                    "FALTA_JUSTIFICADA",
                ]),
                justificativa: z.string().trim().optional().nullable(),
                observacoes: z.string().trim().optional().nullable(),
            })
        )
        .min(1, "Informe ao menos um aluno."),
});

const adicionarAlunoSchema = z.object({
    alunoId: z.coerce.number().int().positive("Aluno inválido."),
    turmaId: z.coerce.number().int().positive("Turma inválida."),
    turmaDisciplinaId: z.coerce.number().int().positive("TurmaDisciplina inválida."),
    origem: z
        .enum(["BASE", "PENDENCIA", "REPOSICAO", "EXTRA"])
        .optional(),
    observacoes: z.string().trim().optional().nullable(),
});

const historicoParamsSchema = z.object({
    alunoId: z.coerce.number().int().positive("Aluno inválido."),
});

export async function listarFiltrosFrequencia(req, res, next) {
    try {
        const data = await getFiltrosFrequencia();
        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
}

export async function buscarGradeFrequencia(req, res, next) {
    try {
        const data = gradeQuerySchema.parse(req.query);

        const grade = await getGradeFrequencia({
            cursoId: data.cursoId,
            turno: data.turno,
            turmaId: data.turmaId,
            disciplinaId: data.disciplinaId,
        });

        return res.status(200).json(grade);
    } catch (error) {
        next(error);
    }
}

export async function criarLancamentoFrequencia(req, res, next) {
    try {
        const data = salvarLancamentoSchema.parse(req.body);

        const result = await salvarLancamentoFrequencia({
            cronogramaAulaId: data.cronogramaAulaId,
            observacoes: data.observacoes || null,
            alunos: data.alunos,
            userId: req.user?.id || null,
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function vincularAlunoNaDisciplina(req, res, next) {
    try {
        const data = adicionarAlunoSchema.parse(req.body);

        const result = await adicionarAlunoNaDisciplina({
            alunoId: data.alunoId,
            turmaId: data.turmaId,
            turmaDisciplinaId: data.turmaDisciplinaId,
            origem: data.origem || "EXTRA",
            observacoes: data.observacoes || null,
        });

        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function buscarHistoricoAluno(req, res, next) {
    try {
        const params = historicoParamsSchema.parse(req.params);

        const historico = await getHistoricoAluno(params.alunoId);

        return res.status(200).json(historico);
    } catch (error) {
        next(error);
    }
}