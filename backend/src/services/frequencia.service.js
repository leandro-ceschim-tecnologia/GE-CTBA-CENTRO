import prisma from "../prisma/client.js";
import { processarEvasaoPorAluno } from "./evasao.service.js";

const STATUS_VALIDOS_FREQUENCIA = new Set([
    "NAO_LANCADO",
    "PRESENTE",
    "FALTA",
    "FALTA_JUSTIFICADA",
]);

const ORIGENS_VINCULO_VALIDAS = new Set([
    "BASE",
    "PENDENCIA",
    "REPOSICAO",
    "EXTRA",
]);

function normalizeId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDateOnly(dateInput) {
    if (!dateInput) return null;

    if (dateInput instanceof Date) {
        return new Date(
            dateInput.getFullYear(),
            dateInput.getMonth(),
            dateInput.getDate()
        );
    }

    if (typeof dateInput === "string") {
        const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const [, year, month, day] = match;
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

function formatDateKey(dateInput) {
    const date = parseDateOnly(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getDiaSemanaLabel(dateInput) {
    return parseDateOnly(dateInput).toLocaleDateString("pt-BR", {
        weekday: "short",
    });
}

function sortByNome(a, b) {
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
}

function getStatusWeight(status) {
    if (status === "FALTA") return 3;
    if (status === "FALTA_JUSTIFICADA") return 2;
    if (status === "PRESENTE") return 1;
    return 0;
}

function resolveOrigemPreferencial(origemAtual, novaOrigem) {
    const peso = {
        BASE: 4,
        PENDENCIA: 3,
        REPOSICAO: 2,
        EXTRA: 1,
    };

    if (!origemAtual) return novaOrigem || "BASE";
    if (!novaOrigem) return origemAtual;

    return (peso[novaOrigem] || 0) > (peso[origemAtual] || 0)
        ? novaOrigem
        : origemAtual;
}

async function buscarTurmaDisciplina({ turmaId, disciplinaId }) {
    return prisma.turmaDisciplina.findFirst({
        where: {
            turmaId,
            disciplinaId,
            ativo: true,
        },
        include: {
            turma: {
                include: {
                    curso: true,
                },
            },
            disciplina: true,
            instrutorPadrao: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
}

async function buscarAulasDaDisciplina({ turmaId, turmaDisciplinaId }) {
    return prisma.cronogramaAula.findMany({
        where: {
            turmaId,
            turmaDisciplinaId,
            ativo: true,
        },
        include: {
            turmaDisciplina: {
                include: {
                    disciplina: true,
                },
            },
            instrutor: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: [{ data: "asc" }, { numeroEncontroGeral: "asc" }],
    });
}

function buildResumoRiscoAluno(frequenciasOrdenadas) {
    let faltasConsecutivas = 0;
    let faltasConsecutivasAtual = 0;
    let totalFaltas = 0;

    for (const item of frequenciasOrdenadas) {
        if (item.status === "FALTA") {
            totalFaltas += 1;
            faltasConsecutivasAtual += 1;
            if (faltasConsecutivasAtual > faltasConsecutivas) {
                faltasConsecutivas = faltasConsecutivasAtual;
            }
        } else if (item.status === "PRESENTE" || item.status === "FALTA_JUSTIFICADA") {
            faltasConsecutivasAtual = 0;
        }
    }

    return {
        totalFaltas,
        maiorSequenciaFaltas: faltasConsecutivas,
        sequenciaAtualFaltas: faltasConsecutivasAtual,
    };
}

export async function getFiltrosFrequencia() {
    const [cursos, turmas, disciplinas] = await Promise.all([
        prisma.curso.findMany({
            where: { ativo: true },
            orderBy: { nome: "asc" },
        }),
        prisma.turma.findMany({
            where: { ativo: true },
            include: {
                curso: true,
            },
            orderBy: [{ nome: "asc" }],
        }),
        prisma.disciplina.findMany({
            where: { ativo: true },
            include: {
                curso: true,
            },
            orderBy: [{ nome: "asc" }],
        }),
    ]);

    const turnos = Array.from(
        new Set(
            turmas
                .map((item) => item.turno)
                .filter(Boolean)
                .map((item) => String(item))
        )
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));

    return {
        cursos,
        turnos,
        turmas,
        disciplinas,
    };
}

export async function getGradeFrequencia({
    cursoId,
    turno,
    turmaId,
    disciplinaId,
}) {
    const turmaIdNum = normalizeId(turmaId);
    const disciplinaIdNum = normalizeId(disciplinaId);
    const cursoIdNum = cursoId ? normalizeId(cursoId) : null;

    if (!turmaIdNum) {
        throw new Error("Turma inválida.");
    }

    if (!disciplinaIdNum) {
        throw new Error("Disciplina inválida.");
    }

    const turmaDisciplina = await buscarTurmaDisciplina({
        turmaId: turmaIdNum,
        disciplinaId: disciplinaIdNum,
    });

    if (!turmaDisciplina) {
        throw new Error("Disciplina não encontrada para a turma selecionada.");
    }

    if (cursoIdNum && turmaDisciplina.turma.cursoId !== cursoIdNum) {
        throw new Error("A turma selecionada não pertence ao curso informado.");
    }

    if (turno && String(turmaDisciplina.turma.turno) !== String(turno)) {
        throw new Error("A turma selecionada não pertence ao turno informado.");
    }

    const [aulas, alunosBase, vinculosExtras] = await Promise.all([
        buscarAulasDaDisciplina({
            turmaId: turmaIdNum,
            turmaDisciplinaId: turmaDisciplina.id,
        }),
        prisma.user.findMany({
            where: {
                ativo: true,
                role: "aluno",
                turmaId: turmaIdNum,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                turmaId: true,
            },
            orderBy: [{ nome: "asc" }],
        }),
        prisma.alunoTurmaDisciplina.findMany({
            where: {
                turmaDisciplinaId: turmaDisciplina.id,
                ativo: true,
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        matricula: true,
                        turmaId: true,
                    },
                },
            },
            orderBy: [{ createdAt: "asc" }],
        }),
    ]);

    const aulaIds = aulas.map((aula) => aula.id);

    const frequencias = aulaIds.length
        ? await prisma.frequenciaAluno.findMany({
            where: {
                cronogramaAulaId: {
                    in: aulaIds,
                },
            },
            select: {
                id: true,
                cronogramaAulaId: true,
                alunoId: true,
                alunoTurmaDisciplinaId: true,
                status: true,
                justificativa: true,
                observacoes: true,
                updatedAt: true,
            },
        })
        : [];

    const lancamentos = aulaIds.length
        ? await prisma.frequenciaLancamento.findMany({
            where: {
                cronogramaAulaId: {
                    in: aulaIds,
                },
            },
            select: {
                id: true,
                cronogramaAulaId: true,
                status: true,
                lancadoEm: true,
                fechadoEm: true,
                observacoes: true,
            },
        })
        : [];

    const lancamentosMap = new Map(
        lancamentos.map((item) => [item.cronogramaAulaId, item])
    );

    const frequenciaMap = new Map();
    for (const item of frequencias) {
        frequenciaMap.set(`${item.cronogramaAulaId}:${item.alunoId}`, item);
    }

    const alunosMap = new Map();

    for (const aluno of alunosBase) {
        alunosMap.set(aluno.id, {
            id: aluno.id,
            nome: aluno.nome,
            email: aluno.email,
            matricula: aluno.matricula,
            turmaId: aluno.turmaId,
            origem: "BASE",
            observacoesVinculo: null,
            alunoTurmaDisciplinaId: null,
            turmaBaseId: aluno.turmaId,
        });
    }

    for (const vinculo of vinculosExtras) {
        if (!vinculo.aluno) continue;

        const atual = alunosMap.get(vinculo.aluno.id);

        if (!atual) {
            alunosMap.set(vinculo.aluno.id, {
                id: vinculo.aluno.id,
                nome: vinculo.aluno.nome,
                email: vinculo.aluno.email,
                matricula: vinculo.aluno.matricula,
                turmaId: turmaIdNum,
                origem: vinculo.origem || "EXTRA",
                observacoesVinculo: vinculo.observacoes || null,
                alunoTurmaDisciplinaId: vinculo.id,
                turmaBaseId: vinculo.aluno.turmaId,
            });
            continue;
        }

        atual.origem = resolveOrigemPreferencial(atual.origem, vinculo.origem);
        atual.observacoesVinculo =
            atual.observacoesVinculo || vinculo.observacoes || null;
        atual.alunoTurmaDisciplinaId =
            atual.alunoTurmaDisciplinaId || vinculo.id || null;
    }

    const alunos = Array.from(alunosMap.values()).sort(sortByNome);

    const colunas = aulas.map((aula) => ({
        cronogramaAulaId: aula.id,
        data: aula.data,
        dataKey: formatDateKey(aula.data),
        dataLabel: parseDateOnly(aula.data).toLocaleDateString("pt-BR"),
        diaSemana: getDiaSemanaLabel(aula.data),
        numeroEncontroDisciplina: aula.numeroEncontroDisciplina,
        numeroEncontroGeral: aula.numeroEncontroGeral,
        tipoAula: aula.tipoAula,
        horarioInicio: aula.horarioInicio,
        horarioFim: aula.horarioFim,
        observacoes: aula.observacoes,
        instrutor: aula.instrutor || turmaDisciplina.instrutorPadrao || null,
        lancamento: lancamentosMap.get(aula.id) || null,
    }));

    const linhas = alunos.map((aluno) => {
        const celulas = colunas.map((coluna) => {
            const frequencia = frequenciaMap.get(
                `${coluna.cronogramaAulaId}:${aluno.id}`
            );

            return {
                cronogramaAulaId: coluna.cronogramaAulaId,
                frequenciaAlunoId: frequencia?.id || null,
                status: frequencia?.status || "NAO_LANCADO",
                justificativa: frequencia?.justificativa || "",
                observacoes: frequencia?.observacoes || "",
                updatedAt: frequencia?.updatedAt || null,
                alunoTurmaDisciplinaId:
                    frequencia?.alunoTurmaDisciplinaId ||
                    aluno.alunoTurmaDisciplinaId ||
                    null,
            };
        });

        const resumo = buildResumoRiscoAluno(
            celulas.map((item) => ({ status: item.status }))
        );

        return {
            aluno: {
                id: aluno.id,
                nome: aluno.nome,
                email: aluno.email,
                matricula: aluno.matricula,
                turmaBaseId: aluno.turmaBaseId,
                origem: aluno.origem,
                observacoesVinculo: aluno.observacoesVinculo,
                alunoTurmaDisciplinaId: aluno.alunoTurmaDisciplinaId,
            },
            resumo,
            celulas,
        };
    });

    return {
        turma: turmaDisciplina.turma,
        disciplina: turmaDisciplina.disciplina,
        turmaDisciplina,
        colunas,
        linhas,
    };
}

export async function salvarLancamentoFrequencia({
    cronogramaAulaId,
    alunos,
    userId,
    observacoes = null,
}) {
    const cronogramaAulaIdNum = normalizeId(cronogramaAulaId);
    const userIdNum = userId ? normalizeId(userId) : null;

    if (!cronogramaAulaIdNum) {
        throw new Error("Aula inválida para lançamento de frequência.");
    }

    if (!Array.isArray(alunos) || !alunos.length) {
        throw new Error("Informe ao menos um aluno para lançamento.");
    }

    const aula = await prisma.cronogramaAula.findUnique({
        where: { id: cronogramaAulaIdNum },
        include: {
            turmaDisciplina: {
                include: {
                    disciplina: true,
                    turma: true,
                },
            },
        },
    });

    if (!aula || !aula.ativo) {
        throw new Error("Aula não encontrada.");
    }

    const alunoIds = [];
    const payloadNormalizado = alunos.map((item, index) => {
        const alunoId = normalizeId(item.alunoId);
        const alunoTurmaDisciplinaId = item.alunoTurmaDisciplinaId
            ? normalizeId(item.alunoTurmaDisciplinaId)
            : null;
        const status = String(item.status || "").trim().toUpperCase();

        if (!alunoId) {
            throw new Error(`Aluno inválido no item ${index + 1}.`);
        }

        if (!STATUS_VALIDOS_FREQUENCIA.has(status)) {
            throw new Error(
                `Status de frequência inválido para o aluno ${alunoId}.`
            );
        }

        alunoIds.push(alunoId);

        return {
            alunoId,
            alunoTurmaDisciplinaId,
            status,
            justificativa: item.justificativa?.trim() || null,
            observacoes: item.observacoes?.trim() || null,
        };
    });

    const alunosExistentes = await prisma.user.findMany({
        where: {
            id: { in: alunoIds },
            ativo: true,
            role: "aluno",
        },
        select: {
            id: true,
            turmaId: true,
        },
    });

    if (alunosExistentes.length !== new Set(alunoIds).size) {
        throw new Error("Um ou mais alunos informados são inválidos.");
    }

    const alunosExistentesMap = new Map(
        alunosExistentes.map((item) => [item.id, item])
    );

    const vinculosExistentes = await prisma.alunoTurmaDisciplina.findMany({
        where: {
            turmaDisciplinaId: aula.turmaDisciplinaId,
            alunoId: {
                in: alunoIds,
            },
            ativo: true,
        },
        select: {
            id: true,
            alunoId: true,
            turmaId: true,
            turmaDisciplinaId: true,
        },
    });

    const vinculosPorAlunoMap = new Map(
        vinculosExistentes.map((item) => [item.alunoId, item])
    );

    const resultadoLancamento = await prisma.$transaction(async (tx) => {
        const lancamento = await tx.frequenciaLancamento.upsert({
            where: {
                cronogramaAulaId: cronogramaAulaIdNum,
            },
            update: {
                status: "ABERTO",
                observacoes: observacoes?.trim() || null,
                lancadoPorId: userIdNum || null,
                updatedAt: new Date(),
            },
            create: {
                cronogramaAulaId: cronogramaAulaIdNum,
                status: "ABERTO",
                observacoes: observacoes?.trim() || null,
                lancadoPorId: userIdNum || null,
                lancadoEm: new Date(),
            },
        });

        let totalPresentes = 0;
        let totalFaltas = 0;
        let totalJustificadas = 0;
        let totalNaoLancados = 0;

        for (const item of payloadNormalizado) {
            const alunoInfo = alunosExistentesMap.get(item.alunoId);
            const vinculoExistente = vinculosPorAlunoMap.get(item.alunoId);

            const alunoTurmaDisciplinaId =
                item.alunoTurmaDisciplinaId ||
                vinculoExistente?.id ||
                null;

            if (!alunoTurmaDisciplinaId && alunoInfo?.turmaId !== aula.turmaId) {
                throw new Error(
                    `O aluno ${item.alunoId} não pertence à turma base e não possui vínculo com a disciplina.`
                );
            }

            await tx.frequenciaAluno.upsert({
                where: {
                    frequenciaLancamentoId_alunoId: {
                        frequenciaLancamentoId: lancamento.id,
                        alunoId: item.alunoId,
                    },
                },
                update: {
                    status: item.status,
                    justificativa:
                        item.status === "FALTA_JUSTIFICADA"
                            ? item.justificativa
                            : null,
                    observacoes: item.observacoes,
                    updatedById: userIdNum || null,
                    alunoTurmaDisciplinaId,
                    cronogramaAulaId: cronogramaAulaIdNum,
                },
                create: {
                    frequenciaLancamentoId: lancamento.id,
                    cronogramaAulaId: cronogramaAulaIdNum,
                    alunoId: item.alunoId,
                    alunoTurmaDisciplinaId,
                    status: item.status,
                    justificativa:
                        item.status === "FALTA_JUSTIFICADA"
                            ? item.justificativa
                            : null,
                    observacoes: item.observacoes,
                    updatedById: userIdNum || null,
                },
            });

            if (item.status === "PRESENTE") totalPresentes += 1;
            else if (item.status === "FALTA") totalFaltas += 1;
            else if (item.status === "FALTA_JUSTIFICADA") totalJustificadas += 1;
            else totalNaoLancados += 1;
        }

        const frequenciasSalvas = await tx.frequenciaAluno.findMany({
            where: {
                frequenciaLancamentoId: lancamento.id,
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        matricula: true,
                    },
                },
            },
            orderBy: [{ aluno: { nome: "asc" } }],
        });

        return {
            message: "Frequência salva com sucesso.",
            lancamento: {
                id: lancamento.id,
                cronogramaAulaId: lancamento.cronogramaAulaId,
                status: lancamento.status,
                observacoes: lancamento.observacoes,
                lancadoEm: lancamento.lancadoEm,
            },
            resumo: {
                totalAlunos: payloadNormalizado.length,
                totalPresentes,
                totalFaltas,
                totalJustificadas,
                totalNaoLancados,
            },
            frequencias: frequenciasSalvas,
            alunoIdsProcessados: [...new Set(payloadNormalizado.map((item) => item.alunoId))],
        };
    });

    const resultadosEvasao = [];
    const errosEvasao = [];

    for (const alunoId of resultadoLancamento.alunoIdsProcessados) {
        try {
            const result = await processarEvasaoPorAluno(alunoId, userIdNum);
            resultadosEvasao.push({
                alunoId,
                totalOcorrenciasCriadas: result.totalOcorrenciasCriadas || 0,
                resumo: result.resumo || null,
            });
        } catch (error) {
            errosEvasao.push({
                alunoId,
                erro: error.message || "Erro ao processar evasão.",
            });
        }
    }

    return {
        message:
            errosEvasao.length > 0
                ? "Frequência salva com sucesso, mas houve falhas no processamento automático da evasão."
                : "Frequência salva e evasão processada com sucesso.",
        lancamento: resultadoLancamento.lancamento,
        resumo: resultadoLancamento.resumo,
        frequencias: resultadoLancamento.frequencias,
        evasao: {
            processadaAutomaticamente: true,
            alunosProcessados: resultadoLancamento.alunoIdsProcessados.length,
            resultados: resultadosEvasao,
            erros: errosEvasao,
        },
    };
}

export async function adicionarAlunoNaDisciplina({
    alunoId,
    turmaId,
    turmaDisciplinaId,
    origem = "EXTRA",
    observacoes = null,
}) {
    const alunoIdNum = normalizeId(alunoId);
    const turmaIdNum = normalizeId(turmaId);
    const turmaDisciplinaIdNum = normalizeId(turmaDisciplinaId);
    const origemNormalizada = String(origem || "EXTRA").trim().toUpperCase();

    if (!alunoIdNum) {
        throw new Error("Aluno inválido.");
    }

    if (!turmaIdNum) {
        throw new Error("Turma inválida.");
    }

    if (!turmaDisciplinaIdNum) {
        throw new Error("Disciplina da turma inválida.");
    }

    if (!ORIGENS_VINCULO_VALIDAS.has(origemNormalizada)) {
        throw new Error("Origem do vínculo inválida.");
    }

    const [aluno, turmaDisciplina] = await Promise.all([
        prisma.user.findUnique({
            where: { id: alunoIdNum },
            select: {
                id: true,
                nome: true,
                email: true,
                matricula: true,
                role: true,
                ativo: true,
                turmaId: true,
            },
        }),
        prisma.turmaDisciplina.findUnique({
            where: { id: turmaDisciplinaIdNum },
            include: {
                turma: {
                    include: {
                        curso: true,
                    },
                },
                disciplina: true,
            },
        }),
    ]);

    if (!aluno || !aluno.ativo || aluno.role !== "aluno") {
        throw new Error("Aluno não encontrado ou inativo.");
    }

    if (!turmaDisciplina || !turmaDisciplina.ativo) {
        throw new Error("Turma/disciplina não encontrada.");
    }

    if (turmaDisciplina.turmaId !== turmaIdNum) {
        throw new Error("A disciplina informada não pertence à turma selecionada.");
    }

    const vinculo = await prisma.alunoTurmaDisciplina.upsert({
        where: {
            alunoId_turmaDisciplinaId: {
                alunoId: alunoIdNum,
                turmaDisciplinaId: turmaDisciplinaIdNum,
            },
        },
        update: {
            ativo: true,
            origem: origemNormalizada,
            observacoes: observacoes?.trim() || null,
            turmaId: turmaIdNum,
        },
        create: {
            alunoId: alunoIdNum,
            turmaId: turmaIdNum,
            turmaDisciplinaId: turmaDisciplinaIdNum,
            origem: origemNormalizada,
            observacoes: observacoes?.trim() || null,
            ativo: true,
        },
        include: {
            aluno: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    matricula: true,
                    turmaId: true,
                },
            },
            turma: {
                include: {
                    curso: true,
                },
            },
            turmaDisciplina: {
                include: {
                    disciplina: true,
                },
            },
        },
    });

    return {
        message: "Aluno vinculado à disciplina com sucesso.",
        vinculo,
    };
}

export async function getHistoricoAluno(alunoId) {
    const alunoIdNum = normalizeId(alunoId);

    if (!alunoIdNum) {
        throw new Error("Aluno inválido.");
    }

    const aluno = await prisma.user.findUnique({
        where: { id: alunoIdNum },
        include: {
            turma: {
                include: {
                    curso: true,
                },
            },
            alunoTurmaDisciplinas: {
                where: { ativo: true },
                include: {
                    turma: {
                        include: {
                            curso: true,
                        },
                    },
                    turmaDisciplina: {
                        include: {
                            disciplina: true,
                            turma: true,
                        },
                    },
                },
                orderBy: [{ createdAt: "desc" }],
            },
            frequenciasAluno: {
                include: {
                    cronogramaAula: {
                        include: {
                            turma: true,
                            turmaDisciplina: {
                                include: {
                                    disciplina: true,
                                },
                            },
                        },
                    },
                    frequenciaLancamento: true,
                },
                orderBy: [{ cronogramaAula: { data: "desc" } }],
            },
            evasaoOcorrenciasAluno: {
                include: {
                    tratativas: {
                        include: {
                            responsavel: {
                                select: {
                                    id: true,
                                    nome: true,
                                    email: true,
                                },
                            },
                        },
                        orderBy: [{ dataContato: "desc" }],
                    },
                    turma: true,
                    curso: true,
                    turmaDisciplina: {
                        include: {
                            disciplina: true,
                        },
                    },
                },
                orderBy: [{ createdAt: "desc" }],
            },
        },
    });

    if (!aluno || !aluno.ativo || aluno.role !== "aluno") {
        throw new Error("Aluno não encontrado.");
    }

    const frequenciasOrdenadasAsc = [...aluno.frequenciasAluno]
        .sort((a, b) => parseDateOnly(a.cronogramaAula.data) - parseDateOnly(b.cronogramaAula.data))
        .map((item) => ({
            status: item.status,
        }));

    const resumoRisco = buildResumoRiscoAluno(frequenciasOrdenadasAsc);

    const resumoStatus = aluno.frequenciasAluno.reduce(
        (acc, item) => {
            if (item.status === "PRESENTE") acc.presentes += 1;
            else if (item.status === "FALTA") acc.faltas += 1;
            else if (item.status === "FALTA_JUSTIFICADA") acc.faltasJustificadas += 1;
            else acc.naoLancados += 1;
            return acc;
        },
        {
            presentes: 0,
            faltas: 0,
            faltasJustificadas: 0,
            naoLancados: 0,
        }
    );

    return {
        aluno: {
            id: aluno.id,
            nome: aluno.nome,
            email: aluno.email,
            matricula: aluno.matricula,
            turma: aluno.turma,
        },
        resumo: {
            ...resumoStatus,
            ...resumoRisco,
            totalRegistros: aluno.frequenciasAluno.length,
            totalOcorrenciasEvasao: aluno.evasaoOcorrenciasAluno.length,
        },
        vinculosExtras: aluno.alunoTurmaDisciplinas.map((item) => ({
            id: item.id,
            origem: item.origem,
            observacoes: item.observacoes,
            turma: item.turma,
            turmaDisciplina: item.turmaDisciplina,
        })),
        frequencias: aluno.frequenciasAluno
            .map((item) => ({
                id: item.id,
                status: item.status,
                justificativa: item.justificativa,
                observacoes: item.observacoes,
                updatedAt: item.updatedAt,
                aula: {
                    id: item.cronogramaAula.id,
                    data: item.cronogramaAula.data,
                    dataLabel: parseDateOnly(item.cronogramaAula.data).toLocaleDateString("pt-BR"),
                    horarioInicio: item.cronogramaAula.horarioInicio,
                    horarioFim: item.cronogramaAula.horarioFim,
                    tipoAula: item.cronogramaAula.tipoAula,
                    disciplina:
                        item.cronogramaAula.turmaDisciplina?.disciplina || null,
                    turma: item.cronogramaAula.turma || null,
                },
            }))
            .sort((a, b) => getStatusWeight(b.status) - getStatusWeight(a.status)),
        evasao: aluno.evasaoOcorrenciasAluno,
    };
}