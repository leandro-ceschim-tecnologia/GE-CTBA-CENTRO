import { z } from "zod";
import {
    emitirDocumentoService,
    regenerarDocumentoService,
    listarDocumentosService,
    buscarDocumentoService,
    cancelarDocumentoService,
    getDocumentoDownloadService,
    validarDocumentoPublicoService,
    listarMeusDocumentosService,
} from "../services/documentoEmissao.service.js";

import { listDocumentTemplatesByTipo } from "../config/documentoTemplates.config.js";

/**
 * Schema compatível com seu frontend atual.
 *
 * Também já aceita campos futuros opcionais:
 * - templateKey
 * - cidade
 * - pai, mae, motivo...
 * - specialData (ex.: ata individual)
 */
const emitirDocumentoSchema = z.object({
    tipo: z.enum(["DECLARACAO", "OFICIO", "REQUERIMENTO"]),
    templateKey: z.string().optional().nullable(),

    userId: z.coerce.number().int().positive().nullable().optional(),

    titulo: z.string().min(1, "Título obrigatório."),
    assunto: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),

    nomeSolicitante: z.string().optional().nullable(),
    cpfSolicitante: z.string().optional().nullable(),
    matriculaSolicitante: z.string().optional().nullable(),
    fone1Solicitante: z.string().optional().nullable(),
    fone2Solicitante: z.string().optional().nullable(),
    cursoSolicitante: z.string().optional().nullable(),
    turmaSolicitante: z.string().optional().nullable(),

    destinatarioNome: z.string().optional().nullable(),
    destinatarioCargo: z.string().optional().nullable(),
    destinatarioOrgao: z.string().optional().nullable(),

    variaveis: z.record(z.any()).optional(),

    cidade: z.string().optional(),

    pai: z.string().optional().nullable(),
    mae: z.string().optional().nullable(),
    motivo: z.string().optional().nullable(),
    horario: z.string().optional().nullable(),
    horarioEntrada: z.string().optional().nullable(),
    horarioSaida: z.string().optional().nullable(),

    disciplina: z.string().optional().nullable(),
    instrutor: z.string().optional().nullable(),
    aluno: z.string().optional().nullable(),
    turma: z.string().optional().nullable(),
    observacao: z.string().optional().nullable(),

    specialData: z.any().optional(),
});

export async function emitirDocumento(req, res, next) {
    try {
        const payload = emitirDocumentoSchema.parse(req.body);
        const documento = await emitirDocumentoService(payload);
        res.status(201).json(documento);
    } catch (error) {
        next(error);
    }
}

export async function regenerarDocumento(req, res, next) {
    try {
        const id = Number(req.params.id);
        const documento = await regenerarDocumentoService(id);
        res.json(documento);
    } catch (error) {
        next(error);
    }
}

export async function listarDocumentos(req, res, next) {
    try {
        const documentos = await listarDocumentosService({
            tipo: req.query.tipo,
            cancelado: req.query.cancelado,
        });

        res.json(documentos);
    } catch (error) {
        next(error);
    }
}

export async function buscarDocumento(req, res, next) {
    try {
        const id = Number(req.params.id);
        const documento = await buscarDocumentoService(id);

        if (!documento) {
            return res.status(404).json({ error: "Documento não encontrado." });
        }

        res.json(documento);
    } catch (error) {
        next(error);
    }
}

export async function cancelarDocumento(req, res, next) {
    try {
        const id = Number(req.params.id);
        const documento = await cancelarDocumentoService(id);
        res.json(documento);
    } catch (error) {
        next(error);
    }
}

export async function getDocumentoDownload(req, res, next) {
    try {
        const id = Number(req.params.id);
        const result = await getDocumentoDownloadService(id);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

export async function validarDocumentoPublico(req, res, next) {
    try {
        const { codigo } = req.params;
        const documento = await validarDocumentoPublicoService(codigo);

        res.json({
            valido: true,
            documento: {
                id: documento.id,
                codigoDocumento: documento.codigoDocumento,
                tipo: documento.tipo,
                titulo: documento.titulo,
                emitidoEm: documento.emitidoEm,
                cancelado: documento.cancelado,
                observacoes: documento.observacoes,
                assunto: documento.assunto,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function listarMeusDocumentos(req, res, next) {
    try {
        const documentos = await listarMeusDocumentosService(req.user.id);
        res.json(documentos);
    } catch (error) {
        next(error);
    }
}

/**
 * Lista os templates disponíveis.
 *
 * Pode retornar:
 * - todos os templates
 * - ou apenas os templates de um tipo específico
 *
 * Exemplo:
 * GET /documentos/templates
 * GET /documentos/templates?tipo=DECLARACAO
 */
export async function listarTemplatesDocumento(req, res, next) {
    try {
        const { tipo } = req.query;

        let templates = [];

        if (tipo) {
            templates = listDocumentTemplatesByTipo(tipo);
        } else {
            templates = [
                ...listDocumentTemplatesByTipo("DECLARACAO"),
                ...listDocumentTemplatesByTipo("OFICIO"),
                ...listDocumentTemplatesByTipo("REQUERIMENTO"),
            ];
        }

        res.json(
            templates.map((item) => ({
                key: item.key,
                tipo: item.tipo,
                label: item.label,
                category: item.category,
                templatePath: item.templatePath,
                placeholders: item.placeholders || [],
                specialHandler: item.specialHandler || null,
            }))
        );
    } catch (error) {
        next(error);
    }
}