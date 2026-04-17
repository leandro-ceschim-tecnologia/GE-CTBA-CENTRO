import prisma from "../prisma/client.js";

const ROLE_MAP = {
    aluno: "ALUNO",
    instrutor: "INSTRUTOR",
    coordenacao: "COORDENACAO",
    coordsetor: "COORDSETOR",
    pedagogico: "PEDAGOGICO",
    admin: "ADMIN",
    comercial: "COMERCIAL",
    secretaria: "SECRETARIA",
};

function toDate(value) {
    return value ? new Date(value) : null;
}

function getUserPublicoRole(userRole) {
    return ROLE_MAP[userRole] || null;
}

function getStatusEfetivo(informativo) {
    const now = new Date();

    if (informativo.status === "INATIVO") return "INATIVO";
    if (informativo.status === "RASCUNHO") return "RASCUNHO";

    if (informativo.dataExpiracao && new Date(informativo.dataExpiracao) < now) {
        return "EXPIRADO";
    }

    return informativo.status;
}

function podeVisualizarPorData(informativo) {
    const now = new Date();

    if (informativo.status !== "PUBLICADO") return false;

    if (informativo.dataPublicacao && new Date(informativo.dataPublicacao) > now) {
        return false;
    }

    if (informativo.dataExpiracao && new Date(informativo.dataExpiracao) < now) {
        return false;
    }

    return true;
}

function buildResumoSegmentacao(informativo) {
    const cursoNomes = Array.isArray(informativo.cursos)
        ? informativo.cursos.map((item) => item.curso?.nome).filter(Boolean)
        : [];

    const turmaNomes = Array.isArray(informativo.turmas)
        ? informativo.turmas.map((item) => item.turma?.nome).filter(Boolean)
        : [];

    const destinatarioNomes = Array.isArray(informativo.destinatarios)
        ? informativo.destinatarios.map((item) => item.user?.nome).filter(Boolean)
        : [];

    const publicos = Array.isArray(informativo.publicos)
        ? informativo.publicos.map((item) => item.role)
        : [];

    const partes = [];

    if (publicos.includes("ALUNO")) {
        if (destinatarioNomes.length) {
            partes.push(`Aluno(s): ${destinatarioNomes.join(", ")}`);
        } else if (turmaNomes.length) {
            partes.push(`Turma(s): ${turmaNomes.join(", ")}`);
        } else if (cursoNomes.length) {
            partes.push(`Curso(s): ${cursoNomes.join(", ")}`);
        } else {
            partes.push("Todos os alunos");
        }
    }

    if (publicos.includes("INSTRUTOR")) {
        if (destinatarioNomes.length) {
            partes.push(`Usuário(s): ${destinatarioNomes.join(", ")}`);
        } else {
            partes.push("Todos os instrutores");
        }
    }

    if (publicos.includes("COORDENACAO")) {
        if (destinatarioNomes.length) {
            partes.push(`Usuário(s): ${destinatarioNomes.join(", ")}`);
        } else {
            partes.push("Toda a coordenação");
        }
    }

    if (publicos.includes("PEDAGOGICO")) {
        if (destinatarioNomes.length) {
            partes.push(`Usuário(s): ${destinatarioNomes.join(", ")}`);
        } else {
            partes.push("Todo o pedagógico");
        }
    }

    if (publicos.includes("COORDSETOR")) {
        if (destinatarioNomes.length) {
            partes.push(`Usuário(s): ${destinatarioNomes.join(", ")}`);
        } else {
            partes.push("Todo os coordenadores de setor");
        }
    }

    if (publicos.includes("ADMIN")) {
        if (destinatarioNomes.length) {
            partes.push(`Usuário(s): ${destinatarioNomes.join(", ")}`);
        } else {
            partes.push("Todos os administradores");
        }
    }

    if (publicos.includes("COMERCIAL")) {
        if (destinatarioNomes.length) {
            partes.push(`Usuário(s): ${destinatarioNomes.join(", ")}`);
        } else {
            partes.push("Todo o comercial");
        }
    }

    if (publicos.includes("SECRETARIA")) {
        if (destinatarioNomes.length) {
            partes.push(`Usuário(s): ${destinatarioNomes.join(", ")}`);
        } else {
            partes.push("Toda a secretaria");
        }
    }

    return partes.length ? partes.join(" • ") : "Sem segmentação específica";
}

async function validarCursos(cursoIds = []) {
    if (!cursoIds.length) return;

    const encontrados = await prisma.curso.findMany({
        where: { id: { in: cursoIds } },
        select: { id: true },
    });

    if (encontrados.length !== cursoIds.length) {
        throw new Error("Um ou mais cursos informados não foram encontrados.");
    }
}

async function validarTurmas(turmaIds = []) {
    if (!turmaIds.length) return;

    const encontradas = await prisma.turma.findMany({
        where: { id: { in: turmaIds } },
        select: { id: true },
    });

    if (encontradas.length !== turmaIds.length) {
        throw new Error("Uma ou mais turmas informadas não foram encontradas.");
    }
}

async function validarDestinatarios(userIds = []) {
    if (!userIds.length) return;

    const encontrados = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
    });

    if (encontrados.length !== userIds.length) {
        throw new Error("Um ou mais destinatários informados não foram encontrados.");
    }
}

function validarPayloadSegmentacao(data) {
    if (!Array.isArray(data.publicos) || !data.publicos.length) {
        throw new Error("Selecione ao menos um público-alvo.");
    }

    if (Array.isArray(data.turmaIds) && data.turmaIds.length && !data.publicos.includes("ALUNO")) {
        throw new Error("Turmas só podem ser usadas quando o público incluir ALUNO.");
    }

    if (Array.isArray(data.cursoIds) && data.cursoIds.length && !data.publicos.includes("ALUNO")) {
        throw new Error("Cursos só podem ser usados quando o público incluir ALUNO.");
    }

    if (
        data.dataPublicacao &&
        data.dataExpiracao &&
        new Date(data.dataExpiracao) < new Date(data.dataPublicacao)
    ) {
        throw new Error("A data de expiração não pode ser menor que a data de publicação.");
    }
}

function buildCreateRelations(data) {
    return {
        publicos: {
            create: (data.publicos || []).map((role) => ({ role })),
        },
        cursos: {
            create: (data.cursoIds || []).map((cursoId) => ({ cursoId })),
        },
        turmas: {
            create: (data.turmaIds || []).map((turmaId) => ({ turmaId })),
        },
        destinatarios: {
            create: (data.destinatarioIds || []).map((userId) => ({ userId })),
        },
    };
}

function getIncludeCompleto() {
    return {
        createdBy: {
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
            },
        },
        publicos: true,
        cursos: {
            include: {
                curso: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        },
        turmas: {
            include: {
                turma: {
                    select: {
                        id: true,
                        nome: true,
                        turno: true,
                        cursoId: true,
                        curso: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },
                    },
                },
            },
        },
        destinatarios: {
            include: {
                user: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        role: true,
                        turmaId: true,
                    },
                },
            },
        },
    };
}

export async function createInformativo(data, currentUserId) {
    validarPayloadSegmentacao(data);

    await Promise.all([
        validarCursos(data.cursoIds || []),
        validarTurmas(data.turmaIds || []),
        validarDestinatarios(data.destinatarioIds || []),
    ]);

    const informativo = await prisma.informativo.create({
        data: {
            titulo: data.titulo,
            descricao: data.descricao,
            prioridade: data.prioridade,
            status: data.status || "RASCUNHO",
            dataPublicacao: toDate(data.dataPublicacao),
            dataExpiracao: toDate(data.dataExpiracao),
            createdById: currentUserId,
            ...buildCreateRelations(data),
        },
        include: getIncludeCompleto(),
    });

    return {
        ...informativo,
        statusEfetivo: getStatusEfetivo(informativo),
        segmentacaoResumo: buildResumoSegmentacao(informativo),
    };
}

export async function listInformativosAdmin() {
    const informativos = await prisma.informativo.findMany({
        include: getIncludeCompleto(),
        orderBy: [
            { createdAt: "desc" },
            { id: "desc" },
        ],
    });

    return informativos.map((item) => ({
        ...item,
        statusEfetivo: getStatusEfetivo(item),
        segmentacaoResumo: buildResumoSegmentacao(item),
    }));
}

export async function getInformativoById(id) {
    const informativo = await prisma.informativo.findUnique({
        where: { id },
        include: getIncludeCompleto(),
    });

    if (!informativo) {
        throw new Error("Informativo não encontrado.");
    }

    return {
        ...informativo,
        statusEfetivo: getStatusEfetivo(informativo),
        segmentacaoResumo: buildResumoSegmentacao(informativo),
    };
}

export async function updateInformativo(id, data) {
    validarPayloadSegmentacao(data);

    const existente = await prisma.informativo.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!existente) {
        throw new Error("Informativo não encontrado.");
    }

    await Promise.all([
        validarCursos(data.cursoIds || []),
        validarTurmas(data.turmaIds || []),
        validarDestinatarios(data.destinatarioIds || []),
    ]);

    const informativo = await prisma.$transaction(async (tx) => {
        await tx.informativoPublico.deleteMany({ where: { informativoId: id } });
        await tx.informativoCurso.deleteMany({ where: { informativoId: id } });
        await tx.informativoTurma.deleteMany({ where: { informativoId: id } });
        await tx.informativoDestinatario.deleteMany({ where: { informativoId: id } });

        return tx.informativo.update({
            where: { id },
            data: {
                titulo: data.titulo,
                descricao: data.descricao,
                prioridade: data.prioridade,
                status: data.status || "RASCUNHO",
                dataPublicacao: toDate(data.dataPublicacao),
                dataExpiracao: toDate(data.dataExpiracao),
                ...buildCreateRelations(data),
            },
            include: getIncludeCompleto(),
        });
    });

    return {
        ...informativo,
        statusEfetivo: getStatusEfetivo(informativo),
        segmentacaoResumo: buildResumoSegmentacao(informativo),
    };
}

export async function updateInformativoStatus(id, status) {
    const existente = await prisma.informativo.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!existente) {
        throw new Error("Informativo não encontrado.");
    }

    const informativo = await prisma.informativo.update({
        where: { id },
        data: { status },
        include: getIncludeCompleto(),
    });

    return {
        ...informativo,
        statusEfetivo: getStatusEfetivo(informativo),
        segmentacaoResumo: buildResumoSegmentacao(informativo),
    };
}

export async function listInformativosAtivosParaUsuario(user) {
    const userId = Number(user?.sub);
    const userRole = getUserPublicoRole(user?.role);

    if (!userId || !userRole) {
        return [];
    }

    const userCompleto = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            role: true,
            turmaId: true,
            turma: {
                select: {
                    id: true,
                    cursoId: true,
                },
            },
        },
    });

    if (!userCompleto) {
        return [];
    }

    const informativos = await prisma.informativo.findMany({
        where: {
            status: "PUBLICADO",
            publicos: {
                some: {
                    role: userRole,
                },
            },
        },
        include: getIncludeCompleto(),
        orderBy: [
            { prioridade: "asc" },
            { dataPublicacao: "desc" },
            { createdAt: "desc" },
        ],
    });

    return informativos
        .filter((item) => podeVisualizarPorData(item))
        .filter((item) => {
            const cursoIds = item.cursos.map((c) => c.cursoId);
            const turmaIds = item.turmas.map((t) => t.turmaId);
            const destinatarioIds = item.destinatarios.map((d) => d.userId);

            const temFiltroCurso = cursoIds.length > 0;
            const temFiltroTurma = turmaIds.length > 0;
            const temFiltroDestinatario = destinatarioIds.length > 0;

            if (!temFiltroCurso && !temFiltroTurma && !temFiltroDestinatario) {
                return true;
            }

            const matchDestinatario = destinatarioIds.includes(userCompleto.id);

            if (userRole === "ALUNO") {
                const matchTurma =
                    userCompleto.turmaId && turmaIds.includes(userCompleto.turmaId);

                const matchCurso =
                    userCompleto.turma?.cursoId && cursoIds.includes(userCompleto.turma.cursoId);

                return Boolean(matchDestinatario || matchTurma || matchCurso);
            }

            if (temFiltroDestinatario) {
                return matchDestinatario;
            }

            return true;
        })
        .map((item) => ({
            ...item,
            statusEfetivo: getStatusEfetivo(item),
            segmentacaoResumo: buildResumoSegmentacao(item),
        }));
}

export async function listDestinatariosInformativos() {
    const usuarios = await prisma.user.findMany({
        where: {
            ativo: true,
        },
        select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            turmaId: true,
            turma: {
                select: {
                    id: true,
                    nome: true,
                    cursoId: true,
                    curso: {
                        select: {
                            id: true,
                            nome: true,
                        },
                    },
                },
            },
        },
        orderBy: [
            { nome: "asc" },
            { id: "asc" },
        ],
    });

    return usuarios;
}