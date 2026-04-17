import prisma from "../prisma/client.js";

const DIA_SEMANA_MAP = {
    0: "DOMINGO",
    1: "SEGUNDA",
    2: "TERCA",
    3: "QUARTA",
    4: "QUINTA",
    5: "SEXTA",
    6: "SABADO",
};

const PERIODOS = ["MANHA", "TARDE", "NOITE"];

function parseDateOnly(dateString) {
    if (!dateString) return null;

    const [year, month, day] = String(dateString).split("-").map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day, 12, 0, 0);
}

function getDiaSemanaFromDate(date) {
    return DIA_SEMANA_MAP[date.getDay()] || null;
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

    // manhã: 06:00 - 11:59
    if (inicioFinal < 12 * 60 && fimFinal > 6 * 60) {
        periodos.add("MANHA");
    }

    // tarde: 12:00 - 17:59
    if (inicioFinal < 18 * 60 && fimFinal > 12 * 60) {
        periodos.add("TARDE");
    }

    // noite: 18:00 - 23:59
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

function buildMatrix(salas) {
    return salas.map((sala) => ({
        sala,
        periodos: {
            MANHA: [],
            TARDE: [],
            NOITE: [],
        },
    }));
}

function pushToMatrix(matrix, salaId, periodo, item) {
    const row = matrix.find((entry) => String(entry.sala.id) === String(salaId));
    if (!row) return;
    if (!row.periodos[periodo]) return;
    row.periodos[periodo].push(item);
}

function getResumoConflitos(matrix) {
    let totalConflitos = 0;

    matrix.forEach((row) => {
        PERIODOS.forEach((periodo) => {
            if ((row.periodos[periodo] || []).length > 1) {
                totalConflitos += 1;
            }
        });
    });

    return totalConflitos;
}

export async function getOcupacaoSalasPorData(req, res, next) {
    try {
        const dataRef = req.query.data;
        const date = parseDateOnly(dataRef);

        if (!date) {
            return res.status(400).json({
                message: "Informe a data no formato YYYY-MM-DD.",
            });
        }

        const diaSemana = getDiaSemanaFromDate(date);

        const salas = await prisma.sala.findMany({
            where: {
                ativo: true,
            },
            orderBy: [
                { ordem: "asc" },
                { nome: "asc" },
            ],
        });

        const matrix = buildMatrix(salas);

        const ensalamentos = await prisma.ensalamentoItem.findMany({
            where: {
                ativo: true,
                diaSemana,
                sala: {
                    ativo: true,
                },
            },
            include: {
                sala: true,
                turma: {
                    include: {
                        curso: true,
                    },
                },
            },
            orderBy: [
                { salaId: "asc" },
                { periodo: "asc" },
            ],
        });

        ensalamentos.forEach((item) => {
            pushToMatrix(matrix, item.salaId, item.periodo, {
                origem: "ENSALAMENTO",
                origemLabel: "Ensalamento",
                id: item.id,
                titulo: item?.turma?.nome || item?.textoLivre || "Uso definido",
                subtitulo: item?.turma?.curso?.nome || null,
                observacoes: item?.observacoes || null,
                periodo: item.periodo,
                salaId: item.salaId,
            });
        });

        const ofertas = await prisma.ofertaAcademica.findMany({
            where: {
                ativo: true,
                status: {
                    in: ["RASCUNHO", "PUBLICADO"],
                },
                dataEvento: {
                    gte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
                    lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0),
                },
            },
            include: {
                espacos: {
                    include: {
                        sala: true,
                    },
                    orderBy: {
                        ordem: "asc",
                    },
                },
                instrutor: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
            orderBy: {
                dataEvento: "asc",
            },
        });

        ofertas.forEach((oferta) => {
            const periodosOferta = getPeriodosFromHorario(oferta.horaInicio, oferta.horaFim);

            (oferta.espacos || []).forEach((espaco) => {
                if (!espaco.salaId) return;

                periodosOferta.forEach((periodo) => {
                    pushToMatrix(matrix, espaco.salaId, periodo, {
                        origem: "OFERTA",
                        origemLabel: "Oferta Acadêmica",
                        id: oferta.id,
                        titulo: oferta.titulo,
                        subtitulo: oferta?.instrutor?.nome || espaco?.textoLivre || null,
                        observacoes: espaco?.observacoes || oferta?.observacoes || null,
                        periodo,
                        salaId: espaco.salaId,
                        horaInicio: oferta.horaInicio || null,
                        horaFim: oferta.horaFim || null,
                    });
                });
            });
        });

        const totalConflitos = getResumoConflitos(matrix);

        const listaDetalhada = matrix.flatMap((row) =>
            PERIODOS.flatMap((periodo) =>
                (row.periodos[periodo] || []).map((item) => ({
                    sala: row.sala,
                    periodo,
                    conflito: (row.periodos[periodo] || []).length > 1,
                    ...item,
                }))
            )
        );

        return res.status(200).json({
            data: dataRef,
            diaSemana,
            resumo: {
                totalSalas: salas.length,
                totalEnsalamentos: ensalamentos.length,
                totalOfertas: ofertas.length,
                totalConflitos,
            },
            matrix,
            listaDetalhada,
        });
    } catch (error) {
        next(error);
    }
}