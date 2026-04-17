import prisma from "../prisma/client.js";
import {
    resolveTemplateKey,
    getDocumentTemplateByPath,
} from "../config/documentoTemplates.config.js";
import {
    generateDocxFromTemplate,
    generatePdfFromGeneratedDocx,
    getTemplateMetadata,
} from "./documentoTemplate.service.js";

/**
 * Gera um código simples de documento.
 *
 * Exemplo:
 * DOC-20260408-AB12CD
 *
 * Depois, se você quiser, podemos trocar por uma numeração
 * mais formal por tipo/ano/sequência.
 */
function generateCodigoDocumento() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `DOC-${y}${m}${d}-${random}`;
}

/**
 * Converte valor nulo/undefined para string ou null conforme necessidade.
 */
function nullable(value) {
    if (value === undefined || value === null || value === "") return null;
    return value;
}

/**
 * Busca usuário vinculado, se houver userId.
 *
 * Incluímos turma e curso porque isso já ajuda a montar placeholders
 * automaticamente quando necessário.
 */
async function getLinkedUserIfAny(userId) {
    if (!userId) return null;

    return prisma.user.findUnique({
        where: { id: Number(userId) },
        include: {
            turma: {
                include: {
                    curso: true,
                },
            },
        },
    });
}

/**
 * Normaliza variáveis extras.
 *
 * O frontend atual já manda "variaveis" no payload, então mantemos isso.
 */
function normalizeVariaveisExtras(variaveis) {
    if (!variaveis) return {};

    if (typeof variaveis !== "object" || Array.isArray(variaveis)) {
        throw new Error("As variáveis extras devem ser um objeto JSON.");
    }

    return variaveis;
}

/**
 * Emissão principal do documento.
 *
 * Compatível com o frontend atual:
 * - tipo
 * - userId
 * - titulo
 * - assunto
 * - observacoes
 * - dados do solicitante
 * - destinatário
 * - variaveis
 *
 * E já preparado para o frontend futuro:
 * - templateKey
 * - cidade
 * - specialData
 */
export async function emitirDocumentoService(payload) {
    const templateKey = resolveTemplateKey({
        tipo: payload.tipo,
        templateKey: payload.templateKey,
    });

    const codigoDocumento = generateCodigoDocumento();

    const linkedUser = await getLinkedUserIfAny(payload.userId);
    const variaveisExtras = normalizeVariaveisExtras(payload.variaveis);

    const form = {
        tipo: payload.tipo,
        titulo: payload.titulo,
        assunto: payload.assunto,
        observacoes: payload.observacoes,

        nomeSolicitante: payload.nomeSolicitante,
        cpfSolicitante: payload.cpfSolicitante,
        matriculaSolicitante: payload.matriculaSolicitante,
        fone1Solicitante: payload.fone1Solicitante,
        fone2Solicitante: payload.fone2Solicitante,
        cursoSolicitante: payload.cursoSolicitante,
        turmaSolicitante: payload.turmaSolicitante,

        destinatarioNome: payload.destinatarioNome,
        destinatarioCargo: payload.destinatarioCargo,
        destinatarioOrgao: payload.destinatarioOrgao,

        pai: payload.pai,
        mae: payload.mae,
        motivo: payload.motivo,
        horario: payload.horario,
        horarioEntrada: payload.horarioEntrada,
        horarioSaida: payload.horarioSaida,
        disciplina: payload.disciplina,
        instrutor: payload.instrutor,
        aluno: payload.aluno,
        turma: payload.turma,
        observacao: payload.observacao,
    };

    const generated = await generateDocxFromTemplate({
        templateKey,
        codigoDocumento,
        form,
        user: linkedUser,
        variaveisExtras,
        cidade: payload.cidade || "Curitiba",
        specialData: payload.specialData || {},
    });

    /**
     * Tentamos gerar PDF.
     * Se falhar, ainda assim o DOCX continua disponível.
     * Isso evita travar a operação por causa da conversão.
     */
    let pdfRelativeUrl = null;

    try {
        const pdfGenerated = await generatePdfFromGeneratedDocx({
            docxAbsolutePath: generated.outputAbsolutePath,
        });

        pdfRelativeUrl = pdfGenerated.pdfRelativeUrl;
    } catch (error) {
        console.error("Falha ao converter DOCX para PDF:", error);
    }

    const templateMetadata = getTemplateMetadata(templateKey);

    const variaveisTemplate = {
        ...generated.placeholders,
        __meta: {
            templateKey,
            missingPlaceholders: generated.missingPlaceholders,
            cidade: payload.cidade || "Curitiba",
            specialData: payload.specialData || {},
        },
    };

    const documento = await prisma.documentoEmitido.create({
        data: {
            codigoDocumento,
            tipo: payload.tipo,
            titulo: payload.titulo,
            templatePath: templateMetadata.templatePath,
            docxUrl: generated.outputRelativeUrl,
            pdfUrl: pdfRelativeUrl,
            emitidoEm: new Date(),
            cancelado: false,
            observacoes: nullable(payload.observacoes),
            assunto: nullable(payload.assunto),

            userId: payload.userId ? Number(payload.userId) : null,

            nomeSolicitante: nullable(payload.nomeSolicitante),
            cpfSolicitante: nullable(payload.cpfSolicitante),
            matriculaSolicitante: nullable(payload.matriculaSolicitante),
            fone1Solicitante: nullable(payload.fone1Solicitante),
            fone2Solicitante: nullable(payload.fone2Solicitante),
            cursoSolicitante: nullable(payload.cursoSolicitante),
            turmaSolicitante: nullable(payload.turmaSolicitante),

            destinatarioNome: nullable(payload.destinatarioNome),
            destinatarioCargo: nullable(payload.destinatarioCargo),
            destinatarioOrgao: nullable(payload.destinatarioOrgao),

            variaveisTemplate,
        },
    });

    return documento;
}

/**
 * Regenera o DOCX com base nas informações já salvas no banco.
 */
export async function regenerarDocumentoService(documentoId) {
    const documento = await prisma.documentoEmitido.findUnique({
        where: { id: Number(documentoId) },
        include: {
            user: {
                include: {
                    turma: {
                        include: {
                            curso: true,
                        },
                    },
                },
            },
        },
    });

    if (!documento) {
        throw new Error("Documento não encontrado.");
    }

    if (documento.cancelado) {
        throw new Error("Documento cancelado não pode ser regenerado.");
    }

    const templateMetaFromJson = documento.variaveisTemplate?.__meta || {};
    let templateKey = templateMetaFromJson.templateKey;

    if (!templateKey) {
        const template = getDocumentTemplateByPath(documento.templatePath);
        templateKey = template?.key || null;
    }

    if (!templateKey) {
        throw new Error("Não foi possível identificar a chave do template para regeneração.");
    }

    const form = {
        tipo: documento.tipo,
        titulo: documento.titulo,
        assunto: documento.assunto,
        observacoes: documento.observacoes,

        nomeSolicitante: documento.nomeSolicitante,
        cpfSolicitante: documento.cpfSolicitante,
        matriculaSolicitante: documento.matriculaSolicitante,
        fone1Solicitante: documento.fone1Solicitante,
        fone2Solicitante: documento.fone2Solicitante,
        cursoSolicitante: documento.cursoSolicitante,
        turmaSolicitante: documento.turmaSolicitante,

        destinatarioNome: documento.destinatarioNome,
        destinatarioCargo: documento.destinatarioCargo,
        destinatarioOrgao: documento.destinatarioOrgao,
    };

    const variaveisExtras = { ...(documento.variaveisTemplate || {}) };
    delete variaveisExtras.__meta;

    const generated = await generateDocxFromTemplate({
        templateKey,
        codigoDocumento: documento.codigoDocumento,
        form,
        user: documento.user || null,
        variaveisExtras,
        cidade: templateMetaFromJson.cidade || "Curitiba",
        specialData: templateMetaFromJson.specialData || {},
    });

    let pdfRelativeUrl = null;

    try {
        const pdfGenerated = await generatePdfFromGeneratedDocx({
            docxAbsolutePath: generated.outputAbsolutePath,
        });

        pdfRelativeUrl = pdfGenerated.pdfRelativeUrl;
    } catch (error) {
        console.error("Falha ao reconverter DOCX para PDF:", error);
    }

    return prisma.documentoEmitido.update({
        where: { id: Number(documentoId) },
        data: {
            docxUrl: generated.outputRelativeUrl,
            pdfUrl: pdfRelativeUrl,
            updatedAt: new Date(),
            variaveisTemplate: {
                ...generated.placeholders,
                __meta: {
                    templateKey,
                    missingPlaceholders: generated.missingPlaceholders,
                    cidade: templateMetaFromJson.cidade || "Curitiba",
                    specialData: templateMetaFromJson.specialData || {},
                },
            },
        },
    });
}

export async function listarDocumentosService({ tipo, cancelado }) {
    const where = {};

    if (tipo) where.tipo = tipo;

    if (cancelado === "true") where.cancelado = true;
    if (cancelado === "false") where.cancelado = false;

    return prisma.documentoEmitido.findMany({
        where,
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function buscarDocumentoService(id) {
    return prisma.documentoEmitido.findUnique({
        where: { id: Number(id) },
    });
}

export async function cancelarDocumentoService(id) {
    const documento = await prisma.documentoEmitido.findUnique({
        where: { id: Number(id) },
    });

    if (!documento) {
        throw new Error("Documento não encontrado.");
    }

    if (documento.cancelado) {
        return documento;
    }

    return prisma.documentoEmitido.update({
        where: { id: Number(id) },
        data: {
            cancelado: true,
        },
    });
}

export async function getDocumentoDownloadService(id) {
    const documento = await prisma.documentoEmitido.findUnique({
        where: { id: Number(id) },
    });

    if (!documento) {
        throw new Error("Documento não encontrado.");
    }

    return {
        documentoUrl: documento.docxUrl || documento.pdfUrl || null,
        documentoDocxUrl: documento.docxUrl || null,
        documentoPdfUrl: documento.pdfUrl || null,
    };
}

export async function validarDocumentoPublicoService(codigo) {
    const documento = await prisma.documentoEmitido.findUnique({
        where: { codigoDocumento: codigo },
    });

    if (!documento) {
        throw new Error("Documento não encontrado.");
    }

    return documento;
}

export async function listarMeusDocumentosService(userId) {
    return prisma.documentoEmitido.findMany({
        where: {
            userId: Number(userId),
            cancelado: false,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}