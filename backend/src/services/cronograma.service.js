import prisma from "../prisma/client.js";

function formatDateKey(dateInput) {
    const date = parseLocalDate(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function parseLocalDate(dateInput) {
    if (!dateInput) return null;

    if (dateInput instanceof Date) {
        return new Date(
            dateInput.getFullYear(),
            dateInput.getMonth(),
            dateInput.getDate()
        );
    }

    if (typeof dateInput === "string") {
        const onlyDateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (onlyDateMatch) {
            const [, year, month, day] = onlyDateMatch;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }
    }

    const parsed = new Date(dateInput);

    return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
    );
}

function getStartOfDay(dateInput) {
    return parseLocalDate(dateInput);
}

function parseJsonArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [];
}

function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function isSameOrBetween(date, start, end) {
    const current = parseLocalDate(date);
    const startDate = parseLocalDate(start);
    const endDate = parseLocalDate(end);
    return current >= startDate && current <= endDate;
}

function getWeekday(date) {
    return date.getDay();
}

function mapDiaToWeekdayNumber(dia) {
    const mapa = {
        domingo: 0,
        segunda: 1,
        terca: 2,
        terça: 2,
        quarta: 3,
        quinta: 4,
        sexta: 5,
        sabado: 6,
        sábado: 6,
    };

    return mapa[String(dia).toLowerCase()];
}

async function getRecessosForTurma(turma) {
    return prisma.recesso.findMany({
        where: {
            ativo: true,
            OR: [{ aplicaTodosCursos: true }, { cursoId: turma.cursoId }],
        },
    });
}

function isDataPulada(date, datasPuladas) {
    const dateKey = formatDateKey(date);
    return datasPuladas.includes(dateKey);
}

function isRecesso(date, recessos) {
    return recessos.some((recesso) =>
        isSameOrBetween(date, recesso.dataInicio, recesso.dataFim)
    );
}

function getTurmaDisciplinaEffectiveInstrutorId(turmaDisciplina) {
    return turmaDisciplina.instrutorPadraoId || null;
}

async function carregarTurmaCompleta(turmaId) {
    return prisma.turma.findUnique({
        where: { id: Number(turmaId) },
        include: {
            disciplinas: {
                where: { ativo: true },
                include: {
                    disciplina: true,
                    instrutorPadrao: true,
                },
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            },
        },
    });
}

function validarTurmaParaGeracao(turma) {
    if (!turma) {
        throw new Error("Turma não encontrada.");
    }

    if (!turma.dataInicio) {
        throw new Error("A turma precisa ter data de início configurada.");
    }

    const diasAulaRaw = parseJsonArray(turma.diasAula);
    if (!diasAulaRaw.length) {
        throw new Error("A turma precisa ter ao menos um dia de aula configurado.");
    }

    const weekdays = diasAulaRaw
        .map(mapDiaToWeekdayNumber)
        .filter((value) => value !== undefined);

    if (!weekdays.length) {
        throw new Error("Os dias de aula da turma são inválidos.");
    }

    return weekdays;
}

function getHorarioDaAulaParaData(turma, date) {
    const weekday = getWeekday(parseLocalDate(date));
    const isSabado = weekday === 6;

    if (isSabado) {
        return {
            horarioInicio: turma.horarioSabadoInicio || null,
            horarioFim: turma.horarioSabadoFim || null,
            observacaoHorario: turma.sabadoIntegral
                ? "Sábado integral: 08h às 12h e 13h às 17h"
                : null,
        };
    }

    return {
        horarioInicio: turma.horarioSemanaInicio || null,
        horarioFim: turma.horarioSemanaFim || null,
        observacaoHorario: null,
    };
}

function mergeObservacoes(observacaoAtual, observacaoHorario) {
    if (observacaoAtual && observacaoHorario) {
        return `${observacaoAtual} | ${observacaoHorario}`;
    }

    return observacaoAtual || observacaoHorario || null;
}

async function montarAulasPlanejadas({
    turma,
    dataInicialCursor,
    numeroEncontroGeralInicial,
    turmaDisciplinas,
    pontoInicialPorDisciplina = {},
}) {
    const weekdays = validarTurmaParaGeracao(turma);
    const datasPuladas = parseJsonArray(turma.datasPuladas);
    const recessos = await getRecessosForTurma(turma);

    const aulasParaCriar = [];
    let dataCursor = parseLocalDate(dataInicialCursor);
    let numeroEncontroGeral = numeroEncontroGeralInicial;

    for (const turmaDisciplina of turmaDisciplinas) {
        const inicioDisciplina =
            pontoInicialPorDisciplina[turmaDisciplina.id]?.numeroEncontroDisciplinaInicial || 1;

        for (
            let numeroEncontroDisciplina = inicioDisciplina;
            numeroEncontroDisciplina <= turmaDisciplina.quantidadeEncontros;
            numeroEncontroDisciplina++
        ) {
            while (true) {
                const weekday = getWeekday(dataCursor);
                const diaValido = weekdays.includes(weekday);
                const pulada = isDataPulada(dataCursor, datasPuladas);
                const emRecesso = isRecesso(dataCursor, recessos);

                if (diaValido && !pulada && !emRecesso) {
                    break;
                }

                dataCursor = addDays(dataCursor, 1);
            }

            const isAvaliacaoFinal =
                numeroEncontroDisciplina === turmaDisciplina.quantidadeEncontros;

            const horarioDaAula = getHorarioDaAulaParaData(turma, dataCursor);

            aulasParaCriar.push({
                turmaId: turma.id,
                turmaDisciplinaId: turmaDisciplina.id,
                data: parseLocalDate(dataCursor),
                numeroEncontroGeral,
                numeroEncontroDisciplina,
                tipoAula: isAvaliacaoFinal ? "Avaliação Final" : "Sala de Aula",
                observacoes: mergeObservacoes(null, horarioDaAula.observacaoHorario),
                status: "planejada",
                instrutorId: getTurmaDisciplinaEffectiveInstrutorId(turmaDisciplina),
                ativo: true,
                horarioInicio: horarioDaAula.horarioInicio,
                horarioFim: horarioDaAula.horarioFim,
            });

            numeroEncontroGeral++;
            dataCursor = addDays(dataCursor, 1);
        }
    }

    return aulasParaCriar;
}

export async function gerarCronogramaDaTurma(turmaId) {
    const turma = await carregarTurmaCompleta(turmaId);
    validarTurmaParaGeracao(turma);

    await prisma.reserva.deleteMany({
        where: {
            cronogramaAula: {
                turmaId: turma.id,
                status: "planejada",
            },
        },
    });

    await prisma.cronogramaAula.deleteMany({
        where: {
            turmaId: turma.id,
            status: "planejada",
        },
    });

    const aulasParaCriar = await montarAulasPlanejadas({
        turma,
        dataInicialCursor: turma.dataInicio,
        numeroEncontroGeralInicial: 1,
        turmaDisciplinas: turma.disciplinas,
    });

    if (aulasParaCriar.length) {
        await prisma.cronogramaAula.createMany({
            data: aulasParaCriar,
        });
    }

    return prisma.cronogramaAula.findMany({
        where: { turmaId: turma.id },
        include: {
            turma: true,
            instrutor: true,
            turmaDisciplina: {
                include: {
                    disciplina: true,
                    instrutorPadrao: true,
                },
            },
            reservas: true,
        },
        orderBy: [{ data: "asc" }, { numeroEncontroGeral: "asc" }],
    });
}

export async function regenerarCronogramaDaTurma({ turmaId, dataCorte }) {
    const turma = await carregarTurmaCompleta(turmaId);
    validarTurmaParaGeracao(turma);

    const dataCorteObj = getStartOfDay(dataCorte);

    const aulasExistentes = await prisma.cronogramaAula.findMany({
        where: {
            turmaId: turma.id,
            ativo: true,
        },
        include: {
            reservas: {
                where: {
                    status: "ativa",
                },
            },
        },
        orderBy: [{ data: "asc" }, { numeroEncontroGeral: "asc" }],
    });

    const aulasAntesDoCorte = aulasExistentes.filter(
        (aula) => parseLocalDate(aula.data) < dataCorteObj
    );

    const aulasProtegidasNoCorteOuDepois = aulasExistentes.filter((aula) => {
        const dataAula = getStartOfDay(aula.data);
        const temReservaAtiva = aula.reservas?.length > 0;
        const statusProtegido = aula.status !== "planejada";

        return dataAula >= dataCorteObj && (temReservaAtiva || statusProtegido);
    });

    const aulasPlanejadasRemoviveis = aulasExistentes.filter((aula) => {
        const dataAula = getStartOfDay(aula.data);
        const temReservaAtiva = aula.reservas?.length > 0;
        const statusProtegido = aula.status !== "planejada";

        return (
            dataAula >= dataCorteObj &&
            !temReservaAtiva &&
            !statusProtegido
        );
    });

    const idsRemoviveis = aulasPlanejadasRemoviveis.map((aula) => aula.id);

    if (idsRemoviveis.length) {
        await prisma.reserva.deleteMany({
            where: {
                cronogramaAulaId: {
                    in: idsRemoviveis,
                },
            },
        });

        await prisma.cronogramaAula.deleteMany({
            where: {
                id: {
                    in: idsRemoviveis,
                },
            },
        });
    }

    const aulasPreservadas = [...aulasAntesDoCorte, ...aulasProtegidasNoCorteOuDepois].sort(
        (a, b) => {
            const dateCompare = new Date(a.data) - new Date(b.data);
            if (dateCompare !== 0) return dateCompare;
            return a.numeroEncontroGeral - b.numeroEncontroGeral;
        }
    );

    const ultimoNumeroEncontroGeral = aulasPreservadas.length
        ? Math.max(...aulasPreservadas.map((aula) => aula.numeroEncontroGeral))
        : 0;

    const pontoInicialPorDisciplina = {};

    for (const turmaDisciplina of turma.disciplinas) {
        const aulasDaDisciplinaPreservadas = aulasPreservadas.filter(
            (aula) => aula.turmaDisciplinaId === turmaDisciplina.id
        );

        const ultimoNumeroDisciplina = aulasDaDisciplinaPreservadas.length
            ? Math.max(...aulasDaDisciplinaPreservadas.map((aula) => aula.numeroEncontroDisciplina))
            : 0;

        pontoInicialPorDisciplina[turmaDisciplina.id] = {
            numeroEncontroDisciplinaInicial: ultimoNumeroDisciplina + 1,
        };
    }

    const dataInicialCursor =
        aulasPreservadas.length > 0
            ? addDays(
                parseLocalDate(
                    new Date(
                        Math.max(
                            ...aulasPreservadas.map((aula) =>
                                parseLocalDate(aula.data).getTime()
                            )
                        )
                    )
                ),
                1
            )
            : parseLocalDate(turma.dataInicio);

    const turmaDisciplinasRestantes = turma.disciplinas.filter((td) => {
        const inicio = pontoInicialPorDisciplina[td.id]?.numeroEncontroDisciplinaInicial || 1;
        return inicio <= td.quantidadeEncontros;
    });

    const aulasParaCriar = await montarAulasPlanejadas({
        turma,
        dataInicialCursor,
        numeroEncontroGeralInicial: ultimoNumeroEncontroGeral + 1,
        turmaDisciplinas: turmaDisciplinasRestantes,
        pontoInicialPorDisciplina,
    });

    if (aulasParaCriar.length) {
        await prisma.cronogramaAula.createMany({
            data: aulasParaCriar,
        });
    }

    return prisma.cronogramaAula.findMany({
        where: {
            turmaId: turma.id,
            ativo: true,
        },
        include: {
            turma: true,
            instrutor: true,
            turmaDisciplina: {
                include: {
                    disciplina: true,
                    instrutorPadrao: true,
                },
            },
            reservas: true,
        },
        orderBy: [{ data: "asc" }, { numeroEncontroGeral: "asc" }],
    });
}