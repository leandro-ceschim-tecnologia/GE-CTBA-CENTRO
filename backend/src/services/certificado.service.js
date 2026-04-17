import prisma from "../prisma/client.js";
import {
    formatarCpf,
    formatarDataPtBr,
    gerarCodigoCertificado,
    mapearTipoOfertaLabel,
    mascararCpf,
} from "../utils/certificado.utils.js";
import { gerarCertificadoAPartirDoTemplate } from "../utils/certificadoTemplate.util.js";

function getCursoMatriculadoLabel(user) {
    return (
        user?.turma?.curso?.nome ||
        user?.turma?.nome ||
        "Curso não informado"
    );
}

function montarDadosTemplate(inscricao, codigoCertificado) {
    const frontendBaseUrl =
        process.env.FRONTEND_URL || "http://localhost:5173";

    return {
        ALUNO: inscricao.user?.nome || "Aluno não informado",
        CPF: formatarCpf(inscricao.user?.cpf),
        CURSANDO: getCursoMatriculadoLabel(inscricao.user),
        TIPO: mapearTipoOfertaLabel(inscricao.oferta?.tipo),
        TEMA:
            inscricao.oferta?.temaCertificado ||
            inscricao.oferta?.titulo ||
            "Tema não informado",
        "DATA-EXECUÇÃO": formatarDataPtBr(inscricao.oferta?.dataEvento),
        CH: String(inscricao.oferta?.cargaHoraria || ""),
        "DATA-CERTIFICAÇÃO": formatarDataExtenso(inscricao.oferta?.dataEvento),
        CODIGO: codigoCertificado,
        URL_VALIDACAO: `${frontendBaseUrl}/validar-certificado/${codigoCertificado}`,
    };
}

function validarDadosMinimosCertificado(inscricao) {
    if (!inscricao) {
        throw new Error("Inscrição não encontrada.");
    }

    if (!inscricao.oferta) {
        throw new Error("Oferta não encontrada.");
    }

    if (!inscricao.user) {
        throw new Error("Usuário não encontrado.");
    }

    if (!inscricao.oferta.possuiCertificacao) {
        throw new Error("Esta oferta não possui certificação.");
    }

    if (!inscricao.oferta.certificadoAtivo) {
        throw new Error("A emissão de certificado está desativada para esta oferta.");
    }

    if (!(inscricao.status === "PRESENTE" || inscricao.presenca === true)) {
        throw new Error("Só é possível emitir certificado para participante presente.");
    }

    if (!inscricao.oferta.cargaHoraria) {
        throw new Error("A oferta precisa ter carga horária cadastrada.");
    }

    if (!inscricao.user.cpf) {
        throw new Error("O usuário precisa ter CPF cadastrado para emitir o certificado.");
    }
}

function formatarDataExtenso(data) {
    if (!data) return "";

    const date = new Date(data);

    const dia = String(date.getDate()).padStart(2, "0");

    const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
    ];

    const mes = meses[date.getMonth()];
    const ano = date.getFullYear();

    return `${dia} de ${mes} de ${ano}`;
}

async function getInscricaoCompleta(ofertaId, inscricaoId) {
    return prisma.ofertaInscricao.findFirst({
        where: {
            id: inscricaoId,
            ofertaId,
        },
        include: {
            oferta: true,
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

async function gerarCertificadoPersistido(inscricao) {
    validarDadosMinimosCertificado(inscricao);

    const codigoCertificado =
        inscricao.codigoCertificado || gerarCodigoCertificado(inscricao.id);

    const dadosTemplate = montarDadosTemplate(inscricao, codigoCertificado);

    const { certificadoUrl } = await gerarCertificadoAPartirDoTemplate(
        inscricao,
        dadosTemplate,
        codigoCertificado
    );

    return prisma.ofertaInscricao.update({
        where: { id: inscricao.id },
        data: {
            certificadoEmitido: true,
            certificadoEmitidoEm: new Date(),
            certificadoUrl,
            codigoCertificado,
        },
        include: {
            oferta: true,
            user: true,
        },
    });
}

export async function emitirCertificadoIndividual(ofertaId, inscricaoId) {
    const inscricao = await getInscricaoCompleta(ofertaId, inscricaoId);
    return gerarCertificadoPersistido(inscricao);
}

export async function regenerarCertificadoIndividual(ofertaId, inscricaoId) {
    const inscricao = await getInscricaoCompleta(ofertaId, inscricaoId);
    return gerarCertificadoPersistido(inscricao);
}

export async function emitirCertificadosPresentes(ofertaId, sobrescrever = false) {
    const inscricoes = await prisma.ofertaInscricao.findMany({
        where: {
            ofertaId,
            OR: [{ status: "PRESENTE" }, { presenca: true }],
        },
        include: {
            oferta: true,
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

    const resultados = [];

    for (const inscricao of inscricoes) {
        if (inscricao.certificadoEmitido && !sobrescrever) {
            resultados.push({
                inscricaoId: inscricao.id,
                status: "ignorado",
                motivo: "Certificado já emitido.",
            });
            continue;
        }

        try {
            const atualizado = await gerarCertificadoPersistido(inscricao);

            resultados.push({
                inscricaoId: inscricao.id,
                status: "emitido",
                codigoCertificado: atualizado.codigoCertificado,
                certificadoUrl: atualizado.certificadoUrl,
            });
        } catch (error) {
            resultados.push({
                inscricaoId: inscricao.id,
                status: "erro",
                motivo: error.message,
            });
        }
    }

    return resultados;
}

export async function regenerarCertificadosPresentes(ofertaId) {
    return emitirCertificadosPresentes(ofertaId, true);
}

export async function buscarCertificadoPublicoPorCodigo(codigo) {
    const inscricao = await prisma.ofertaInscricao.findFirst({
        where: {
            codigoCertificado: codigo,
            certificadoEmitido: true,
        },
        include: {
            oferta: true,
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

    if (!inscricao) {
        return {
            valido: false,
            mensagem: "Certificado não encontrado.",
        };
    }

    return {
        valido: true,
        codigoCertificado: inscricao.codigoCertificado,
        aluno: inscricao.user?.nome || "Aluno não informado",
        cpfMascarado: mascararCpf(inscricao.user?.cpf),
        cursando: getCursoMatriculadoLabel(inscricao.user),
        tipo: mapearTipoOfertaLabel(inscricao.oferta?.tipo),
        tema:
            inscricao.oferta?.temaCertificado ||
            inscricao.oferta?.titulo ||
            "Tema não informado",
        dataExecucao: formatarDataPtBr(inscricao.oferta?.dataEvento),
        dataCertificacao: formatarDataPtBr(inscricao.certificadoEmitidoEm),
        cargaHoraria: inscricao.oferta?.cargaHoraria || null,
        certificadoUrl: inscricao.certificadoUrl,
    };
}

export async function obterCertificadoParaDownload(ofertaId, inscricaoId, currentUser) {
    const inscricao = await prisma.ofertaInscricao.findFirst({
        where: {
            id: inscricaoId,
            ofertaId,
        },
        include: {
            oferta: true,
            user: true,
        },
    });

    if (!inscricao || !inscricao.certificadoEmitido || !inscricao.certificadoUrl) {
        throw new Error("Certificado não encontrado.");
    }

    const currentUserId = Number(currentUser?.sub);
    const role = currentUser?.role;

    const isAdminRole = ["admin", "pedagogico", "coordenacao"].includes(role);
    const isOwner = currentUserId === inscricao.userId;

    if (!isAdminRole && !isOwner) {
        const error = new Error("Você não tem permissão para acessar este certificado.");
        error.status = 403;
        throw error;
    }

    return {
        certificadoUrl: inscricao.certificadoUrl,
        codigoCertificado: inscricao.codigoCertificado,
    };
}