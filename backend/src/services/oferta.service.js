import prisma from "../prisma/client.js";

const ROLE_MAP = {
    admin: "ADMIN",
    pedagogico: "PEDAGOGICO",
    coordenacao: "COORDENACAO",
    coordsetor: "COORDSETOR",
    instrutor: "INSTRUTOR",
    aluno: "ALUNO",
    comercial: "COMERCIAL",
    secretaria: "SECRETARIA",
};

function toDate(dateStr) {
    if (!dateStr) return null;

    const [year, month, day] = String(dateStr).split("-").map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day, 12, 0, 0);
}

function normalizeEspacosInput(espacos) {
    if (!Array.isArray(espacos)) return [];

    return espacos
        .map((item, index) => {
            const salaId =
                item?.salaId !== undefined &&
                    item?.salaId !== null &&
                    item?.salaId !== ""
                    ? Number(item.salaId)
                    : null;

            const textoLivre =
                typeof item?.textoLivre === "string" ? item.textoLivre.trim() : "";

            const observacoes =
                typeof item?.observacoes === "string"
                    ? item.observacoes.trim()
                    : "";

            if (!salaId && !textoLivre) {
                return null;
            }

            return {
                salaId,
                textoLivre: textoLivre || null,
                observacoes: observacoes || null,
                ordem: index + 1,
            };
        })
        .filter(Boolean);
}

function timeToMinutes(timeValue) {
    if (!timeValue || typeof timeValue !== "string") return null;
    const [hour, minute] = timeValue.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
}

function getPeriodosFromHorario(horaInicio, horaFim) {
    const inicio = timeToMinutes(horaInicio);
    const fim = timeToMinutes(horaFim);

    if (inicio === null && fim === null) {
        return ["NOITE"];
    }

    const inicioFinal = inicio ?? fim;
    const fimFinal = fim ?? inicio;

    const periodos = new Set();

    if (inicioFinal < 12 * 60 && fimFinal > 6 * 60) {
        periodos.add("MANHA");
    }

    if (inicioFinal < 18 * 60 && fimFinal > 12 * 60) {
        periodos.add("TARDE");
    }

    if (inicioFinal < 24 * 60 && fimFinal > 18 * 60) {
        periodos.add("NOITE");
    }

    if (!periodos.size) {
        if (inicioFinal < 12 * 60) return ["MANHA"];
        if (inicioFinal < 18 * 60) return ["TARDE"];
        return ["NOITE"];
    }

    return Array.from(periodos);
}

async function buildLocalResumo(localInformado, espacosNormalizados, tx = prisma) {
    const localTexto = typeof localInformado === "string" ? localInformado.trim() : "";

    if (localTexto) {
        return localTexto;
    }

    if (!Array.isArray(espacosNormalizados) || !espacosNormalizados.length) {
        return null;
    }

    const salaIds = espacosNormalizados
        .map((item) => item.salaId)
        .filter((value) => Number.isInteger(value));

    let salasMap = new Map();

    if (salaIds.length) {
        const salas = await tx.sala.findMany({
            where: {
                id: { in: salaIds },
            },
            select: {
                id: true,
                nome: true,
            },
        });

        salasMap = new Map(salas.map((sala) => [sala.id, sala.nome]));
    }

    const partes = espacosNormalizados
        .map((item) => {
            if (item.salaId && salasMap.has(item.salaId)) {
                return salasMap.get(item.salaId);
            }

            if (item.textoLivre) {
                return item.textoLivre;
            }

            return null;
        })
        .filter(Boolean);

    if (!partes.length) {
        return null;
    }

    return partes.join(" | ");
}

async function validarConflitosDeOferta({
    tx = prisma,
    ofertaIdIgnorar = null,
    dataEvento,
    horaInicio,
    horaFim,
    espacosNormalizados,
}) {
    const salaIds = (espacosNormalizados || [])
        .map((item) => item.salaId)
        .filter((value) => Number.isInteger(value));

    if (!dataEvento || !salaIds.length) {
        return;
    }

    const dateRef = toDate(dataEvento);
    if (!dateRef) {
        throw new Error("Data do evento inválida.");
    }

    const diaSemanaMap = {
        0: "DOMINGO",
        1: "SEGUNDA",
        2: "TERCA",
        3: "QUARTA",
        4: "QUINTA",
        5: "SEXTA",
        6: "SABADO",
    };

    const diaSemana = diaSemanaMap[dateRef.getDay()] || null;
    const periodosOferta = getPeriodosFromHorario(horaInicio, horaFim);

    if (!diaSemana) {
        throw new Error("Não foi possível identificar o dia da semana da oferta.");
    }

    const salas = await tx.sala.findMany({
        where: {
            id: { in: salaIds },
        },
        select: {
            id: true,
            nome: true,
            ativo: true,
        },
    });

    const salaMap = new Map(salas.map((sala) => [sala.id, sala]));

    const salasInativas = salas.filter((sala) => sala.ativo === false);
    if (salasInativas.length) {
        throw new Error(
            `Não é possível usar sala inativa na oferta: ${salasInativas
                .map((item) => item.nome)
                .join(", ")}.`
        );
    }

    const conflitos = [];

    const ensalamentos = await tx.ensalamentoItem.findMany({
        where: {
            ativo: true,
            salaId: { in: salaIds },
            diaSemana,
            periodo: { in: periodosOferta },
        },
        include: {
            sala: {
                select: {
                    id: true,
                    nome: true,
                },
            },
            turma: {
                include: {
                    curso: true,
                },
            },
        },
    });

    ensalamentos.forEach((item) => {
        conflitos.push({
            tipo: "ENSALAMENTO",
            salaNome: item?.sala?.nome || `Sala ${item.salaId}`,
            periodo: item.periodo,
            titulo: item?.turma?.nome || item?.textoLivre || "Uso definido",
            detalhe: item?.turma?.curso?.nome || item?.observacoes || null,
        });
    });

    const ofertasExistentes = await tx.ofertaAcademica.findMany({
        where: {
            ativo: true,
            id: ofertaIdIgnorar ? { not: ofertaIdIgnorar } : undefined,
            status: {
                in: ["RASCUNHO", "PUBLICADO"],
            },
            dataEvento: {
                gte: new Date(
                    dateRef.getFullYear(),
                    dateRef.getMonth(),
                    dateRef.getDate(),
                    0,
                    0,
                    0
                ),
                lt: new Date(
                    dateRef.getFullYear(),
                    dateRef.getMonth(),
                    dateRef.getDate() + 1,
                    0,
                    0,
                    0
                ),
            },
            espacos: {
                some: {
                    salaId: {
                        in: salaIds,
                    },
                },
            },
        },
        include: {
            espacos: {
                include: {
                    sala: {
                        select: {
                            id: true,
                            nome: true,
                        },
                    },
                },
            },
            instrutor: {
                select: {
                    id: true,
                    nome: true,
                },
            },
        },
    });

    ofertasExistentes.forEach((oferta) => {
        const periodosExistentes = getPeriodosFromHorario(
            oferta.horaInicio,
            oferta.horaFim
        );

        const haInterseccao = periodosExistentes.some((periodo) =>
            periodosOferta.includes(periodo)
        );

        if (!haInterseccao) return;

        (oferta.espacos || []).forEach((espaco) => {
            if (!espaco.salaId || !salaIds.includes(espaco.salaId)) return;

            const salaNome =
                espaco?.sala?.nome ||
                salaMap.get(espaco.salaId)?.nome ||
                `Sala ${espaco.salaId}`;

            periodosExistentes
                .filter((periodo) => periodosOferta.includes(periodo))
                .forEach((periodo) => {
                    conflitos.push({
                        tipo: "OFERTA",
                        salaNome,
                        periodo,
                        titulo: oferta.titulo,
                        detalhe:
                            oferta?.instrutor?.nome ||
                            espaco?.observacoes ||
                            oferta?.observacoes ||
                            null,
                    });
                });
        });
    });

    if (conflitos.length) {
        const mensagem = conflitos
            .map(
                (item) =>
                    `- ${item.salaNome} / ${item.periodo} / ${item.tipo}: ${item.titulo}${item.detalhe ? ` (${item.detalhe})` : ""
                    }`
            )
            .join("\n");

        throw new Error(
            `Conflito de ocupação de sala para a data da oferta.\n${mensagem}`
        );
    }
}

function ofertaIncludeBase() {
    return {
        publicosAlvo: true,
        instrutor: {
            select: {
                id: true,
                nome: true,
                email: true,
            },
        },
        espacos: {
            include: {
                sala: {
                    select: {
                        id: true,
                        nome: true,
                        capacidade: true,
                        bloco: true,
                    },
                },
            },
            orderBy: {
                ordem: "asc",
            },
        },
    };
}

export async function createOferta(data, userId) {
    return prisma.$transaction(async (tx) => {
        const espacosNormalizados = normalizeEspacosInput(data.espacos);

        await validarConflitosDeOferta({
            tx,
            dataEvento: data.dataEvento,
            horaInicio: data.horaInicio,
            horaFim: data.horaFim,
            espacosNormalizados,
        });

        const localResumo = await buildLocalResumo(data.local, espacosNormalizados, tx);

        const oferta = await tx.ofertaAcademica.create({
            data: {
                titulo: data.titulo,
                tipo: data.tipo,

                descricao: data.descricao,
                observacoes: data.observacoes,
                local: localResumo,

                dataEvento: toDate(data.dataEvento),
                inicioInscricoes: toDate(data.inicioInscricoes),
                fimInscricoes: toDate(data.fimInscricoes),

                horaInicio: data.horaInicio,
                horaFim: data.horaFim,

                vagas: data.vagas ?? null,
                permiteInscricao: data.permiteInscricao,
                possuiCertificacao: data.possuiCertificacao,

                cargaHoraria: data.cargaHoraria ?? null,
                temaCertificado: data.temaCertificado || null,

                instrutorId: data.instrutorId ?? null,
                createdById: userId,

                publicosAlvo: {
                    create: data.publicosAlvo.map((role) => ({
                        role,
                    })),
                },

                espacos: {
                    create: espacosNormalizados.map((item) => ({
                        salaId: item.salaId,
                        textoLivre: item.textoLivre,
                        observacoes: item.observacoes,
                        ordem: item.ordem,
                    })),
                },
            },
            include: ofertaIncludeBase(),
        });

        return oferta;
    });
}

export async function listOfertas() {
    return prisma.ofertaAcademica.findMany({
        where: { ativo: true },
        include: {
            ...ofertaIncludeBase(),
            _count: {
                select: { inscricoes: true },
            },
        },
        orderBy: {
            dataEvento: "desc",
        },
    });
}

export async function getOfertaById(id) {
    return prisma.ofertaAcademica.findUnique({
        where: { id },
        include: {
            ...ofertaIncludeBase(),
            inscricoes: {
                include: {
                    user: true,
                },
            },
        },
    });
}

export async function updateOferta(id, data) {
    return prisma.$transaction(async (tx) => {
        const espacosNormalizados = normalizeEspacosInput(data.espacos);

        await validarConflitosDeOferta({
            tx,
            ofertaIdIgnorar: id,
            dataEvento: data.dataEvento,
            horaInicio: data.horaInicio,
            horaFim: data.horaFim,
            espacosNormalizados,
        });

        const localResumo = await buildLocalResumo(data.local, espacosNormalizados, tx);

        await tx.ofertaPublicoAlvo.deleteMany({
            where: { ofertaId: id },
        });

        await tx.ofertaEspaco.deleteMany({
            where: { ofertaId: id },
        });

        const oferta = await tx.ofertaAcademica.update({
            where: { id },
            data: {
                titulo: data.titulo,
                tipo: data.tipo,
                descricao: data.descricao,
                observacoes: data.observacoes,
                local: localResumo,
                dataEvento: data.dataEvento ? toDate(data.dataEvento) : undefined,
                horaInicio: data.horaInicio,
                horaFim: data.horaFim,
                inicioInscricoes: data.inicioInscricoes
                    ? toDate(data.inicioInscricoes)
                    : null,
                fimInscricoes: data.fimInscricoes
                    ? toDate(data.fimInscricoes)
                    : null,
                vagas: data.vagas ?? null,
                permiteInscricao: data.permiteInscricao,
                possuiCertificacao: data.possuiCertificacao,
                cargaHoraria: data.cargaHoraria ?? null,
                instrutorId: data.instrutorId ?? null,
                temaCertificado: data.temaCertificado || null,
                publicosAlvo: {
                    create: (data.publicosAlvo || []).map((role) => ({ role })),
                },
                espacos: {
                    create: espacosNormalizados.map((item) => ({
                        salaId: item.salaId,
                        textoLivre: item.textoLivre,
                        observacoes: item.observacoes,
                        ordem: item.ordem,
                    })),
                },
            },
            include: ofertaIncludeBase(),
        });

        return oferta;
    });
}

export async function listOfertasDoInstrutor(instrutorId) {
    return prisma.ofertaAcademica.findMany({
        where: {
            ativo: true,
            instrutorId: Number(instrutorId),
        },
        include: {
            ...ofertaIncludeBase(),
            publicosAlvo: true,
            _count: {
                select: {
                    inscricoes: true,
                },
            },
        },
        orderBy: {
            dataEvento: "asc",
        },
    });
}

export async function updateStatus(id, status) {
    return prisma.ofertaAcademica.update({
        where: { id },
        data: { status },
    });
}

export async function inscreverUsuario(ofertaId, user) {
    const userId = Number(user?.sub);

    if (!userId) {
        throw new Error("Usuário autenticado inválido.");
    }

    const oferta = await prisma.ofertaAcademica.findUnique({
        where: { id: ofertaId },
        include: {
            publicosAlvo: true,
            inscricoes: true,
        },
    });

    if (!oferta) throw new Error("Oferta não encontrada");

    if (oferta.status !== "PUBLICADO") {
        throw new Error("Oferta não está disponível para inscrição");
    }

    if (!oferta.permiteInscricao) {
        throw new Error("Inscrição desabilitada");
    }

    const roleUser = ROLE_MAP[user.role];

    const permitido = oferta.publicosAlvo.some(
        (p) => p.role === roleUser
    );

    if (!permitido) {
        throw new Error("Você não faz parte do público-alvo");
    }

    const jaInscrito = await prisma.ofertaInscricao.findUnique({
        where: {
            ofertaId_userId: {
                ofertaId,
                userId,
            },
        },
    });

    if (jaInscrito && jaInscrito.status !== "CANCELADO") {
        throw new Error("Usuário já inscrito");
    }

    if (oferta.vagas !== null) {
        const total = await prisma.ofertaInscricao.count({
            where: {
                ofertaId,
                status: { in: ["INSCRITO", "PRESENTE"] },
            },
        });

        if (total >= oferta.vagas) {
            throw new Error("Vagas esgotadas");
        }
    }

    if (jaInscrito && jaInscrito.status === "CANCELADO") {
        return prisma.ofertaInscricao.update({
            where: { id: jaInscrito.id },
            data: {
                status: "INSCRITO",
                presenca: null,
                certificadoEmitido: false,
            },
        });
    }

    return prisma.ofertaInscricao.create({
        data: {
            ofertaId,
            userId,
        },
    });
}

export async function listInscricoesByOferta(ofertaId) {
    const oferta = await prisma.ofertaAcademica.findUnique({
        where: { id: ofertaId },
        include: {
            ...ofertaIncludeBase(),
            inscricoes: {
                include: {
                    user: true,
                },
                orderBy: {
                    dataInscricao: "asc",
                },
            },
        },
    });

    if (!oferta) {
        throw new Error("Oferta não encontrada");
    }

    return oferta;
}

export async function updateInscricao(ofertaId, inscricaoId, data) {
    const inscricao = await prisma.ofertaInscricao.findFirst({
        where: {
            id: inscricaoId,
            ofertaId,
        },
        include: {
            oferta: true,
        },
    });

    if (!inscricao) {
        throw new Error("Inscrição não encontrada");
    }

    const payload = {};

    if (typeof data.presenca === "boolean") {
        payload.presenca = data.presenca;
        payload.status = data.presenca ? "PRESENTE" : "AUSENTE";
    }

    if (typeof data.observacoes === "string") {
        payload.observacoes = data.observacoes;
    }

    if (data.status) {
        payload.status = data.status;
    }

    if (typeof data.certificadoEmitido === "boolean") {
        if (!inscricao.oferta.possuiCertificacao) {
            throw new Error("Esta oferta não possui certificação");
        }

        const statusFinal = payload.status || inscricao.status;
        const presencaFinal =
            typeof payload.presenca === "boolean"
                ? payload.presenca
                : inscricao.presenca;

        if (data.certificadoEmitido === true) {
            if (statusFinal !== "PRESENTE" && presencaFinal !== true) {
                throw new Error("Só é possível emitir certificado para participante presente");
            }
        }

        payload.certificadoEmitido = data.certificadoEmitido;
    }

    return prisma.ofertaInscricao.update({
        where: { id: inscricaoId },
        data: payload,
        include: {
            user: true,
            oferta: true,
        },
    });
}

function getUserPublicoRole(userRole) {
    return ROLE_MAP[userRole] || null;
}

function getMotivoBloqueio(oferta, inscricaoDoUsuario, totalInscritosAtivos) {
    const now = new Date();

    if (!oferta.ativo) return "INATIVA";
    if (oferta.status === "CANCELADO") return "CANCELADA";
    if (oferta.status === "ENCERRADO") return "ENCERRADA";
    if (oferta.status !== "PUBLICADO") return "NAO_PUBLICADA";
    if (!oferta.permiteInscricao) return "INSCRICAO_DESABILITADA";

    if (inscricaoDoUsuario) {
        if (inscricaoDoUsuario.status === "CANCELADO") {
            return null;
        }
        return "JA_INSCRITO";
    }

    if (oferta.dataEvento && new Date(oferta.dataEvento) < now) {
        return "EVENTO_REALIZADO";
    }

    if (oferta.inicioInscricoes && now < new Date(oferta.inicioInscricoes)) {
        return "INSCRICAO_NAO_INICIADA";
    }

    if (oferta.fimInscricoes && now > new Date(oferta.fimInscricoes)) {
        return "INSCRICAO_ENCERRADA";
    }

    if (
        oferta.vagas !== null &&
        oferta.vagas !== undefined &&
        totalInscritosAtivos >= oferta.vagas
    ) {
        return "LOTADO";
    }

    return null;
}

export async function listOfertasDisponiveisParaUsuario(user) {
    const publicoRole = getUserPublicoRole(user.role);
    const userId = Number(user?.sub);

    if (!publicoRole || !userId) {
        return [];
    }

    const ofertas = await prisma.ofertaAcademica.findMany({
        where: {
            ativo: true,
            status: "PUBLICADO",
            publicosAlvo: {
                some: {
                    role: publicoRole,
                },
            },
        },
        include: {
            espacos: {
                include: {
                    sala: {
                        select: {
                            id: true,
                            nome: true,
                            capacidade: true,
                            bloco: true,
                        },
                    },
                },
                orderBy: {
                    ordem: "asc",
                },
            },
            publicosAlvo: true,
            inscricoes: {
                where: {
                    OR: [
                        { status: { in: ["INSCRITO", "PRESENTE", "AUSENTE", "LISTA_ESPERA"] } },
                        { userId },
                    ],
                },
            },
            _count: {
                select: {
                    inscricoes: {
                        where: {
                            status: {
                                in: ["INSCRITO", "PRESENTE"],
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            dataEvento: "asc",
        },
    });

    return ofertas.map((oferta) => {
        const inscricaoDoUsuario = oferta.inscricoes.find(
            (item) => item.userId === userId && item.status !== "CANCELADO"
        );

        const totalInscritosAtivos = oferta._count?.inscricoes ?? 0;
        const motivoBloqueio = getMotivoBloqueio(
            oferta,
            inscricaoDoUsuario,
            totalInscritosAtivos
        );

        return {
            id: oferta.id,
            titulo: oferta.titulo,
            tipo: oferta.tipo,
            descricao: oferta.descricao,
            observacoes: oferta.observacoes,
            local: oferta.local,
            espacos: oferta.espacos,
            dataEvento: oferta.dataEvento,
            horaInicio: oferta.horaInicio,
            horaFim: oferta.horaFim,
            inicioInscricoes: oferta.inicioInscricoes,
            fimInscricoes: oferta.fimInscricoes,
            vagas: oferta.vagas,
            permiteInscricao: oferta.permiteInscricao,
            possuiCertificacao: oferta.possuiCertificacao,
            status: oferta.status,
            totalInscritos: totalInscritosAtivos,
            inscricaoDoUsuario,
            podeInscrever: !motivoBloqueio,
            motivoBloqueio,
        };
    });
}

export async function listMinhasInscricoes(userId) {
    return prisma.ofertaInscricao.findMany({
        where: {
            userId,
        },
        include: {
            oferta: {
                include: {
                    publicosAlvo: true,
                    espacos: {
                        include: {
                            sala: {
                                select: {
                                    id: true,
                                    nome: true,
                                    capacidade: true,
                                    bloco: true,
                                },
                            },
                        },
                        orderBy: {
                            ordem: "asc",
                        },
                    },
                },
            },
        },
        orderBy: {
            dataInscricao: "desc",
        },
    });
}