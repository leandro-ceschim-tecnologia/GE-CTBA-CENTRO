import prisma from "../prisma/client.js";

const TIPO_TAREFA_LEVANTAMENTO_CH_ESTAGIO = "LEVANTAMENTO_CH_ESTAGIO";
const LIMITE_LEVANTAMENTO_CH_POR_QUINTA = 10;

const TIPOS_TAREFA_PEDAGOGICA = [
    { value: "LEVANTAMENTO_CH_ESTAGIO", label: "Levantamento de CH de Estágio" },
    { value: "CONTATO_INSTRUTOR", label: "Contato com instrutor" },
    { value: "AJUSTE_CRONOGRAMA", label: "Ajuste de cronograma" },
    { value: "DOCUMENTACAO_ESTAGIO", label: "Documentação de estágio" },
    { value: "LANCAMENTO_SISTEMA", label: "Lançamento em sistema" },
    { value: "CONFERENCIA_DIARIOS", label: "Conferência de diários" },
    { value: "RESPONDER_WHATS_AD", label: "Responder WhatsApp e AD" },
    { value: "CONTATO_ALUNO", label: "Contato com aluno" },
    { value: "EMISSAO_DOCUMENTO", label: "Emissão de documento" },
    { value: "LIGACOES_PARA_LFR", label: "Ligações para LFR" },
    { value: "LIGACOES_PARA_LFI", label: "Ligações para LFI" },
    { value: "LIGACOES_PARA_NC_LAC", label: "Ligações para NC e LAC" },
    { value: "LIGACOES_FALTOSOS", label: "Ligações para faltosos T e P" },
    { value: "REQUERIMENTOS_SECRETARIA", label: "Entregar requerimentos sem custo para a secretaria" },
    { value: "SEPARAR_MATERIAL", label: "Separar pastas e cestas para aulas" },
    { value: "OUTRO", label: "Outro" },
];

const TURNOS_TAREFA_PEDAGOGICA = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
    { value: "INTEGRAL", label: "Integral" },
    { value: "SABADO", label: "Sábado" },
];

const STATUS_TAREFA_PEDAGOGICA = [
    { value: "PENDENTE", label: "Pendente" },
    { value: "EM_EXECUCAO", label: "Em execução" },
    { value: "CONCLUIDA", label: "Concluída" },
    { value: "CANCELADA", label: "Cancelada" },
];

function normalizarTexto(valor) {
    return String(valor ?? "").trim();
}

function getTipoTarefaPedagogicaLabel(tipo) {
    const found = TIPOS_TAREFA_PEDAGOGICA.find((item) => item.value === tipo);
    return found ? found.label : tipo;
}

function getTurnoTarefaPedagogicaLabel(turno) {
    const found = TURNOS_TAREFA_PEDAGOGICA.find((item) => item.value === turno);
    return found ? found.label : turno;
}

function getStatusTarefaPedagogicaLabel(status) {
    const found = STATUS_TAREFA_PEDAGOGICA.find((item) => item.value === status);
    return found ? found.label : status;
}

function getTodayLocalISO() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function parseDateToISO(value) {
    if (!value) return null;

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
            const [dd, mm, yyyy] = trimmed.split("/");
            return `${yyyy}-${mm}-${dd}`;
        }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function isoDateToDbDate(isoDate) {
    if (!isoDate) return null;
    return new Date(`${isoDate}T12:00:00.000Z`);
}

function dbDateToISO(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
    const base = new Date(`${isoDate}T12:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() + days);
    return base.toISOString().slice(0, 10);
}

function getDayOfWeek(isoDate) {
    const date = new Date(`${isoDate}T12:00:00.000Z`);
    return date.getUTCDay();
}

function isThursday(isoDate) {
    return getDayOfWeek(isoDate) === 4;
}

function getNextThursdayOnOrAfter(isoDate = getTodayLocalISO()) {
    const currentDay = getDayOfWeek(isoDate);
    const diff = (4 - currentDay + 7) % 7;
    return addDays(isoDate, diff);
}

function getNextThursdayAfter(isoDate) {
    return addDays(isoDate, 7);
}

function buildTarefaResponse(item) {
    const prazoISO = dbDateToISO(item.prazo);
    const dataCriacaoISO = dbDateToISO(item.dataCriacao);
    const dataConclusaoISO = dbDateToISO(item.dataConclusao);

    const hoje = getTodayLocalISO();
    const atrasada =
        item.status !== "CONCLUIDA" &&
        item.status !== "CANCELADA" &&
        Boolean(prazoISO) &&
        prazoISO < hoje;

    return {
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao || "",
        tipo: item.tipo,
        tipoLabel: getTipoTarefaPedagogicaLabel(item.tipo),
        prazo: prazoISO,
        turno: item.turno,
        turnoLabel: getTurnoTarefaPedagogicaLabel(item.turno),
        status: item.status,
        statusLabel: getStatusTarefaPedagogicaLabel(item.status),
        responsavelId: item.responsavelId,
        responsavelNome: item.responsavel?.nome || "",
        criadoPorId: item.criadoPorId,
        criadoPorNome: item.criadoPor?.nome || "",
        dataCriacao: dataCriacaoISO,
        dataConclusao: dataConclusaoISO,
        observacoes: item.observacoes || "",
        atrasada,
    };
}

async function validarResponsavelPedagogico(responsavelId) {
    const responsavel = await prisma.user.findUnique({
        where: { id: Number(responsavelId) },
        select: {
            id: true,
            nome: true,
            role: true,
            ativo: true,
        },
    });

    if (!responsavel) {
        throw new Error("Responsável não encontrado.");
    }

    if (!responsavel.ativo) {
        throw new Error("O responsável informado está inativo.");
    }

    if (responsavel.role !== "pedagogico") {
        throw new Error("O responsável deve ser um usuário do setor pedagógico.");
    }

    return responsavel;
}

async function validarCriador(criadoPorId) {
    const criador = await prisma.user.findUnique({
        where: { id: Number(criadoPorId) },
        select: {
            id: true,
            nome: true,
            role: true,
            ativo: true,
        },
    });

    if (!criador) {
        throw new Error("Usuário criador não encontrado.");
    }

    if (!criador.ativo) {
        throw new Error("O usuário criador está inativo.");
    }

    return criador;
}

async function countLevantamentosNaQuinta(dataPrazoISO, ignoreId = null) {
    const where = {
        tipo: TIPO_TAREFA_LEVANTAMENTO_CH_ESTAGIO,
        prazo: isoDateToDbDate(dataPrazoISO),
        status: {
            not: "CANCELADA",
        },
    };

    if (ignoreId) {
        where.id = { not: Number(ignoreId) };
    }

    return prisma.tarefaPedagogica.count({ where });
}

export function getTiposTarefaPedagogica() {
    return [...TIPOS_TAREFA_PEDAGOGICA];
}

export function getTurnosTarefaPedagogica() {
    return [...TURNOS_TAREFA_PEDAGOGICA];
}

export async function listPedagogicosAtivos() {
    const users = await prisma.user.findMany({
        where: {
            ativo: true,
            role: "pedagogico",
        },
        select: {
            id: true,
            nome: true,
            email: true,
            role: true,
        },
        orderBy: [
            { nome: "asc" },
            { id: "asc" },
        ],
    });

    return users;
}

export async function listTarefasPedagogicas(filters = {}) {
    const where = {};

    if (filters.responsavelId) {
        where.responsavelId = Number(filters.responsavelId);
    }

    if (filters.status) {
        where.status = filters.status;
    }

    const tarefas = await prisma.tarefaPedagogica.findMany({
        where,
        include: {
            responsavel: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
            criadoPor: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: [
            { prazo: "asc" },
            { status: "asc" },
            { titulo: "asc" },
            { id: "asc" },
        ],
    });

    return tarefas.map(buildTarefaResponse);
}

export async function getTarefaPedagogicaById(id) {
    const tarefa = await prisma.tarefaPedagogica.findUnique({
        where: { id: Number(id) },
        include: {
            responsavel: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
            criadoPor: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    if (!tarefa) {
        throw new Error("Tarefa não encontrada.");
    }

    return buildTarefaResponse(tarefa);
}

export async function getResumoTarefasPedagogicas(filters = {}) {
    const tarefas = await listTarefasPedagogicas(filters);

    return {
        total: tarefas.length,
        pendentes: tarefas.filter((item) => item.status === "PENDENTE").length,
        emExecucao: tarefas.filter((item) => item.status === "EM_EXECUCAO").length,
        concluidas: tarefas.filter((item) => item.status === "CONCLUIDA").length,
        canceladas: tarefas.filter((item) => item.status === "CANCELADA").length,
        atrasadas: tarefas.filter((item) => item.atrasada).length,
    };
}

export async function validarSugestaoPrazoLevantamentoCH({
    prazoDesejado,
    confirmarAutoAgendamento = false,
}) {
    const hoje = getTodayLocalISO();
    const prazoISO = parseDateToISO(prazoDesejado);

    if (!prazoISO) {
        return {
            success: false,
            requiresConfirmation: false,
            message: "Informe uma data de prazo válida.",
        };
    }

    if (prazoISO < hoje) {
        return {
            success: false,
            requiresConfirmation: false,
            message: "O prazo não pode ser uma data anterior a hoje.",
        };
    }

    let quintaRef = isThursday(prazoISO)
        ? prazoISO
        : getNextThursdayOnOrAfter(prazoISO);

    let totalNaQuinta = await countLevantamentosNaQuinta(quintaRef);

    while (totalNaQuinta >= LIMITE_LEVANTAMENTO_CH_POR_QUINTA) {
        quintaRef = getNextThursdayAfter(quintaRef);
        totalNaQuinta = await countLevantamentosNaQuinta(quintaRef);
    }

    if (quintaRef !== prazoISO && !confirmarAutoAgendamento) {
        return {
            success: false,
            requiresConfirmation: true,
            suggestedDate: quintaRef,
            message:
                `A atividade "${getTipoTarefaPedagogicaLabel(TIPO_TAREFA_LEVANTAMENTO_CH_ESTAGIO)}" aceita no máximo ${LIMITE_LEVANTAMENTO_CH_POR_QUINTA} tarefas por quinta-feira. ` +
                `A próxima quinta-feira disponível é ${quintaRef.split("-").reverse().join("/")}. Deseja agendar automaticamente nessa data?`,
        };
    }

    return {
        success: true,
        finalDate: quintaRef,
        message: "Data validada com sucesso.",
    };
}

export async function createTarefaPedagogica(payload, currentUserId) {
    const hoje = getTodayLocalISO();

    const titulo = normalizarTexto(payload.titulo);
    const descricao = normalizarTexto(payload.descricao);
    const tipo = payload.tipo;
    const prazo = parseDateToISO(payload.prazo);
    const turno = payload.turno;
    const responsavelId = Number(payload.responsavelId);
    const observacoes = normalizarTexto(payload.observacoes);
    const confirmarAutoAgendamento = Boolean(payload.confirmarAutoAgendamento);

    if (!titulo || !tipo || !prazo || !turno || !responsavelId || !currentUserId) {
        return {
            success: false,
            message: "Preencha os campos obrigatórios.",
        };
    }

    if (prazo < hoje) {
        return {
            success: false,
            message: "O prazo não pode ser uma data anterior a hoje.",
        };
    }

    const [responsavel, criador] = await Promise.all([
        validarResponsavelPedagogico(responsavelId),
        validarCriador(currentUserId),
    ]);

    let prazoFinal = prazo;

    if (tipo === TIPO_TAREFA_LEVANTAMENTO_CH_ESTAGIO) {
        const validacao = await validarSugestaoPrazoLevantamentoCH({
            prazoDesejado: prazo,
            confirmarAutoAgendamento,
        });

        if (!validacao.success) {
            return {
                success: false,
                requiresConfirmation: validacao.requiresConfirmation,
                suggestedDate: validacao.suggestedDate || null,
                message: validacao.message,
            };
        }

        prazoFinal = validacao.finalDate;

        const totalNoPrazoFinal = await countLevantamentosNaQuinta(prazoFinal);
        if (totalNoPrazoFinal >= LIMITE_LEVANTAMENTO_CH_POR_QUINTA) {
            return {
                success: false,
                message: "Não foi possível agendar a tarefa. O limite para essa quinta-feira já foi atingido.",
            };
        }
    }

    const novaTarefa = await prisma.tarefaPedagogica.create({
        data: {
            titulo,
            descricao: descricao || null,
            tipo,
            prazo: isoDateToDbDate(prazoFinal),
            turno,
            status: "PENDENTE",
            responsavelId: responsavel.id,
            criadoPorId: criador.id,
            observacoes: observacoes || null,
        },
        include: {
            responsavel: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
            criadoPor: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    return {
        success: true,
        autoScheduled: prazoFinal !== prazo,
        finalDate: prazoFinal,
        message:
            prazoFinal !== prazo
                ? `Tarefa agendada automaticamente para ${prazoFinal.split("-").reverse().join("/")}.`
                : "Tarefa criada com sucesso.",
        tarefa: buildTarefaResponse(novaTarefa),
    };
}

export async function createTarefasPedagogicasEmLote(payload, currentUserId) {
    const datas = Array.isArray(payload.datas)
        ? payload.datas.map((item) => parseDateToISO(item)).filter(Boolean)
        : [];

    if (!datas.length) {
        return {
            success: false,
            message: "Informe ao menos uma data para criar as tarefas.",
        };
    }

    if (payload.tipo === TIPO_TAREFA_LEVANTAMENTO_CH_ESTAGIO) {
        return {
            success: false,
            message: "A tarefa Levantamento de CH de Estágio não permite criação por lote.",
        };
    }

    const [responsavel, criador] = await Promise.all([
        validarResponsavelPedagogico(payload.responsavelId),
        validarCriador(currentUserId),
    ]);

    const hoje = getTodayLocalISO();
    const datasInvalidas = datas.filter((data) => data < hoje);

    if (datasInvalidas.length) {
        return {
            success: false,
            message: "Uma ou mais datas informadas são anteriores a hoje.",
        };
    }

    const titulo = normalizarTexto(payload.titulo);
    const descricao = normalizarTexto(payload.descricao);
    const observacoes = normalizarTexto(payload.observacoes);

    const criadas = await prisma.$transaction(
        datas.map((data) =>
            prisma.tarefaPedagogica.create({
                data: {
                    titulo,
                    descricao: descricao || null,
                    tipo: payload.tipo,
                    prazo: isoDateToDbDate(data),
                    turno: payload.turno,
                    status: "PENDENTE",
                    responsavelId: responsavel.id,
                    criadoPorId: criador.id,
                    observacoes: observacoes || null,
                },
                include: {
                    responsavel: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            role: true,
                        },
                    },
                    criadoPor: {
                        select: {
                            id: true,
                            nome: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            })
        )
    );

    return {
        success: true,
        message: `${criadas.length} tarefa(s) criada(s) com sucesso.`,
        tarefas: criadas.map(buildTarefaResponse),
    };
}

export async function updateStatusTarefaPedagogica(id, novoStatus) {
    const tarefa = await prisma.tarefaPedagogica.findUnique({
        where: { id: Number(id) },
        select: {
            id: true,
            status: true,
        },
    });

    if (!tarefa) {
        throw new Error("Tarefa não encontrada.");
    }

    const dataConclusao = novoStatus === "CONCLUIDA" ? new Date() : null;

    const atualizada = await prisma.tarefaPedagogica.update({
        where: { id: Number(id) },
        data: {
            status: novoStatus,
            dataConclusao,
        },
        include: {
            responsavel: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
            criadoPor: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    return {
        success: true,
        message: "Status da tarefa atualizado com sucesso.",
        tarefa: buildTarefaResponse(atualizada),
    };
}

export async function deleteTarefaPedagogica(id) {
    const tarefa = await prisma.tarefaPedagogica.findUnique({
        where: { id: Number(id) },
        select: { id: true },
    });

    if (!tarefa) {
        throw new Error("Tarefa não encontrada.");
    }

    await prisma.tarefaPedagogica.delete({
        where: { id: Number(id) },
    });

    return {
        success: true,
        message: "Tarefa excluída com sucesso.",
    };
}