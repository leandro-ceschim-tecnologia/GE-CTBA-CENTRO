import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const STATUS_FLOW = ["NAO_LANCADO", "PRESENTE", "FALTA"];

const ORIGEM_LABEL = {
    BASE: "Base",
    PENDENCIA: "Pendência",
    REPOSICAO: "Reposição",
    EXTRA: "Extra",
};

function getNextStatus(statusAtual) {
    const index = STATUS_FLOW.indexOf(statusAtual);
    if (index === -1) return "NAO_LANCADO";
    return STATUS_FLOW[(index + 1) % STATUS_FLOW.length];
}

function getStatusSymbol(status) {
    if (status === "PRESENTE") return "✓";
    if (status === "FALTA") return "✗";
    return "...";
}

function getStatusClass(status) {
    if (status === "PRESENTE") return "freq-cell-presente";
    if (status === "FALTA") return "freq-cell-falta";
    return "freq-cell-vazio";
}

function getTurnoLabel(turno) {
    if (turno === "manha") return "Manhã";
    if (turno === "tarde") return "Tarde";
    if (turno === "noite") return "Noite";
    if (turno === "integral") return "Integral";
    if (turno === "sabado") return "Sábado";
    return turno || "-";
}

export default function FrequenciaPage() {
    const [filtrosBase, setFiltrosBase] = useState({
        cursos: [],
        turnos: [],
        turmas: [],
        disciplinas: [],
    });

    const [filters, setFilters] = useState({
        cursoId: "",
        turno: "",
        turmaId: "",
        disciplinaId: "",
    });

    const [grade, setGrade] = useState(null);
    const [gridState, setGridState] = useState({});
    const [loadingBase, setLoadingBase] = useState(false);
    const [loadingGrade, setLoadingGrade] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showAddAlunoModal, setShowAddAlunoModal] = useState(false);
    const [alunoBusca, setAlunoBusca] = useState("");
    const [alunosEncontrados, setAlunosEncontrados] = useState([]);
    const [loadingBuscaAluno, setLoadingBuscaAluno] = useState(false);
    const [addingAluno, setAddingAluno] = useState(false);
    const [origemAluno, setOrigemAluno] = useState("PENDENCIA");
    const [observacoesAluno, setObservacoesAluno] = useState("");

    const [historicoAluno, setHistoricoAluno] = useState(null);
    const [loadingHistorico, setLoadingHistorico] = useState(false);

    useEffect(() => {
        async function loadFiltros() {
            try {
                setLoadingBase(true);
                setError("");

                let data = {};
                try {
                    data = await apiRequest("/frequencia/filtros");
                } catch (err) {
                    console.error("Erro API filtros:", err);
                }
                setFiltrosBase({
                    cursos: Array.isArray(data?.cursos) ? data.cursos : [],
                    turnos: Array.isArray(data?.turnos) ? data.turnos : [],
                    turmas: Array.isArray(data?.turmas) ? data.turmas : [],
                    disciplinas: Array.isArray(data?.disciplinas) ? data.disciplinas : [],
                });
            } catch (err) {
                setError(err.message || "Erro ao carregar filtros.");
            } finally {
                setLoadingBase(false);
            }
        }

        loadFiltros();
    }, []);

    const turmasFiltradas = useMemo(() => {
        return filtrosBase.turmas.filter((turma) => {
            const matchCurso = filters.cursoId
                ? String(turma.cursoId) === String(filters.cursoId)
                : true;

            const matchTurno = filters.turno
                ? String(turma.turno) === String(filters.turno)
                : true;

            return matchCurso && matchTurno;
        });
    }, [filtrosBase.turmas, filters.cursoId, filters.turno]);

    const disciplinasFiltradas = useMemo(() => {
        return filtrosBase.disciplinas.filter((disciplina) => {
            const matchCurso = filters.cursoId
                ? String(disciplina.cursoId) === String(filters.cursoId)
                : true;

            return matchCurso;
        });
    }, [filtrosBase.disciplinas, filters.cursoId]);

    function handleFilterChange(event) {
        const { name, value } = event.target;

        setFilters((prev) => {
            const next = {
                ...prev,
                [name]: value,
            };

            if (name === "cursoId") {
                next.turmaId = "";
                next.disciplinaId = "";
            }

            if (name === "turno") {
                next.turmaId = "";
            }

            return next;
        });
    }

    function buildGridState(data) {
        const next = {};

        const colunas = Array.isArray(data?.colunas) ? data.colunas : [];
        const linhas = Array.isArray(data?.linhas) ? data.linhas : [];

        for (const linha of linhas) {
            for (const celula of linha.celulas || []) {
                const key = `${linha.aluno.id}:${celula.cronogramaAulaId}`;
                next[key] = {
                    alunoId: linha.aluno.id,
                    alunoTurmaDisciplinaId:
                        celula.alunoTurmaDisciplinaId ||
                        linha.aluno.alunoTurmaDisciplinaId ||
                        null,
                    cronogramaAulaId: celula.cronogramaAulaId,
                    status: celula.status || "NAO_LANCADO",
                    justificativa: celula.justificativa || "",
                    observacoes: celula.observacoes || "",
                };
            }
        }

        return next;
    }

    async function handleBuscarGrade() {
        if (!filters.turmaId || !filters.disciplinaId) {
            setError("Selecione turma e disciplina.");
            return;
        }

        try {
            setLoadingGrade(true);
            setError("");
            setSuccess("");
            setHistoricoAluno(null);

            const params = new URLSearchParams();
            if (filters.cursoId) params.set("cursoId", filters.cursoId);
            if (filters.turno) params.set("turno", filters.turno);
            params.set("turmaId", filters.turmaId);
            params.set("disciplinaId", filters.disciplinaId);

            const data = await apiRequest(`/frequencia/grade?${params.toString()}`);
            setGrade(data);
            setGridState(buildGridState(data));
        } catch (err) {
            setError(err.message || "Erro ao carregar grade de frequência.");
            setGrade(null);
            setGridState({});
        } finally {
            setLoadingGrade(false);
        }
    }

    function handleToggleCell(alunoId, cronogramaAulaId) {
        const key = `${alunoId}:${cronogramaAulaId}`;

        setGridState((prev) => {
            const atual = prev[key] || {
                alunoId,
                cronogramaAulaId,
                status: "NAO_LANCADO",
                justificativa: "",
                observacoes: "",
                alunoTurmaDisciplinaId: null,
            };

            return {
                ...prev,
                [key]: {
                    ...atual,
                    status: getNextStatus(atual.status),
                },
            };
        });
    }

    async function handleSalvar() {
        if (!grade?.colunas?.length || !grade?.linhas?.length) {
            setError("Nenhuma grade carregada para salvar.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            for (const coluna of grade.colunas) {
                const alunosPayload = grade.linhas.map((linha) => {
                    const key = `${linha.aluno.id}:${coluna.cronogramaAulaId}`;
                    const estado = gridState[key];

                    return {
                        alunoId: linha.aluno.id,
                        alunoTurmaDisciplinaId:
                            estado?.alunoTurmaDisciplinaId ||
                            linha.aluno.alunoTurmaDisciplinaId ||
                            null,
                        status: estado?.status || "NAO_LANCADO",
                        justificativa: estado?.justificativa || null,
                        observacoes: estado?.observacoes || null,
                    };
                });

                await apiRequest("/frequencia/lancamento", {
                    method: "POST",
                    body: {
                        cronogramaAulaId: coluna.cronogramaAulaId,
                        observacoes: null,
                        alunos: alunosPayload,
                    },
                });
            }

            setSuccess("Frequência salva com sucesso.");
            await handleBuscarGrade();
        } catch (err) {
            setError(err.message || "Erro ao salvar frequência.");
        } finally {
            setSaving(false);
        }
    }

    async function handleBuscarAluno() {
        if (!alunoBusca.trim()) {
            setError("Digite o nome ou matrícula do aluno.");
            return;
        }

        try {
            setLoadingBuscaAluno(true);
            setError("");

            const data = await apiRequest("/users");
            const usuarios = Array.isArray(data) ? data : [];

            const termo = alunoBusca.trim().toLowerCase();

            const filtrados = usuarios.filter((user) => {
                if (user.role !== "aluno") return false;

                const nome = String(user.nome || "").toLowerCase();
                const matricula = String(user.matricula || "").toLowerCase();

                return nome.includes(termo) || matricula.includes(termo);
            });

            setAlunosEncontrados(filtrados);
        } catch (err) {
            setError(err.message || "Erro ao buscar alunos.");
        } finally {
            setLoadingBuscaAluno(false);
        }
    }

    async function handleAdicionarAluno(aluno) {
        if (!grade?.turma?.id || !grade?.turmaDisciplina?.id) {
            setError("Carregue a grade antes de adicionar aluno.");
            return;
        }

        try {
            setAddingAluno(true);
            setError("");

            await apiRequest("/frequencia/adicionar-aluno", {
                method: "POST",
                body: {
                    alunoId: aluno.id,
                    turmaId: grade.turma.id,
                    turmaDisciplinaId: grade.turmaDisciplina.id,
                    origem: origemAluno,
                    observacoes: observacoesAluno || null,
                },
            });

            setSuccess("Aluno vinculado à disciplina com sucesso.");
            setShowAddAlunoModal(false);
            setAlunoBusca("");
            setAlunosEncontrados([]);
            setObservacoesAluno("");
            await handleBuscarGrade();
        } catch (err) {
            setError(err.message || "Erro ao adicionar aluno.");
        } finally {
            setAddingAluno(false);
        }
    }

    async function handleAbrirHistorico(alunoId) {
        try {
            setLoadingHistorico(true);
            setError("");
            setHistoricoAluno(null);

            const data = await apiRequest(`/frequencia/aluno/${alunoId}/historico`);
            setHistoricoAluno(data);
        } catch (err) {
            setError(err.message || "Erro ao carregar histórico do aluno.");
        } finally {
            setLoadingHistorico(false);
        }
    }

    const resumoTopo = useMemo(() => {
        if (!grade?.linhas?.length) {
            return {
                totalAlunos: 0,
                comRisco: 0,
                comFaltas: 0,
            };
        }

        const totalAlunos = grade.linhas.length;
        const comFaltas = grade.linhas.filter(
            (linha) => (linha.resumo?.totalFaltas || 0) > 0
        ).length;

        const comRisco = grade.linhas.filter((linha) => {
            const totalFaltas = linha.resumo?.totalFaltas || 0;
            const maiorSequencia = linha.resumo?.maiorSequenciaFaltas || 0;

            return totalFaltas >= 1 || maiorSequencia >= 2;
        }).length;

        return {
            totalAlunos,
            comRisco,
            comFaltas,
        };
    }, [grade]);

    return (
        <Layout
            title="Frequência"
            subtitle="Lançamento de presença e faltas por turma e disciplina"
        >
            <div className="card">
                <div className="form-grid frequencia-filtros-grid">
                    <div className="form-group">
                        <label>Curso</label>
                        <select
                            name="cursoId"
                            value={filters.cursoId}
                            onChange={handleFilterChange}
                            disabled={loadingBase}
                        >
                            <option value="">Selecione</option>
                            {filtrosBase.cursos.map((curso) => (
                                <option key={curso.id} value={curso.id}>
                                    {curso.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Turno</label>
                        <select
                            name="turno"
                            value={filters.turno}
                            onChange={handleFilterChange}
                            disabled={loadingBase}
                        >
                            <option value="">Selecione</option>
                            {filtrosBase.turnos.map((turno) => (
                                <option key={turno} value={turno}>
                                    {getTurnoLabel(turno)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Turma</label>
                        <select
                            name="turmaId"
                            value={filters.turmaId}
                            onChange={handleFilterChange}
                            disabled={loadingBase}
                        >
                            <option value="">Selecione</option>
                            {turmasFiltradas.map((turma) => (
                                <option key={turma.id} value={turma.id}>
                                    {turma.nome} - {turma.curso?.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Disciplina</label>
                        <select
                            name="disciplinaId"
                            value={filters.disciplinaId}
                            onChange={handleFilterChange}
                            disabled={loadingBase}
                        >
                            <option value="">Selecione</option>
                            {disciplinasFiltradas.map((disciplina) => (
                                <option key={disciplina.id} value={disciplina.id}>
                                    {disciplina.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="action-row">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleBuscarGrade}
                        disabled={loadingGrade}
                    >
                        {loadingGrade ? "Carregando..." : "Carregar grade"}
                    </button>

                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setShowAddAlunoModal(true)}
                        disabled={!grade}
                    >
                        + Adicionar aluno
                    </button>

                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSalvar}
                        disabled={!grade || saving}
                    >
                        {saving ? "Salvando..." : "Salvar frequência"}
                    </button>
                </div>

                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : null}
            </div>

            {grade ? (
                <>
                    <div className="card">
                        <div className="frequencia-resumo-topo">
                            <div className="summary-card">
                                <strong>Total de alunos</strong>
                                <span>{resumoTopo.totalAlunos}</span>
                            </div>
                            <div className="summary-card">
                                <strong>Com faltas</strong>
                                <span>{resumoTopo.comFaltas}</span>
                            </div>
                            <div className="summary-card">
                                <strong>Em atenção</strong>
                                <span>{resumoTopo.comRisco}</span>
                            </div>
                        </div>

                        <div className="frequencia-info-turma">
                            <p>
                                <strong>Turma:</strong> {grade.turma?.nome || "-"}
                            </p>
                            <p>
                                <strong>Disciplina:</strong> {grade.disciplina?.nome || "-"}
                            </p>
                            <p>
                                <strong>Curso:</strong> {grade.turma?.curso?.nome || "-"}
                            </p>
                        </div>
                    </div>

                    <div className="card">
                        <h3>Grade de frequência</h3>

                        {!grade.linhas?.length ? (
                            <p>Nenhum aluno encontrado para esta disciplina.</p>
                        ) : (
                            <div className="table-wrapper frequencia-table-wrapper">
                                <table className="data-table frequencia-table">
                                    <thead>
                                        <tr>
                                            <th className="sticky-col sticky-col-1">Matrícula</th>
                                            <th className="sticky-col sticky-col-2">Aluno</th>
                                            <th className="sticky-col sticky-col-3">Vínculo</th>
                                            <th className="sticky-col sticky-col-4">Resumo</th>

                                            {grade.colunas.map((coluna) => (
                                                <th key={coluna.cronogramaAulaId}>
                                                    <div className="frequencia-coluna-data">
                                                        <strong>{coluna.dataLabel}</strong>
                                                        <span>{coluna.diaSemana}</span>
                                                        <small>
                                                            {coluna.numeroEncontroDisciplina}º
                                                        </small>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {grade.linhas.map((linha) => (
                                            <tr key={linha.aluno.id}>
                                                <td className="sticky-col sticky-col-1">
                                                    {linha.aluno.matricula || "-"}
                                                </td>

                                                <td className="sticky-col sticky-col-2">
                                                    <div className="frequencia-aluno-cell">
                                                        <button
                                                            type="button"
                                                            className="link-button"
                                                            onClick={() =>
                                                                handleAbrirHistorico(linha.aluno.id)
                                                            }
                                                        >
                                                            {linha.aluno.nome}
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="sticky-col sticky-col-3">
                                                    <span className="badge badge-neutral">
                                                        {ORIGEM_LABEL[linha.aluno.origem] || "Base"}
                                                    </span>
                                                </td>

                                                <td className="sticky-col sticky-col-4">
                                                    <div className="frequencia-resumo-aluno">
                                                        <span>
                                                            F: {linha.resumo?.totalFaltas || 0}
                                                        </span>
                                                        <span>
                                                            Seq:{" "}
                                                            {linha.resumo?.maiorSequenciaFaltas || 0}
                                                        </span>
                                                    </div>
                                                </td>

                                                {grade.colunas.map((coluna) => {
                                                    const key = `${linha.aluno.id}:${coluna.cronogramaAulaId}`;
                                                    const celula = gridState[key];

                                                    return (
                                                        <td key={coluna.cronogramaAulaId}>
                                                            <button
                                                                type="button"
                                                                className={`freq-cell ${getStatusClass(
                                                                    celula?.status
                                                                )}`}
                                                                onClick={() =>
                                                                    handleToggleCell(
                                                                        linha.aluno.id,
                                                                        coluna.cronogramaAulaId
                                                                    )
                                                                }
                                                                title={`Clique para alternar frequência - ${linha.aluno.nome}`}
                                                            >
                                                                {getStatusSymbol(
                                                                    celula?.status || "NAO_LANCADO"
                                                                )}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : null}

            {showAddAlunoModal ? (
                <div className="modal-backdrop">
                    <div className="modal-card modal-lg">
                        <div className="modal-header">
                            <h3>Adicionar aluno à disciplina</h3>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => {
                                    setShowAddAlunoModal(false);
                                    setAlunoBusca("");
                                    setAlunosEncontrados([]);
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Buscar por nome ou matrícula</label>
                                <input
                                    type="text"
                                    value={alunoBusca}
                                    onChange={(e) => setAlunoBusca(e.target.value)}
                                    placeholder="Digite nome ou matrícula"
                                />
                            </div>

                            <div className="form-group">
                                <label>Origem</label>
                                <select
                                    value={origemAluno}
                                    onChange={(e) => setOrigemAluno(e.target.value)}
                                >
                                    <option value="PENDENCIA">Pendência</option>
                                    <option value="REPOSICAO">Reposição</option>
                                    <option value="EXTRA">Extra</option>
                                    <option value="BASE">Base</option>
                                </select>
                            </div>

                            <div className="form-group form-group-full">
                                <label>Observações</label>
                                <textarea
                                    rows={3}
                                    value={observacoesAluno}
                                    onChange={(e) => setObservacoesAluno(e.target.value)}
                                    placeholder="Ex.: aluno cursando disciplina pendente em outra turma"
                                />
                            </div>
                        </div>

                        <div className="action-row">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleBuscarAluno}
                                disabled={loadingBuscaAluno}
                            >
                                {loadingBuscaAluno ? "Buscando..." : "Buscar aluno"}
                            </button>
                        </div>

                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Matrícula</th>
                                        <th>Nome</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!alunosEncontrados.length ? (
                                        <tr>
                                            <td colSpan="3">Nenhum aluno localizado.</td>
                                        </tr>
                                    ) : (
                                        alunosEncontrados.map((aluno) => (
                                            <tr key={aluno.id}>
                                                <td>{aluno.matricula || "-"}</td>
                                                <td>{aluno.nome}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() => handleAdicionarAluno(aluno)}
                                                        disabled={addingAluno}
                                                    >
                                                        {addingAluno ? "Adicionando..." : "Adicionar"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : null}

            {historicoAluno ? (
                <div className="modal-backdrop">
                    <div className="modal-card modal-xl">
                        <div className="modal-header">
                            <h3>Histórico do aluno</h3>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setHistoricoAluno(null)}
                            >
                                ×
                            </button>
                        </div>

                        {loadingHistorico ? (
                            <p>Carregando histórico...</p>
                        ) : (
                            <>
                                <div className="frequencia-historico-header">
                                    <p>
                                        <strong>Aluno:</strong> {historicoAluno.aluno?.nome}
                                    </p>
                                    <p>
                                        <strong>Matrícula:</strong>{" "}
                                        {historicoAluno.aluno?.matricula || "-"}
                                    </p>
                                    <p>
                                        <strong>Turma base:</strong>{" "}
                                        {historicoAluno.aluno?.turma?.nome || "-"}
                                    </p>
                                </div>

                                <div className="frequencia-resumo-topo">
                                    <div className="summary-card">
                                        <strong>Faltas</strong>
                                        <span>{historicoAluno.resumo?.faltas || 0}</span>
                                    </div>
                                    <div className="summary-card">
                                        <strong>Maior sequência</strong>
                                        <span>
                                            {historicoAluno.resumo?.maiorSequenciaFaltas || 0}
                                        </span>
                                    </div>
                                    <div className="summary-card">
                                        <strong>Ocorrências evasão</strong>
                                        <span>
                                            {historicoAluno.resumo?.totalOcorrenciasEvasao || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Disciplina</th>
                                                <th>Turma</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {!historicoAluno.frequencias?.length ? (
                                                <tr>
                                                    <td colSpan="4">
                                                        Nenhum registro de frequência encontrado.
                                                    </td>
                                                </tr>
                                            ) : (
                                                historicoAluno.frequencias.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{item.aula?.dataLabel || "-"}</td>
                                                        <td>
                                                            {item.aula?.disciplina?.nome || "-"}
                                                        </td>
                                                        <td>{item.aula?.turma?.nome || "-"}</td>
                                                        <td>{item.status}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </Layout>
    );
}