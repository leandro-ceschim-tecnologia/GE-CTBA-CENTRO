import prisma from "../prisma/client.js";

const STATUS_OCORRENCIA_ABERTA = new Set([
    "PENDENTE_CONTATO",
    "EM_TRATATIVA",
    "TRATADO",
]);

const STATUS_OCORRENCIA_ATIVA = new Set([
    "PENDENTE_CONTATO",
    "EM_TRATATIVA",
    "TRATADO",
    "LANCADO_SISTEMA",
]);

const TIPOS_CONTATO_VALIDOS = new Set([
    "LIGACAO",
    "WHATSAPP",
    "PRESENCIAL",
    "OUTRO",
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
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getCursoTipoByNome(cursoNome) {
    const nome = String(cursoNome || "").trim().toLowerCase();

    if (!nome) return "TECNICO";

    if (nome.includes("técnico") || nome.includes("tecnico")) {
        return "TECNICO";
    }

    return "PROFISSIONALIZANTE";
}

function getRegrasEvasaoPorCurso(cursoNome) {
    const tipo = getCursoTipoByNome(cursoNome);

    if (tipo === "TECNICO") {
        return {
            tipoCurso: tipo,
            gerarNaPrimeiraFalta: false,
            gerarContatoACadaDuasFaltas: true,
            faltasContatoTecnico: 2,
        };
    }

    return {
        tipoCurso: tipo,
        gerarNaPrimeiraFalta: true,
        gerarContatoACadaDuasFaltas: false,
        faltasContatoTecnico: null,
    };
}

function buildDescricaoRegra({ regraTipo, qtdFaltas, cursoNome }) {
    if (regraTipo === "FALTA_INDIVIDUAL") {
        return `Curso profissionalizante: ocorrência gerada por 1 falta na disciplina (${cursoNome || "curso não informado"}).`;
    }

    if (regraTipo === "DUAS_FALTAS_CONSECUTIVAS") {
        return `Curso técnico: contato operacional gerado ao atingir ${qtdFaltas} faltas consecutivas (${cursoNome || "curso não informado"}).`;
    }

    if (regraTipo === "EVASAO_12_FALTAS") {
        return `Aluno com ${qtdFaltas} faltas acumuladas, exigindo acompanhamento de evasão efetiva.`;
    }

    return "Ocorrência gerada automaticamente pelo sistema.";
}

async function findOcorrenciaExistenteSemelhante(
    tx,
    {
        alunoId,
        turmaDisciplinaId,
        regraTipo,
        qtdFaltas,
        frequenciaAlunoId,
        dataReferencia,
    }
) {
    if (regraTipo === "FALTA_INDIVIDUAL") {
        return tx.evasaoOcorrencia.findFirst({
            where: {
                alunoId,
                turmaDisciplinaId: turmaDisciplinaId || null,
                regraTipo,
                frequenciaAlunoId: frequenciaAlunoId || null,
            },
        });
    }

    if (regraTipo === "DUAS_FALTAS_CONSECUTIVAS") {
        return tx.evasaoOcorrencia.findFirst({
            where: {
                alunoId,
                turmaDisciplinaId: turmaDisciplinaId || null,
                regraTipo,
                frequenciaAlunoId: frequenciaAlunoId || null,
                dataReferencia: dataReferencia || null,
            },
        });
    }

    if (regraTipo === "EVASAO_12_FALTAS") {
        return tx.evasaoOcorrencia.findFirst({
            where: {
                alunoId,
                regraTipo,
            },
        });
    }

    return null;
}

async function criarOcorrenciaSeNecessario(tx, payload) {
    const existente = await findOcorrenciaExistenteSemelhante(tx, {
        alunoId: payload.alunoId,
        turmaDisciplinaId: payload.turmaDisciplinaId,
        regraTipo: payload.regraTipo,
        qtdFaltas: payload.qtdFaltas,
        frequenciaAlunoId: payload.frequenciaAlunoId,
        dataReferencia: payload.dataReferencia,
    });

    if (existente) {
        return {
            created: false,
            ocorrencia: existente,
        };
    }

    const ocorrencia = await tx.evasaoOcorrencia.create({
        data: payload,
        include: {
            aluno: {
                select: {
                    id: true,
                    nome: true,
                    matricula: true,
                    email: true,
                },
            },
            curso: true,
            turma: true,
            turmaDisciplina: {
                include: {
                    disciplina: true,
                },
            },
        },
    });

    return {
        created: true,
        ocorrencia,
    };
}

function calcularMaiorSequenciaEFim(frequencias) {
    let maiorSequencia = 0;
    let sequenciaAtual = 0;
    let dataFimSequenciaAtual = null;

    for (const item of frequencias) {
        if (item.status === "FALTA") {
            sequenciaAtual += 1;
            dataFimSequenciaAtual = parseDateOnly(item.cronogramaAula.data);

            if (sequenciaAtual > maiorSequencia) {
                maiorSequencia = sequenciaAtual;
            }
        } else if (
            item.status === "PRESENTE" ||
            item.status === "FALTA_JUSTIFICADA"
        ) {
            sequenciaAtual = 0;
            dataFimSequenciaAtual = null;
        }
    }

    return {
        maiorSequencia,
        sequenciaAtual,
        dataFimSequenciaAtual,
    };
}

async function carregarFrequenciasDoAluno(alunoId) {
    return prisma.frequenciaAluno.findMany({
        where: {
            alunoId,
            status: {
                in: ["FALTA", "PRESENTE", "FALTA_JUSTIFICADA"],
            },
        },
        include: {
            cronogramaAula: {
                include: {
                    turma: {
                        include: {
                            curso: true,
                        },
                    },
                    turmaDisciplina: {
                        include: {
                            disciplina: true,
                            turma: {
                                include: {
                                    curso: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            { cronogramaAula: { data: "asc" } },
            { cronogramaAula: { numeroEncontroGeral: "asc" } },
        ],
    });
}

function agruparPorTurmaDisciplina(frequencias) {
    const map = new Map();

    for (const item of frequencias) {
        const key = String(item.cronogramaAula.turmaDisciplinaId);
        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(item);
    }

    return Array.from(map.values());
}

async function processarOcorrenciasParaAlunoTx(tx, alunoId, userId = null) {
    const frequencias = await tx.frequenciaAluno.findMany({
        where: {
            alunoId,
            status: {
                in: ["FALTA", "PRESENTE", "FALTA_JUSTIFICADA"],
            },
        },
        include: {
            cronogramaAula: {
                include: {
                    turma: {
                        include: {
                            curso: true,
                        },
                    },
                    turmaDisciplina: {
                        include: {
                            disciplina: true,
                            turma: {
                                include: {
                                    curso: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: [
            { cronogramaAula: { data: "asc" } },
            { cronogramaAula: { numeroEncontroGeral: "asc" } },
        ],
    });

    if (!frequencias.length) {
        return {
            alunoId,
            totalOcorrenciasCriadas: 0,
            ocorrenciasCriadas: [],
            resumo: {
                totalFaltas: 0,
                maiorSequenciaFaltas: 0,
            },
        };
    }

    const ocorrenciasCriadas = [];
    const grupos = agruparPorTurmaDisciplina(frequencias);

    let totalFaltasGeral = 0;
    let maiorSequenciaGeral = 0;

    for (const grupo of grupos) {
        const primeira = grupo[0];
        const cursoNome =
            primeira.cronogramaAula?.turma?.curso?.nome ||
            primeira.cronogramaAula?.turmaDisciplina?.turma?.curso?.nome ||
            "";

        const regras = getRegrasEvasaoPorCurso(cursoNome);

        let sequenciaAtual = 0;
        let faltasAcumuladasNoGrupo = 0;

        for (const item of grupo) {
            if (item.status === "FALTA") {
                totalFaltasGeral += 1;
                faltasAcumuladasNoGrupo += 1;
                sequenciaAtual += 1;

                if (sequenciaAtual > maiorSequenciaGeral) {
                    maiorSequenciaGeral = sequenciaAtual;
                }

                if (regras.gerarNaPrimeiraFalta) {
                    const result = await criarOcorrenciaSeNecessario(tx, {
                        alunoId,
                        cursoId: item.cronogramaAula?.turma?.cursoId || null,
                        turmaId: item.cronogramaAula?.turmaId || null,
                        turmaDisciplinaId:
                            item.cronogramaAula?.turmaDisciplinaId || null,
                        frequenciaAlunoId: item.id,
                        regraTipo: "FALTA_INDIVIDUAL",
                        qtdFaltas: 1,
                        dataReferencia: parseDateOnly(item.cronogramaAula.data),
                        descricaoRegra: buildDescricaoRegra({
                            regraTipo: "FALTA_INDIVIDUAL",
                            qtdFaltas: 1,
                            cursoNome,
                        }),
                        status: "PENDENTE_CONTATO",
                        ativo: true,
                        criadoPorId: userId,
                        atualizadoPorId: userId,
                    });

                    if (result.created) {
                        ocorrenciasCriadas.push(result.ocorrencia);
                    }
                } else if (
                    regras.gerarContatoACadaDuasFaltas &&
                    sequenciaAtual === regras.faltasContatoTecnico
                ) {
                    const result = await criarOcorrenciaSeNecessario(tx, {
                        alunoId,
                        cursoId: item.cronogramaAula?.turma?.cursoId || null,
                        turmaId: item.cronogramaAula?.turmaId || null,
                        turmaDisciplinaId:
                            item.cronogramaAula?.turmaDisciplinaId || null,
                        frequenciaAlunoId: item.id,
                        regraTipo: "DUAS_FALTAS_CONSECUTIVAS",
                        qtdFaltas: sequenciaAtual,
                        dataReferencia: parseDateOnly(item.cronogramaAula.data),
                        descricaoRegra: buildDescricaoRegra({
                            regraTipo: "DUAS_FALTAS_CONSECUTIVAS",
                            qtdFaltas: sequenciaAtual,
                            cursoNome,
                        }),
                        status: "PENDENTE_CONTATO",
                        ativo: true,
                        criadoPorId: userId,
                        atualizadoPorId: userId,
                    });

                    if (result.created) {
                        ocorrenciasCriadas.push(result.ocorrencia);
                    }
                }
            } else if (
                item.status === "PRESENTE" ||
                item.status === "FALTA_JUSTIFICADA"
            ) {
                sequenciaAtual = 0;
            }
        }
    }

    if (totalFaltasGeral >= 12) {
        const ultimaFaltaGlobal = [...frequencias]
            .filter((item) => item.status === "FALTA")
            .at(-1);

        if (ultimaFaltaGlobal) {
            const cursoNome =
                ultimaFaltaGlobal.cronogramaAula?.turma?.curso?.nome || "";

            const result = await criarOcorrenciaSeNecessario(tx, {
                alunoId,
                cursoId: ultimaFaltaGlobal.cronogramaAula?.turma?.cursoId || null,
                turmaId: ultimaFaltaGlobal.cronogramaAula?.turmaId || null,
                turmaDisciplinaId:
                    ultimaFaltaGlobal.cronogramaAula?.turmaDisciplinaId || null,
                frequenciaAlunoId: ultimaFaltaGlobal.id,
                regraTipo: "EVASAO_12_FALTAS",
                qtdFaltas: totalFaltasGeral,
                dataReferencia: parseDateOnly(ultimaFaltaGlobal.cronogramaAula.data),
                descricaoRegra: buildDescricaoRegra({
                    regraTipo: "EVASAO_12_FALTAS",
                    qtdFaltas: totalFaltasGeral,
                    cursoNome,
                }),
                status: "PENDENTE_CONTATO",
                ativo: true,
                criadoPorId: userId,
                atualizadoPorId: userId,
            });

            if (result.created) {
                ocorrenciasCriadas.push(result.ocorrencia);
            }
        }
    }

    return {
        alunoId,
        totalOcorrenciasCriadas: ocorrenciasCriadas.length,
        ocorrenciasCriadas,
        resumo: {
            totalFaltas: totalFaltasGeral,
            maiorSequenciaFaltas: maiorSequenciaGeral,
        },
    };
}

export async function processarEvasaoPorAluno(alunoId, userId = null) {
    const alunoIdNum = normalizeId(alunoId);
    const userIdNum = userId ? normalizeId(userId) : null;

    if (!alunoIdNum) {
        throw new Error("Aluno inválido.");
    }

    const aluno = await prisma.user.findUnique({
        where: { id: alunoIdNum },
        select: {
            id: true,
            nome: true,
            matricula: true,
            email: true,
            role: true,
            ativo: true,
        },
    });

    if (!aluno || !aluno.ativo || aluno.role !== "aluno") {
        throw new Error("Aluno não encontrado.");
    }

    const resultado = await prisma.$transaction((tx) =>
        processarOcorrenciasParaAlunoTx(tx, alunoIdNum, userIdNum)
    );

    return {
        message: "Processamento de evasão concluído com sucesso.",
        aluno,
        ...resultado,
    };
}

export async function processarEvasaoPorAula(cronogramaAulaId, userId = null) {
    const cronogramaAulaIdNum = normalizeId(cronogramaAulaId);
    const userIdNum = userId ? normalizeId(userId) : null;

    if (!cronogramaAulaIdNum) {
        throw new Error("Aula inválida.");
    }

    const aula = await prisma.cronogramaAula.findUnique({
        where: { id: cronogramaAulaIdNum },
        include: {
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

    if (!aula) {
        throw new Error("Aula não encontrada.");
    }

    const frequencias = await prisma.frequenciaAluno.findMany({
        where: {
            cronogramaAulaId: cronogramaAulaIdNum,
            status: "FALTA",
        },
        select: {
            alunoId: true,
        },
    });

    const alunoIds = Array.from(new Set(frequencias.map((item) => item.alunoId)));

    const resultados = [];
    for (const alunoId of alunoIds) {
        const result = await prisma.$transaction((tx) =>
            processarOcorrenciasParaAlunoTx(tx, alunoId, userIdNum)
        );
        resultados.push(result);
    }

    return {
        message: "Processamento de evasão por aula concluído com sucesso.",
        aula: {
            id: aula.id,
            data: aula.data,
            turma: aula.turma,
            disciplina: aula.turmaDisciplina?.disciplina || null,
        },
        totalAlunosProcessados: alunoIds.length,
        resultados,
    };
}

export async function listarOcorrenciasEvasao({
    status,
    regraTipo,
    cursoId,
    turmaId,
    disciplinaId,
    alunoId,
    somenteAtivas = false,
}) {
    const where = {};

    if (status) {
        where.status = String(status).trim().toUpperCase();
    }

    if (regraTipo) {
        where.regraTipo = String(regraTipo).trim().toUpperCase();
    }

    if (somenteAtivas) {
        where.ativo = true;
        where.status = {
            in: Array.from(STATUS_OCORRENCIA_ATIVA),
        };
    }

    const cursoIdNum = normalizeId(cursoId);
    const turmaIdNum = normalizeId(turmaId);
    const disciplinaIdNum = normalizeId(disciplinaId);
    const alunoIdNum = normalizeId(alunoId);

    if (cursoIdNum) where.cursoId = cursoIdNum;
    if (turmaIdNum) where.turmaId = turmaIdNum;
    if (disciplinaIdNum) where.turmaDisciplinaId = disciplinaIdNum;
    if (alunoIdNum) where.alunoId = alunoIdNum;

    return prisma.evasaoOcorrencia.findMany({
        where,
        include: {
            aluno: {
                select: {
                    id: true,
                    nome: true,
                    email: true,
                    matricula: true,
                },
            },
            curso: true,
            turma: true,
            turmaDisciplina: {
                include: {
                    disciplina: true,
                },
            },
            frequenciaAluno: {
                include: {
                    cronogramaAula: true,
                },
            },
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
        },
        orderBy: [
            { dataReferencia: "desc" },
            { createdAt: "desc" },
        ],
    });
}

export async function registrarTratativaEvasao({
    ocorrenciaId,
    responsavelId,
    tipoContato = "LIGACAO",
    descricao,
    retornoAluno = null,
    observacoes = null,
}) {
    const ocorrenciaIdNum = normalizeId(ocorrenciaId);
    const responsavelIdNum = normalizeId(responsavelId);
    const tipoContatoNormalizado = String(tipoContato || "LIGACAO")
        .trim()
        .toUpperCase();

    if (!ocorrenciaIdNum) {
        throw new Error("Ocorrência inválida.");
    }

    if (!responsavelIdNum) {
        throw new Error("Responsável inválido.");
    }

    if (!descricao || !String(descricao).trim()) {
        throw new Error("Descrição da tratativa obrigatória.");
    }

    if (!TIPOS_CONTATO_VALIDOS.has(tipoContatoNormalizado)) {
        throw new Error("Tipo de contato inválido.");
    }

    const [ocorrencia, responsavel] = await Promise.all([
        prisma.evasaoOcorrencia.findUnique({
            where: { id: ocorrenciaIdNum },
        }),
        prisma.user.findUnique({
            where: { id: responsavelIdNum },
            select: {
                id: true,
                nome: true,
                email: true,
                ativo: true,
            },
        }),
    ]);

    if (!ocorrencia) {
        throw new Error("Ocorrência não encontrada.");
    }

    if (!responsavel || !responsavel.ativo) {
        throw new Error("Responsável não encontrado ou inativo.");
    }

    return prisma.$transaction(async (tx) => {
        const tratativa = await tx.evasaoTratativa.create({
            data: {
                evasaoOcorrenciaId: ocorrenciaIdNum,
                responsavelId: responsavelIdNum,
                tipoContato: tipoContatoNormalizado,
                descricao: String(descricao).trim(),
                retornoAluno: retornoAluno?.trim() || null,
                observacoes: observacoes?.trim() || null,
                dataContato: new Date(),
            },
            include: {
                responsavel: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                    },
                },
            },
        });

        const novaOcorrencia = await tx.evasaoOcorrencia.update({
            where: { id: ocorrenciaIdNum },
            data: {
                status: "TRATADO",
                atualizadoPorId: responsavelIdNum,
                updatedAt: new Date(),
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        matricula: true,
                        email: true,
                    },
                },
                curso: true,
                turma: true,
                turmaDisciplina: {
                    include: {
                        disciplina: true,
                    },
                },
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
            },
        });

        return {
            message: "Tratativa registrada com sucesso.",
            tratativa,
            ocorrencia: novaOcorrencia,
        };
    });
}

export async function marcarOcorrenciaComoLancadaSistema({
    ocorrenciaId,
    responsavelId,
    observacoes = null,
}) {
    const ocorrenciaIdNum = normalizeId(ocorrenciaId);
    const responsavelIdNum = normalizeId(responsavelId);

    if (!ocorrenciaIdNum) {
        throw new Error("Ocorrência inválida.");
    }

    if (!responsavelIdNum) {
        throw new Error("Responsável inválido.");
    }

    const ocorrencia = await prisma.evasaoOcorrencia.findUnique({
        where: { id: ocorrenciaIdNum },
        include: {
            tratativas: {
                orderBy: [{ dataContato: "desc" }],
            },
        },
    });

    if (!ocorrencia) {
        throw new Error("Ocorrência não encontrada.");
    }

    return prisma.$transaction(async (tx) => {
        if (ocorrencia.tratativas.length) {
            const ultimaTratativa = ocorrencia.tratativas[0];

            await tx.evasaoTratativa.update({
                where: { id: ultimaTratativa.id },
                data: {
                    lancadoSistemaInterno: true,
                    dataLancamentoSistema: new Date(),
                    observacoes:
                        observacoes?.trim() ||
                        ultimaTratativa.observacoes ||
                        null,
                },
            });
        } else {
            await tx.evasaoTratativa.create({
                data: {
                    evasaoOcorrenciaId: ocorrenciaIdNum,
                    responsavelId: responsavelIdNum,
                    tipoContato: "OUTRO",
                    descricao: "Lançamento confirmado no sistema interno.",
                    observacoes: observacoes?.trim() || null,
                    lancadoSistemaInterno: true,
                    dataLancamentoSistema: new Date(),
                },
            });
        }

        const novaOcorrencia = await tx.evasaoOcorrencia.update({
            where: { id: ocorrenciaIdNum },
            data: {
                status: "LANCADO_SISTEMA",
                atualizadoPorId: responsavelIdNum,
                updatedAt: new Date(),
            },
            include: {
                aluno: {
                    select: {
                        id: true,
                        nome: true,
                        matricula: true,
                        email: true,
                    },
                },
                curso: true,
                turma: true,
                turmaDisciplina: {
                    include: {
                        disciplina: true,
                    },
                },
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
            },
        });

        return {
            message: "Ocorrência marcada como lançada no sistema interno com sucesso.",
            ocorrencia: novaOcorrencia,
        };
    });
}

export async function finalizarOcorrenciaEvasao({
    ocorrenciaId,
    responsavelId,
}) {
    const ocorrenciaIdNum = normalizeId(ocorrenciaId);
    const responsavelIdNum = normalizeId(responsavelId);

    if (!ocorrenciaIdNum) {
        throw new Error("Ocorrência inválida.");
    }

    if (!responsavelIdNum) {
        throw new Error("Responsável inválido.");
    }

    const ocorrencia = await prisma.evasaoOcorrencia.findUnique({
        where: { id: ocorrenciaIdNum },
    });

    if (!ocorrencia) {
        throw new Error("Ocorrência não encontrada.");
    }

    const updated = await prisma.evasaoOcorrencia.update({
        where: { id: ocorrenciaIdNum },
        data: {
            status: "FINALIZADO",
            ativo: false,
            atualizadoPorId: responsavelIdNum,
            updatedAt: new Date(),
        },
        include: {
            aluno: {
                select: {
                    id: true,
                    nome: true,
                    matricula: true,
                    email: true,
                },
            },
            curso: true,
            turma: true,
            turmaDisciplina: {
                include: {
                    disciplina: true,
                },
            },
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
        },
    });

    return {
        message: "Ocorrência finalizada com sucesso.",
        ocorrencia: updated,
    };
}

export async function cancelarOcorrenciaEvasao({
    ocorrenciaId,
    responsavelId,
}) {
    const ocorrenciaIdNum = normalizeId(ocorrenciaId);
    const responsavelIdNum = normalizeId(responsavelId);

    if (!ocorrenciaIdNum) {
        throw new Error("Ocorrência inválida.");
    }

    if (!responsavelIdNum) {
        throw new Error("Responsável inválido.");
    }

    const ocorrencia = await prisma.evasaoOcorrencia.findUnique({
        where: { id: ocorrenciaIdNum },
    });

    if (!ocorrencia) {
        throw new Error("Ocorrência não encontrada.");
    }

    const updated = await prisma.evasaoOcorrencia.update({
        where: { id: ocorrenciaIdNum },
        data: {
            status: "CANCELADO",
            ativo: false,
            atualizadoPorId: responsavelIdNum,
            updatedAt: new Date(),
        },
        include: {
            aluno: {
                select: {
                    id: true,
                    nome: true,
                    matricula: true,
                    email: true,
                },
            },
            curso: true,
            turma: true,
            turmaDisciplina: {
                include: {
                    disciplina: true,
                },
            },
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
        },
    });

    return {
        message: "Ocorrência cancelada com sucesso.",
        ocorrencia: updated,
    };
}

export async function getHistoricoEvasaoAluno(alunoId) {
    const alunoIdNum = normalizeId(alunoId);

    if (!alunoIdNum) {
        throw new Error("Aluno inválido.");
    }

    const aluno = await prisma.user.findUnique({
        where: { id: alunoIdNum },
        select: {
            id: true,
            nome: true,
            email: true,
            matricula: true,
            ativo: true,
            role: true,
        },
    });

    if (!aluno || !aluno.ativo || aluno.role !== "aluno") {
        throw new Error("Aluno não encontrado.");
    }

    const [ocorrencias, frequencias] = await Promise.all([
        prisma.evasaoOcorrencia.findMany({
            where: {
                alunoId: alunoIdNum,
            },
            include: {
                curso: true,
                turma: true,
                turmaDisciplina: {
                    include: {
                        disciplina: true,
                    },
                },
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
            },
            orderBy: [{ dataReferencia: "desc" }, { createdAt: "desc" }],
        }),
        carregarFrequenciasDoAluno(alunoIdNum),
    ]);

    const totalFaltas = frequencias.filter((item) => item.status === "FALTA").length;
    const { maiorSequencia, sequenciaAtual } = calcularMaiorSequenciaEFim(frequencias);

    return {
        aluno,
        resumo: {
            totalOcorrencias: ocorrencias.length,
            ocorrenciasAtivas: ocorrencias.filter((item) => item.ativo).length,
            totalFaltas,
            maiorSequenciaFaltas: maiorSequencia,
            sequenciaAtualFaltas: sequenciaAtual,
        },
        ocorrencias,
    };
}