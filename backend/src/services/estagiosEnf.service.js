import prisma from "../prisma/client.js";

const BLOCOS_ENFERMAGEM_CARGA_HORARIA = {
    1: 120,
    2: 60,
    3: 120,
    4: 120,
    5: 60,
    6: 120,
};

function normalizarTexto(valor) {
    if (valor === undefined || valor === null) return "";
    return String(valor).trim();
}

function normalizarInteiro(valor, fallback = 0) {
    const numero = Number(valor);
    return Number.isInteger(numero) ? numero : fallback;
}

function validarNumeroBloco(numeroBloco) {
    const numero = normalizarInteiro(numeroBloco);

    if (!BLOCOS_ENFERMAGEM_CARGA_HORARIA[numero]) {
        throw new Error("Número de bloco inválido. Utilize valores de 1 a 6.");
    }

    return numero;
}

function obterCargaHorariaPorBloco(numeroBloco) {
    return BLOCOS_ENFERMAGEM_CARGA_HORARIA[validarNumeroBloco(numeroBloco)];
}

function normalizarDataObrigatoria(valor, nomeCampo) {
    if (!valor) {
        throw new Error(`${nomeCampo} é obrigatório.`);
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        throw new Error(`${nomeCampo} inválida.`);
    }

    return data;
}

async function validarCursoETurma(cursoId, turmaId) {
    const curso = await prisma.curso.findUnique({
        where: { id: cursoId },
    });

    if (!curso) {
        throw new Error("Curso não encontrado.");
    }

    const turma = await prisma.turma.findUnique({
        where: { id: turmaId },
    });

    if (!turma) {
        throw new Error("Turma não encontrada.");
    }

    if (turma.cursoId !== cursoId) {
        throw new Error("A turma informada não pertence ao curso selecionado.");
    }

    return { curso, turma };
}

async function validarCampoEstagio(campoId) {
    const campo = await prisma.campoEstagio.findUnique({
        where: { id: campoId },
    });

    if (!campo) {
        throw new Error("Campo de estágio não encontrado.");
    }

    return campo;
}

async function validarBloco(blocoId) {
    const bloco = await prisma.estagioBloco.findUnique({
        where: { id: Number(blocoId) },
        include: {
            turma: true,
            curso: true,
            campos: {
                include: {
                    campo: true,
                },
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            },
            grupos: {
                include: {
                    alunos: {
                        include: {
                            aluno: true,
                        },
                        orderBy: {
                            id: "asc",
                        },
                    },
                },
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            },
            rotacoes: {
                include: {
                    grupo: true,
                    campo: true,
                },
                orderBy: [{ ordem: "asc" }, { grupoId: "asc" }],
            },
        },
    });

    if (!bloco) {
        throw new Error("Bloco de estágio não encontrado.");
    }

    return bloco;
}

async function validarGrupo(grupoId) {
    const grupo = await prisma.estagioBlocoGrupo.findUnique({
        where: { id: Number(grupoId) },
        include: {
            bloco: true,
            alunos: {
                include: {
                    aluno: true,
                },
            },
        },
    });

    if (!grupo) {
        throw new Error("Grupo não encontrado.");
    }

    return grupo;
}

async function validarAluno(alunoId) {
    const aluno = await prisma.user.findUnique({
        where: { id: Number(alunoId) },
    });

    if (!aluno) {
        throw new Error("Aluno não encontrado.");
    }

    return aluno;
}

export function listarBlocosPadraoEnfermagem() {
    return Object.entries(BLOCOS_ENFERMAGEM_CARGA_HORARIA).map(([numero, cargaHoraria]) => ({
        numeroBloco: Number(numero),
        cargaHorariaPrevista: cargaHoraria,
    }));
}

export async function createCampo(payload) {
    const nome = normalizarTexto(payload?.nome);
    const tipo = normalizarTexto(payload?.tipo) || null;
    const endereco = normalizarTexto(payload?.endereco) || null;
    const cidade = normalizarTexto(payload?.cidade) || null;
    const observacoes = normalizarTexto(payload?.observacoes) || null;

    const supervisorId =
        payload?.supervisorId !== undefined &&
            payload?.supervisorId !== null &&
            String(payload.supervisorId).trim() !== ""
            ? Number(payload.supervisorId)
            : null;

    if (!nome) {
        throw new Error("Nome do campo é obrigatório.");
    }

    if (supervisorId) {
        const supervisor = await prisma.user.findUnique({
            where: { id: supervisorId },
        });

        if (!supervisor) {
            throw new Error("Supervisor não encontrado.");
        }
    }

    return prisma.campoEstagio.create({
        data: {
            nome,
            tipo,
            endereco,
            cidade,
            convenioAtivo:
                typeof payload?.convenioAtivo === "boolean"
                    ? payload.convenioAtivo
                    : true,
            ativo:
                typeof payload?.ativo === "boolean"
                    ? payload.ativo
                    : true,
            observacoes,
            supervisorId,
        },
        include: {
            supervisor: true,
        },
    });
}

export async function listCampos() {
    return prisma.campoEstagio.findMany({
        where: { ativo: true },
        include: {
            supervisor: true,
        },
        orderBy: { nome: "asc" },
    });
}

export async function listSupervisoresCampo() {
    return prisma.user.findMany({
        where: {
            ativo: true,
            role: {
                in: ["admin", "pedagogico", "coordenacao", "instrutor"],
            },
        },
        orderBy: {
            nome: "asc",
        },
        select: {
            id: true,
            nome: true,
            email: true,
            fone1: true,
            fone2: true,
            role: true,
        },
    });
}

export async function createBloco(payload) {
    const cursoId = normalizarInteiro(payload?.cursoId);
    const turmaId = normalizarInteiro(payload?.turmaId);
    const numeroBloco = validarNumeroBloco(payload?.numeroBloco);
    const turno = normalizarTexto(payload?.turno);
    const observacoes = normalizarTexto(payload?.observacoes) || null;

    if (!cursoId) {
        throw new Error("Curso é obrigatório.");
    }

    if (!turmaId) {
        throw new Error("Turma é obrigatória.");
    }

    if (!turno) {
        throw new Error("Turno é obrigatório.");
    }

    const dataInicio = normalizarDataObrigatoria(payload?.dataInicio, "Data de início");
    const dataFim = normalizarDataObrigatoria(payload?.dataFim, "Data de fim");

    if (dataFim < dataInicio) {
        throw new Error("A data de fim não pode ser menor que a data de início.");
    }

    await validarCursoETurma(cursoId, turmaId);

    const blocoExistente = await prisma.estagioBloco.findFirst({
        where: {
            turmaId,
            numeroBloco,
        },
    });

    if (blocoExistente) {
        throw new Error("Já existe um bloco com esse número para a turma selecionada.");
    }

    const cargaHorariaPrevista = obterCargaHorariaPorBloco(numeroBloco);

    return prisma.estagioBloco.create({
        data: {
            cursoId,
            turmaId,
            numeroBloco,
            turno,
            dataInicio,
            dataFim,
            cargaHorariaPrevista,
            status: normalizarTexto(payload?.status) || "Planejado",
            observacoes,
        },
        include: {
            turma: true,
            curso: true,
            campos: {
                include: {
                    campo: true,
                },
            },
            grupos: true,
        },
    });
}

export async function listBlocos() {
    return prisma.estagioBloco.findMany({
        include: {
            turma: true,
            curso: true,
            campos: {
                include: {
                    campo: true,
                },
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            },
            grupos: {
                include: {
                    alunos: {
                        include: {
                            aluno: true,
                        },
                        orderBy: {
                            id: "asc",
                        },
                    },
                },
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getBlocoById(blocoId) {
    return validarBloco(blocoId);
}

export async function updateBloco(blocoId, payload) {
    const bloco = await prisma.estagioBloco.findUnique({
        where: { id: Number(blocoId) },
    });

    if (!bloco) {
        throw new Error("Bloco de estágio não encontrado.");
    }

    const cursoId =
        payload?.cursoId !== undefined
            ? normalizarInteiro(payload.cursoId)
            : bloco.cursoId;

    const turmaId =
        payload?.turmaId !== undefined
            ? normalizarInteiro(payload.turmaId)
            : bloco.turmaId;

    const numeroBloco =
        payload?.numeroBloco !== undefined
            ? validarNumeroBloco(payload.numeroBloco)
            : bloco.numeroBloco;

    const turno =
        payload?.turno !== undefined
            ? normalizarTexto(payload.turno)
            : bloco.turno;

    if (!turno) {
        throw new Error("Turno é obrigatório.");
    }

    const dataInicio =
        payload?.dataInicio !== undefined
            ? normalizarDataObrigatoria(payload.dataInicio, "Data de início")
            : bloco.dataInicio;

    const dataFim =
        payload?.dataFim !== undefined
            ? normalizarDataObrigatoria(payload.dataFim, "Data de fim")
            : bloco.dataFim;

    if (dataFim < dataInicio) {
        throw new Error("A data de fim não pode ser menor que a data de início.");
    }

    await validarCursoETurma(cursoId, turmaId);

    const conflito = await prisma.estagioBloco.findFirst({
        where: {
            turmaId,
            numeroBloco,
            NOT: {
                id: Number(blocoId),
            },
        },
    });

    if (conflito) {
        throw new Error("Já existe um bloco com esse número para a turma selecionada.");
    }

    return prisma.estagioBloco.update({
        where: { id: Number(blocoId) },
        data: {
            cursoId,
            turmaId,
            numeroBloco,
            turno,
            dataInicio,
            dataFim,
            cargaHorariaPrevista: obterCargaHorariaPorBloco(numeroBloco),
            status:
                payload?.status !== undefined
                    ? normalizarTexto(payload.status) || bloco.status
                    : bloco.status,
            observacoes:
                payload?.observacoes !== undefined
                    ? normalizarTexto(payload.observacoes) || null
                    : bloco.observacoes,
        },
        include: {
            turma: true,
            curso: true,
            campos: {
                include: {
                    campo: true,
                },
            },
            grupos: {
                include: {
                    alunos: {
                        include: {
                            aluno: true,
                        },
                    },
                },
            },
        },
    });
}

export async function deleteBloco(blocoId) {
    await validarBloco(blocoId);

    return prisma.estagioBloco.delete({
        where: { id: Number(blocoId) },
    });
}

export async function addCampoToBloco(blocoId, payload) {
    const bloco = await validarBloco(blocoId);

    const campoId = normalizarInteiro(payload?.campoId);
    const ordem =
        payload?.ordem !== undefined && payload?.ordem !== null
            ? normalizarInteiro(payload.ordem)
            : null;
    const observacoes = normalizarTexto(payload?.observacoes) || null;

    if (!campoId) {
        throw new Error("Campo de estágio é obrigatório.");
    }

    await validarCampoEstagio(campoId);

    const campoExistenteNoBloco = await prisma.estagioBlocoCampo.findFirst({
        where: {
            blocoId: bloco.id,
            campoId,
        },
    });

    if (campoExistenteNoBloco) {
        throw new Error("Esse campo já foi adicionado ao bloco.");
    }

    return prisma.estagioBlocoCampo.create({
        data: {
            blocoId: bloco.id,
            campoId,
            ordem,
            observacoes,
        },
        include: {
            campo: true,
            bloco: true,
        },
    });
}

export async function removeCampoFromBloco(blocoId, campoVinculoId) {
    const vinculo = await prisma.estagioBlocoCampo.findUnique({
        where: { id: Number(campoVinculoId) },
    });

    if (!vinculo || vinculo.blocoId !== Number(blocoId)) {
        throw new Error("Campo vinculado ao bloco não encontrado.");
    }

    return prisma.estagioBlocoCampo.delete({
        where: { id: Number(campoVinculoId) },
    });
}

export async function listCamposDoBloco(blocoId) {
    await validarBloco(blocoId);

    return prisma.estagioBlocoCampo.findMany({
        where: {
            blocoId: Number(blocoId),
        },
        include: {
            campo: true,
        },
        orderBy: [{ ordem: "asc" }, { id: "asc" }],
    });
}

export async function createGrupo(blocoId, payload) {
    const bloco = await validarBloco(blocoId);

    const nome = normalizarTexto(payload?.nome);
    const ordem =
        payload?.ordem !== undefined && payload?.ordem !== null
            ? normalizarInteiro(payload.ordem)
            : null;
    const observacoes = normalizarTexto(payload?.observacoes) || null;

    if (!nome) {
        throw new Error("Nome do grupo é obrigatório.");
    }

    const grupoExistente = await prisma.estagioBlocoGrupo.findFirst({
        where: {
            blocoId: bloco.id,
            nome,
        },
    });

    if (grupoExistente) {
        throw new Error("Já existe um grupo com esse nome neste bloco.");
    }

    return prisma.estagioBlocoGrupo.create({
        data: {
            blocoId: bloco.id,
            nome,
            ordem,
            observacoes,
        },
        include: {
            alunos: {
                include: {
                    aluno: true,
                },
            },
        },
    });
}

export async function updateGrupo(grupoId, payload) {
    const grupo = await prisma.estagioBlocoGrupo.findUnique({
        where: { id: Number(grupoId) },
    });

    if (!grupo) {
        throw new Error("Grupo não encontrado.");
    }

    const nome =
        payload?.nome !== undefined
            ? normalizarTexto(payload.nome)
            : grupo.nome;

    if (!nome) {
        throw new Error("Nome do grupo é obrigatório.");
    }

    const conflito = await prisma.estagioBlocoGrupo.findFirst({
        where: {
            blocoId: grupo.blocoId,
            nome,
            NOT: {
                id: grupo.id,
            },
        },
    });

    if (conflito) {
        throw new Error("Já existe um grupo com esse nome neste bloco.");
    }

    return prisma.estagioBlocoGrupo.update({
        where: { id: grupo.id },
        data: {
            nome,
            ordem:
                payload?.ordem !== undefined
                    ? normalizarInteiro(payload.ordem)
                    : grupo.ordem,
            observacoes:
                payload?.observacoes !== undefined
                    ? normalizarTexto(payload.observacoes) || null
                    : grupo.observacoes,
        },
        include: {
            alunos: {
                include: {
                    aluno: true,
                },
            },
        },
    });
}

export async function deleteGrupo(grupoId) {
    await validarGrupo(grupoId);

    return prisma.estagioBlocoGrupo.delete({
        where: { id: Number(grupoId) },
    });
}

export async function listGruposDoBloco(blocoId) {
    await validarBloco(blocoId);

    return prisma.estagioBlocoGrupo.findMany({
        where: {
            blocoId: Number(blocoId),
        },
        include: {
            alunos: {
                include: {
                    aluno: true,
                },
                orderBy: {
                    id: "asc",
                },
            },
        },
        orderBy: [{ ordem: "asc" }, { id: "asc" }],
    });
}

export async function addAlunoToGrupo(grupoId, alunoId) {
    const grupo = await validarGrupo(grupoId);
    await validarAluno(alunoId);

    const alunoJaNoGrupo = await prisma.estagioBlocoGrupoAluno.findFirst({
        where: {
            grupoId: Number(grupoId),
            alunoId: Number(alunoId),
        },
    });

    if (alunoJaNoGrupo) {
        throw new Error("Esse aluno já está neste grupo.");
    }

    const alunoJaNoMesmoBloco = await prisma.estagioBlocoGrupoAluno.findFirst({
        where: {
            alunoId: Number(alunoId),
            grupo: {
                blocoId: grupo.blocoId,
            },
        },
        include: {
            grupo: true,
        },
    });

    if (alunoJaNoMesmoBloco) {
        throw new Error(
            `Esse aluno já está vinculado ao grupo "${alunoJaNoMesmoBloco.grupo.nome}" neste bloco.`
        );
    }

    return prisma.estagioBlocoGrupoAluno.create({
        data: {
            grupoId: Number(grupoId),
            alunoId: Number(alunoId),
        },
        include: {
            aluno: true,
            grupo: true,
        },
    });
}

export async function removeAlunoFromGrupo(grupoId, alunoId) {
    const vinculo = await prisma.estagioBlocoGrupoAluno.findFirst({
        where: {
            grupoId: Number(grupoId),
            alunoId: Number(alunoId),
        },
    });

    if (!vinculo) {
        throw new Error("Aluno não encontrado neste grupo.");
    }

    return prisma.estagioBlocoGrupoAluno.delete({
        where: { id: vinculo.id },
    });
}

export async function listAlunosDoGrupo(grupoId) {
    await validarGrupo(grupoId);

    return prisma.estagioBlocoGrupoAluno.findMany({
        where: {
            grupoId: Number(grupoId),
        },
        include: {
            aluno: true,
        },
        orderBy: {
            id: "asc",
        },
    });
}

export async function getGrupoById(grupoId) {
    const grupo = await prisma.estagioBlocoGrupo.findUnique({
        where: { id: Number(grupoId) },
        include: {
            bloco: {
                include: {
                    turma: true,
                    curso: true,
                },
            },
            alunos: {
                include: {
                    aluno: true,
                },
                orderBy: {
                    id: "asc",
                },
            },
        },
    });

    if (!grupo) {
        throw new Error("Grupo não encontrado.");
    }

    return grupo;
}

export async function listAlunosDisponiveisPorBloco(blocoId) {
    const bloco = await prisma.estagioBloco.findUnique({
        where: { id: Number(blocoId) },
        include: {
            turma: true,
        },
    });

    if (!bloco) {
        throw new Error("Bloco não encontrado.");
    }

    const alunosJaVinculados = await prisma.estagioBlocoGrupoAluno.findMany({
        where: {
            grupo: {
                blocoId: bloco.id,
            },
        },
        select: {
            alunoId: true,
        },
    });

    const idsJaVinculados = alunosJaVinculados.map((item) => item.alunoId);

    return prisma.user.findMany({
        where: {
            ativo: true,
            role: "aluno",
            turmaId: bloco.turmaId,
            ...(idsJaVinculados.length
                ? {
                    id: {
                        notIn: idsJaVinculados,
                    },
                }
                : {}),
        },
        orderBy: {
            nome: "asc",
        },
    });
}

function addDays(baseDate, days) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    return date;
}

function startOfDay(dateValue) {
    const date = new Date(dateValue);
    date.setHours(0, 0, 0, 0);
    return date;
}

function endOfDay(dateValue) {
    const date = new Date(dateValue);
    date.setHours(23, 59, 59, 999);
    return date;
}

function calcularEtapasPeriodo(dataInicio, dataFim, quantidadeEtapas) {
    const inicio = startOfDay(dataInicio);
    const fim = startOfDay(dataFim);

    if (fim < inicio) {
        throw new Error("A data final do bloco não pode ser menor que a data inicial.");
    }

    const msPorDia = 24 * 60 * 60 * 1000;
    const totalDias = Math.floor((fim - inicio) / msPorDia) + 1;

    if (totalDias < quantidadeEtapas) {
        throw new Error(
            "O período do bloco é muito curto para a quantidade de etapas do rodízio."
        );
    }

    const diasBasePorEtapa = Math.floor(totalDias / quantidadeEtapas);
    const sobra = totalDias % quantidadeEtapas;

    const etapas = [];
    let cursor = startOfDay(inicio);

    for (let i = 0; i < quantidadeEtapas; i++) {
        const diasNestaEtapa = diasBasePorEtapa + (i < sobra ? 1 : 0);
        const etapaInicio = startOfDay(cursor);
        const etapaFim = endOfDay(addDays(cursor, diasNestaEtapa - 1));

        etapas.push({
            ordem: i + 1,
            dataInicio: etapaInicio,
            dataFim: etapaFim,
        });

        cursor = addDays(cursor, diasNestaEtapa);
    }

    return etapas;
}

export async function listRotacoesDoBloco(blocoId) {
    await validarBloco(blocoId);

    return prisma.estagioRotacao.findMany({
        where: {
            blocoId: Number(blocoId),
        },
        include: {
            grupo: true,
            campo: true,
        },
        orderBy: [{ ordem: "asc" }, { grupoId: "asc" }],
    });
}

export async function deleteRotacoesDoBloco(blocoId) {
    await validarBloco(blocoId);

    return prisma.estagioRotacao.deleteMany({
        where: {
            blocoId: Number(blocoId),
        },
    });
}

export async function gerarRodizioAutomatico(blocoId) {
    const bloco = await prisma.estagioBloco.findUnique({
        where: { id: Number(blocoId) },
        include: {
            campos: {
                include: {
                    campo: true,
                },
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            },
            grupos: {
                orderBy: [{ ordem: "asc" }, { id: "asc" }],
            },
        },
    });

    if (!bloco) {
        throw new Error("Bloco não encontrado.");
    }

    if (!bloco.dataInicio || !bloco.dataFim) {
        throw new Error("O bloco precisa ter data de início e data de fim.");
    }

    const camposVinculados = bloco.campos || [];
    const grupos = bloco.grupos || [];

    if (!camposVinculados.length) {
        throw new Error("Adicione ao menos um campo ao bloco antes de gerar o rodízio.");
    }

    if (!grupos.length) {
        throw new Error("Crie ao menos um grupo antes de gerar o rodízio.");
    }

    if (camposVinculados.length !== grupos.length) {
        throw new Error(
            "A quantidade de grupos deve ser igual à quantidade de campos para gerar o rodízio automático."
        );
    }

    const campos = camposVinculados.map((item) => item.campo);

    const gruposFixos = grupos.filter((grupo) => grupo.fixo);
    const gruposNaoFixos = grupos.filter((grupo) => !grupo.fixo);

    if (gruposFixos.length > campos.length) {
        throw new Error("Há mais grupos fixos do que campos disponíveis.");
    }

    const etapas = calcularEtapasPeriodo(
        bloco.dataInicio,
        bloco.dataFim,
        campos.length
    );

    await prisma.estagioRotacao.deleteMany({
        where: {
            blocoId: bloco.id,
        },
    });

    const rotacoes = [];

    for (const etapa of etapas) {
        let camposRestantes = [...campos];

        gruposFixos.forEach((grupoFixo, index) => {
            const campoFixo = campos[index];

            if (!campoFixo) {
                throw new Error("Não foi possível determinar o campo fixo para um dos grupos.");
            }

            rotacoes.push({
                blocoId: bloco.id,
                grupoId: grupoFixo.id,
                campoId: campoFixo.id,
                dataInicio: etapa.dataInicio,
                dataFim: etapa.dataFim,
                ordem: etapa.ordem,
                fixo: true,
            });

            camposRestantes = camposRestantes.filter(
                (campo) => campo.id !== campoFixo.id
            );
        });

        if (gruposNaoFixos.length) {
            if (!camposRestantes.length) {
                throw new Error(
                    "Não restaram campos disponíveis para os grupos não fixos."
                );
            }

            gruposNaoFixos.forEach((grupo, index) => {
                const campoIndex = (index + (etapa.ordem - 1)) % camposRestantes.length;
                const campo = camposRestantes[campoIndex];

                if (!campo) {
                    throw new Error(
                        "Não foi possível determinar o campo de um dos grupos no rodízio."
                    );
                }

                rotacoes.push({
                    blocoId: bloco.id,
                    grupoId: grupo.id,
                    campoId: campo.id,
                    dataInicio: etapa.dataInicio,
                    dataFim: etapa.dataFim,
                    ordem: etapa.ordem,
                    fixo: false,
                });
            });
        }
    }

    await prisma.estagioRotacao.createMany({
        data: rotacoes,
    });

    return prisma.estagioRotacao.findMany({
        where: {
            blocoId: bloco.id,
        },
        include: {
            grupo: true,
            campo: true,
        },
        orderBy: [{ ordem: "asc" }, { grupoId: "asc" }],
    });
}

export async function getMeuEstagio(alunoId) {
    console.log("Buscando vínculos para alunoId:", alunoId)

    const vinculos = await prisma.estagioBlocoGrupoAluno.findMany({
        where: {
            alunoId: Number(alunoId),
        },
        include: {
            aluno: true,
            grupo: {
                include: {
                    bloco: {
                        include: {
                            turma: true,
                            curso: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            id: "asc",
        },
    });

    console.log("VÍNCULOS ENCONTRADOS:", vinculos);

    if (!vinculos.length) {
        return {
            aluno: null,
            grupoAtual: null,
            blocoAtual: null,
            campoAtual: null,
            blocos: [],
            rodizios: [],
        };
    }

    const aluno = vinculos[0].aluno;
    const grupoIds = vinculos.map((item) => item.grupoId);

    const rotacoes = await prisma.estagioRotacao.findMany({
        where: {
            grupoId: {
                in: grupoIds,
            },
        },
        include: {
            campo: {
                include: {
                    supervisor: true,
                },
            },
            grupo: {
                include: {
                    bloco: {
                        include: {
                            turma: true,
                            curso: true,
                        },
                    },
                },
            },
            bloco: {
                include: {
                    turma: true,
                    curso: true,
                },
            },
        },
        orderBy: [
            { dataInicio: "asc" },
            { ordem: "asc" },
        ],
    });

    const hoje = new Date();
    hoje.setHours(12, 0, 0, 0);

    const rodiziosFormatados = rotacoes.map((item) => {
        const inicio = new Date(item.dataInicio);
        const fim = new Date(item.dataFim);
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);

        let status = "futuro";

        if (hoje >= inicio && hoje <= fim) {
            status = "atual";
        } else if (hoje > fim) {
            status = "concluido";
        }

        return {
            id: item.id,
            ordem: item.ordem,
            dataInicio: item.dataInicio,
            dataFim: item.dataFim,
            status,
            fixo: item.fixo,
            grupo: {
                id: item.grupo?.id,
                nome: item.grupo?.nome,
                ordem: item.grupo?.ordem,
                fixo: item.grupo?.fixo,
            },
            bloco: item.bloco
                ? {
                    id: item.bloco.id,
                    numeroBloco: item.bloco.numeroBloco,
                    turno: item.bloco.turno,
                    dataInicio: item.bloco.dataInicio,
                    dataFim: item.bloco.dataFim,
                    cargaHorariaPrevista: item.bloco.cargaHorariaPrevista,
                    turma: item.bloco.turma
                        ? {
                            id: item.bloco.turma.id,
                            nome: item.bloco.turma.nome,
                        }
                        : null,
                    curso: item.bloco.curso
                        ? {
                            id: item.bloco.curso.id,
                            nome: item.bloco.curso.nome,
                        }
                        : null,
                }
                : null,
            campo: {
                id: item.campo?.id,
                nome: item.campo?.nome,
                tipo: item.campo?.tipo,
                endereco: item.campo?.endereco,
                cidade: item.campo?.cidade,
                observacoes: item.campo?.observacoes,
                supervisor: item.campo?.supervisor
                    ? {
                        id: item.campo.supervisor.id,
                        nome: item.campo.supervisor.nome,
                        email: item.campo.supervisor.email,
                        fone1: item.campo.supervisor.fone1,
                        fone2: item.campo.supervisor.fone2,
                    }
                    : null,
            },
        };
    });

    const rodizioAtual =
        rodiziosFormatados.find((item) => item.status === "atual") || null;

    const blocosMap = new Map();

    for (const item of rodiziosFormatados) {
        const blocoId = item.bloco?.id;
        if (!blocoId) continue;

        if (!blocosMap.has(blocoId)) {
            blocosMap.set(blocoId, {
                id: item.bloco.id,
                numeroBloco: item.bloco.numeroBloco,
                turno: item.bloco.turno,
                dataInicio: item.bloco.dataInicio,
                dataFim: item.bloco.dataFim,
                cargaHorariaPrevista: item.bloco.cargaHorariaPrevista,
                turma: item.bloco.turma,
                curso: item.bloco.curso,
                grupo: item.grupo,
                rodizios: [],
            });
        }

        blocosMap.get(blocoId).rodizios.push(item);
    }

    const blocos = Array.from(blocosMap.values()).sort((a, b) => {
        const dataA = new Date(a.dataInicio).getTime();
        const dataB = new Date(b.dataInicio).getTime();
        return dataA - dataB;
    });

    return {
        aluno: aluno
            ? {
                id: aluno.id,
                nome: aluno.nome,
                email: aluno.email,
                matricula: aluno.matricula,
            }
            : null,
        grupoAtual: rodizioAtual?.grupo || null,
        blocoAtual: rodizioAtual?.bloco || null,
        campoAtual: rodizioAtual || null,
        blocos,
        rodizios: rodiziosFormatados,
    };
}