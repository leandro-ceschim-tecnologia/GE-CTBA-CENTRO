import prisma from "../prisma/client.js";
import {
    formatarCpf,
    formatarTelefone,
    formatarDataPtBr,
    formatarDataExtenso,
    gerarCodigoDocumento,
    getTipoDocumentoLabel,
    getTemplateDocumentoPath,
    mascararCpf,
    normalizarCpf,
    normalizarTelefone,
    normalizarTexto,
} from "../utils/documento.utils.js";
import { gerarDocumentoAPartirDoTemplate } from "../utils/documentoTemplate.util.js";

async function getUserCompletoSeInformado(userId) {
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

function validarDadosMinimosDocumento(payload) {
    if (!payload?.tipo) {
        throw new Error("Tipo do documento é obrigatório.");
    }

    if (!payload?.titulo) {
        throw new Error("Título do documento é obrigatório.");
    }

    if (payload.tipo === "OFICIO" && !payload.destinatarioNome) {
        throw new Error("Ofício exige destinatário.");
    }

    if (
        payload.tipo === "DECLARACAO" &&
        !(
            payload.userId ||
            payload.nomeSolicitante ||
            payload.matriculaSolicitante
        )
    ) {
        throw new Error("Declaração exige vínculo com usuário ou identificação do solicitante.");
    }
}

function montarDadosTemplate(documento, userVinculado, codigoDocumento) {
    const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:5173";

    const dataAtual = new Date();

    const nomeSolicitante =
        documento.nomeSolicitante ||
        userVinculado?.nome ||
        "Não informado";

    const cpfSolicitante =
        documento.cpfSolicitante ||
        userVinculado?.cpf ||
        "";

    const matriculaSolicitante =
        documento.matriculaSolicitante ||
        userVinculado?.matricula ||
        "";

    const fone1Solicitante =
        documento.fone1Solicitante ||
        userVinculado?.fone1 ||
        "";

    const fone2Solicitante =
        documento.fone2Solicitante ||
        userVinculado?.fone2 ||
        "";

    const cursoSolicitante =
        documento.cursoSolicitante ||
        userVinculado?.turma?.curso?.nome ||
        "";

    const turmaSolicitante =
        documento.turmaSolicitante ||
        userVinculado?.turma?.nome ||
        "";

    return {
        TITULO: normalizarTexto(documento.titulo) || "",
        TIPO_DOCUMENTO: getTipoDocumentoLabel(documento.tipo),
        ASSUNTO: normalizarTexto(documento.assunto) || "",
        OBSERVACOES: normalizarTexto(documento.observacoes) || "",

        NOME: normalizarTexto(nomeSolicitante) || "",
        CPF: formatarCpf(cpfSolicitante),
        MATRICULA: normalizarTexto(matriculaSolicitante) || "",
        FONE1: formatarTelefone(fone1Solicitante),
        FONE2: formatarTelefone(fone2Solicitante),
        CURSO: normalizarTexto(cursoSolicitante) || "",
        TURMA: normalizarTexto(turmaSolicitante) || "",

        DESTINATARIO: normalizarTexto(documento.destinatarioNome) || "",
        CARGO_DESTINATARIO: normalizarTexto(documento.destinatarioCargo) || "",
        ORGAO_DESTINATARIO: normalizarTexto(documento.destinatarioOrgao) || "",

        CODIGO: codigoDocumento,
        DATA_ATUAL: formatarDataPtBr(dataAtual),
        DATA_EXTENSO: formatarDataExtenso(dataAtual),
        CIDADE_DATA: `Curitiba, ${formatarDataExtenso(dataAtual)}`,
        URL_VALIDACAO: `${frontendBaseUrl}/validar-documento/${codigoDocumento}`,

        ...(documento.variaveis || {}),
    };
}

async function persistirDocumentoGerado(payload) {
    validarDadosMinimosDocumento(payload);

    const userVinculado = await getUserCompletoSeInformado(payload.userId);

    if (payload.userId && !userVinculado) {
        throw new Error("Usuário informado não encontrado.");
    }

    const templatePath = getTemplateDocumentoPath(payload.tipo);

    const documentoBase = await prisma.documentoEmitido.create({
        data: {
            codigoDocumento: `PENDENTE-${Date.now()}`,
            tipo: payload.tipo,
            titulo: payload.titulo,
            templatePath,
            docxUrl: null,
            pdfUrl: null,
            emitidoEm: null,
            cancelado: false,
            observacoes: normalizarTexto(payload.observacoes),
            assunto: normalizarTexto(payload.assunto),

            userId: payload.userId || null,

            nomeSolicitante: normalizarTexto(payload.nomeSolicitante) || userVinculado?.nome || null,
            cpfSolicitante: normalizarCpf(payload.cpfSolicitante) || userVinculado?.cpf || null,
            matriculaSolicitante: normalizarTexto(payload.matriculaSolicitante) || userVinculado?.matricula || null,
            fone1Solicitante: normalizarTelefone(payload.fone1Solicitante) || userVinculado?.fone1 || null,
            fone2Solicitante: normalizarTelefone(payload.fone2Solicitante) || userVinculado?.fone2 || null,
            cursoSolicitante: normalizarTexto(payload.cursoSolicitante) || userVinculado?.turma?.curso?.nome || null,
            turmaSolicitante: normalizarTexto(payload.turmaSolicitante) || userVinculado?.turma?.nome || null,

            destinatarioNome: normalizarTexto(payload.destinatarioNome),
            destinatarioCargo: normalizarTexto(payload.destinatarioCargo),
            destinatarioOrgao: normalizarTexto(payload.destinatarioOrgao),

            variaveisTemplate: payload.variaveis || {},
        },
    });

    const codigoDocumento = gerarCodigoDocumento(payload.tipo, documentoBase.id);

    const dadosTemplate = montarDadosTemplate(
        {
            ...payload,
            variaveis: payload.variaveis || {},
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
        },
        userVinculado,
        codigoDocumento
    );

    const { docxUrl, pdfUrl } = await gerarDocumentoAPartirDoTemplate(
        templatePath,
        dadosTemplate,
        codigoDocumento
    );

    return prisma.documentoEmitido.update({
        where: { id: documentoBase.id },
        data: {
            codigoDocumento,
            docxUrl,
            pdfUrl,
            emitidoEm: new Date(),
        },
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
}

export async function emitirDocumento(payload) {
    return persistirDocumentoGerado(payload);
}

export async function regenerarDocumento(documentoId) {
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
        throw new Error("Não é possível regenerar um documento cancelado.");
    }

    const dadosTemplate = montarDadosTemplate(
        {
            ...documento,
            variaveis: documento.variaveisTemplate || {},
        },
        documento.user,
        documento.codigoDocumento
    );

    const { docxUrl, pdfUrl } = await gerarDocumentoAPartirDoTemplate(
        documento.templatePath,
        dadosTemplate,
        documento.codigoDocumento
    );

    return prisma.documentoEmitido.update({
        where: { id: documento.id },
        data: {
            docxUrl,
            pdfUrl,
            emitidoEm: new Date(),
        },
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
}

export async function listarDocumentos(filters = {}) {
    const where = {};

    if (filters.tipo) {
        where.tipo = filters.tipo;
    }

    if (typeof filters.cancelado === "boolean") {
        where.cancelado = filters.cancelado;
    }

    return prisma.documentoEmitido.findMany({
        where,
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
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function buscarDocumentoPorId(id) {
    const documento = await prisma.documentoEmitido.findUnique({
        where: { id: Number(id) },
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

    return documento;
}

export async function obterDocumentoParaDownload(id, currentUser) {
    const documento = await prisma.documentoEmitido.findUnique({
        where: { id: Number(id) },
    });

    if (!documento || !documento.pdfUrl) {
        throw new Error("Documento não encontrado.");
    }

    const currentUserId = Number(currentUser?.sub);
    const role = currentUser?.role;

    const isAdminRole = ["admin", "pedagogico", "coordenacao", "secretaria"].includes(role);
    const isOwner = currentUserId === documento.userId;

    if (!isAdminRole && !isOwner) {
        const error = new Error("Você não tem permissão para acessar este documento.");
        error.status = 403;
        throw error;
    }

    return {
        documentoUrl: documento.pdfUrl,
        documentoDocxUrl: documento.docxUrl,
        codigoDocumento: documento.codigoDocumento,
    };
}

export async function cancelarDocumento(id) {
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

export async function buscarDocumentoPublicoPorCodigo(codigo) {
    const documento = await prisma.documentoEmitido.findFirst({
        where: {
            codigoDocumento: codigo,
            cancelado: false,
        },
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
        return {
            valido: false,
            mensagem: "Documento não encontrado.",
        };
    }

    return {
        valido: true,
        codigoDocumento: documento.codigoDocumento,
        tipo: getTipoDocumentoLabel(documento.tipo),
        titulo: documento.titulo,
        nomeSolicitante: documento.nomeSolicitante || "Não informado",
        cpfMascarado: mascararCpf(documento.cpfSolicitante),
        assunto: documento.assunto || "",
        emitidoEm: formatarDataPtBr(documento.emitidoEm),
        documentoUrl: documento.pdfUrl,
    };
}

export async function listarDocumentosDoUsuario(userId) {
    return prisma.documentoEmitido.findMany({
        where: {
            userId: Number(userId),
            cancelado: false,
            pdfUrl: {
                not: null,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}