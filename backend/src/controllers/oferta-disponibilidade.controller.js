import prisma from "../prisma/client.js";

function toDate(dateStr) {
    if (!dateStr) return null;
    const [year, month, day] = String(dateStr).split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 12, 0, 0);
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

    if (inicio === null && fim === null) return ["NOITE"];

    const inicioFinal = inicio ?? fim;
    const fimFinal = fim ?? inicio;
    const periodos = new Set();

    if (inicioFinal < 12 * 60 && fimFinal > 6 * 60) periodos.add("MANHA");
    if (inicioFinal < 18 * 60 && fimFinal > 12 * 60) periodos.add("TARDE");
    if (inicioFinal < 24 * 60 && fimFinal > 18 * 60) periodos.add("NOITE");

    if (!periodos.size) {
        if (inicioFinal < 12 * 60) return ["MANHA"];
        if (inicioFinal < 18 * 60) return ["TARDE"];
        return ["NOITE"];
    }

    return Array.from(periodos);
}

export async function verificarDisponibilidadeOferta(req, res, next) {
    try {
        const {
            dataEvento,
            horaInicio,
            horaFim,
            salaIds,
            ofertaIdIgnorar,
        } = req.body || {};

        const salaIdsValidos = Array.isArray(salaIds)
            ? salaIds.map(Number).filter((value) => Number.isInteger(value) && value > 0)
            : [];

        if (!dataEvento || !salaIdsValidos.length) {
            return res.status(400).json({
                message: "Informe dataEvento e ao menos uma sala.",
            });
        }

        const dateRef = toDate(dataEvento);
        if (!dateRef) {
            return res.status(400).json({
                message: "Data do evento inválida.",
            });
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
        const periodos = getPeriodosFromHorario(horaInicio, horaFim);

        const conflitos = [];

        const ensalamentos = await prisma.ensalamentoItem.findMany({
            where: {
                ativo: true,
                salaId: { in: salaIdsValidos },
                diaSemana,
                periodo: { in: periodos },
            },
            include: {
                sala: true,
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
                salaId: item.salaId,
                salaNome: item?.sala?.nome || `Sala ${item.salaId}`,
                periodo: item.periodo,
                titulo: item?.turma?.nome || item?.textoLivre || "Uso definido",
                detalhe: item?.turma?.curso?.nome || item?.observacoes || null,
            });
        });

        const ofertas = await prisma.ofertaAcademica.findMany({
            where: {
                ativo: true,
                id: ofertaIdIgnorar ? { not: Number(ofertaIdIgnorar) } : undefined,
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
                        salaId: { in: salaIdsValidos },
                    },
                },
            },
            include: {
                espacos: {
                    include: {
                        sala: true,
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

        ofertas.forEach((oferta) => {
            const periodosOfertaExistente = getPeriodosFromHorario(
                oferta.horaInicio,
                oferta.horaFim
            );

            const intersecao = periodosOfertaExistente.filter((periodo) =>
                periodos.includes(periodo)
            );

            if (!intersecao.length) return;

            (oferta.espacos || []).forEach((espaco) => {
                if (!espaco.salaId || !salaIdsValidos.includes(espaco.salaId)) return;

                intersecao.forEach((periodo) => {
                    conflitos.push({
                        tipo: "OFERTA",
                        salaId: espaco.salaId,
                        salaNome: espaco?.sala?.nome || `Sala ${espaco.salaId}`,
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

        return res.status(200).json({
            disponivel: conflitos.length === 0,
            diaSemana,
            periodos,
            conflitos,
        });
    } catch (error) {
        next(error);
    }
}