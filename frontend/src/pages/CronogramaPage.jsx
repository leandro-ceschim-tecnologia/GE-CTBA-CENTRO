import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const initialFilters = {
    somenteFuturas: true,
    somenteHoje: false,
    modulo: "",
    disciplinaId: "",
    semInstrutor: false,
    comLaboratorio: false,
    comVpo: false,
    avaliacaoFinal: false,
};

function buildQuery(filters) {
    const params = new URLSearchParams();

    if (filters.somenteFuturas) params.set("somenteFuturas", "true");
    if (filters.somenteHoje) params.set("somenteHoje", "true");
    if (filters.modulo) params.set("modulo", filters.modulo);
    if (filters.disciplinaId) params.set("disciplinaId", filters.disciplinaId);
    if (filters.semInstrutor) params.set("semInstrutor", "true");
    if (filters.comLaboratorio) params.set("comLaboratorio", "true");
    if (filters.comVpo) params.set("comVpo", "true");
    if (filters.avaliacaoFinal) params.set("avaliacaoFinal", "true");

    return params.toString();
}

function getInstrutorEfetivo(aula) {
    return (
        aula.instrutor?.nome ||
        aula.turmaDisciplina?.instrutorPadrao?.nome ||
        "Sem instrutor"
    );
}

function getRowClass(aula) {
    const hasLab = aula.reservas?.some(
        (reserva) => reserva.tipo === "laboratorio" && reserva.status === "ativa"
    );
    const hasVpo = aula.reservas?.some(
        (reserva) => reserva.tipo === "vpo" && reserva.status === "ativa"
    );
    const semInstrutorEfetivo =
        !aula.instrutorId && !aula.turmaDisciplina?.instrutorPadraoId;

    if (aula.tipoAula === "Avaliação Final") return "row-avaliacao-final";
    if (semInstrutorEfetivo) return "row-sem-instrutor";
    if (hasLab) return "row-com-laboratorio";
    if (hasVpo) return "row-com-vpo";

    return "";
}

function formatHorarioAula(aula) {
    if (!aula.horarioInicio || !aula.horarioFim) return "-";
    return `${aula.horarioInicio} às ${aula.horarioFim}`;
}

function getTurmaHorarioResumo(turma) {
    if (!turma) return null;

    const semana =
        turma.horarioSemanaInicio && turma.horarioSemanaFim
            ? `${turma.horarioSemanaInicio} às ${turma.horarioSemanaFim}`
            : "-";

    const sabado = turma.sabadoIntegral
        ? `${turma.horarioSabadoInicio} às 12:00 e 13:00 às ${turma.horarioSabadoFim}`
        : turma.horarioSabadoInicio && turma.horarioSabadoFim
            ? `${turma.horarioSabadoInicio} às ${turma.horarioSabadoFim}`
            : "-";

    return { semana, sabado };
}

function getTurnoLabel(turno) {
    if (turno === "manha") return "Manhã";
    if (turno === "tarde") return "Tarde";
    if (turno === "noite") return "Noite";
    return turno || "-";
}

function getTipoHorarioLabel(tipoHorario) {
    if (tipoHorario === "somente_semana") return "Somente semana";
    if (tipoHorario === "semana_e_sabado") return "Semana e sábado";
    if (tipoHorario === "somente_sabado") return "Somente sábado";
    return tipoHorario || "-";
}

export default function CronogramaPage() {
    const { user } = useAuth();

    const [turmas, setTurmas] = useState([]);
    const [instrutores, setInstrutores] = useState([]);
    const [turmaId, setTurmaId] = useState("");
    const [cronograma, setCronograma] = useState([]);
    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(false);
    const [gerando, setGerando] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [dataCorte, setDataCorte] = useState("");
    const [regenerando, setRegenerando] = useState(false);

    const isAdmin = user?.role === "admin";
    const canManage = ["admin", "pedagogico"].includes(user?.role);

    useEffect(() => {
        async function loadBase() {
            try {
                const [turmasData, instrutoresData] = await Promise.all([
                    apiRequest("/turmas"),
                    apiRequest("/users"),
                ]);

                setTurmas(turmasData);
                setInstrutores(instrutoresData);
            } catch (err) {
                setError(err.message);
            }
        }

        loadBase();
    }, []);

    const disciplinasDisponiveis = useMemo(() => {
        const map = new Map();

        cronograma.forEach((aula) => {
            const disciplina = aula.turmaDisciplina?.disciplina;
            if (disciplina) {
                map.set(disciplina.id, disciplina);
            }
        });

        return Array.from(map.values());
    }, [cronograma]);

    const turmaSelecionada = useMemo(() => {
        return turmas.find((turma) => String(turma.id) === String(turmaId)) || null;
    }, [turmas, turmaId]);

    const resumoHorarioTurma = useMemo(() => {
        return getTurmaHorarioResumo(turmaSelecionada);
    }, [turmaSelecionada]);

    function handleFilterChange(event) {
        const { name, value, type, checked } = event.target;

        setFilters((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleRegenerar() {
        if (!turmaId || !dataCorte) {
            setError("Selecione a turma e informe a data de corte.");
            return;
        }

        const confirmar = window.confirm(
            "Deseja regenerar o cronograma a partir da data de corte? Aulas passadas e aulas protegidas serão preservadas."
        );

        if (!confirmar) return;

        try {
            setRegenerando(true);
            setError("");
            setSuccess("");

            const data = await apiRequest("/cronograma/regenerar", {
                method: "POST",
                body: JSON.stringify({
                    turmaId: Number(turmaId),
                    dataCorte,
                }),
            });

            setCronograma(data);
            setSuccess("Cronograma regenerado com sucesso.");
        } catch (err) {
            setError(err.message);
        } finally {
            setRegenerando(false);
        }
    }

    async function handleBuscar() {
        if (!turmaId) return;

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const query = buildQuery(filters);
            const url = query
                ? `/cronograma/turma/${turmaId}?${query}`
                : `/cronograma/turma/${turmaId}`;

            const data = await apiRequest(url);
            setCronograma(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGerar() {
        if (!turmaId) return;

        try {
            setGerando(true);
            setError("");
            setSuccess("");

            const data = await apiRequest("/cronograma/gerar", {
                method: "POST",
                body: JSON.stringify({ turmaId: Number(turmaId) }),
            });

            setCronograma(data);
            setSuccess("Cronograma gerado com sucesso.");
        } catch (err) {
            setError(err.message);
        } finally {
            setGerando(false);
        }
    }

    async function handleSetInstrutor(aulaId, instrutorId) {
        try {
            setError("");
            setSuccess("");

            await apiRequest(`/cronograma-aulas/${aulaId}/instrutor`, {
                method: "PATCH",
                body: JSON.stringify({
                    instrutorId: instrutorId ? Number(instrutorId) : null,
                }),
            });

            setSuccess("Instrutor da aula atualizado com sucesso.");
            await handleBuscar();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSetInstrutorAPartir(aula, instrutorId) {
        if (!instrutorId) return;

        const atualizarPadrao = window.confirm(
            "Deseja também atualizar o instrutor padrão da disciplina na turma?"
        );

        try {
            setError("");
            setSuccess("");

            const result = await apiRequest(
                `/cronograma-aulas/${aula.id}/instrutor-a-partir`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        instrutorId: Number(instrutorId),
                        atualizarPadrao,
                    }),
                }
            );

            setSuccess(
                `${result.totalAtualizado} aula(s) atualizada(s) a partir da aula selecionada.`
            );
            await handleBuscar();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleCriarReserva(aula, tipo) {
        const recursoNome = window.prompt(
            tipo === "laboratorio"
                ? "Informe o nome do laboratório:"
                : "Informe o nome do VPO:"
        );

        if (!recursoNome) return;

        try {
            setError("");
            setSuccess("");

            await apiRequest("/reservas", {
                method: "POST",
                body: JSON.stringify({
                    cronogramaAulaId: aula.id,
                    tipo,
                    recursoNome,
                }),
            });

            setSuccess("Reserva criada com sucesso.");
            await handleBuscar();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <Layout title="Cronograma" subtitle="Geração e Gestão do Cronograma por Turma">
            <div className="card">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Turma</label>
                        <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                            <option value="">Selecione uma turma</option>
                            {turmas.map((turma) => (
                                <option key={turma.id} value={turma.id}>
                                    {turma.nome} - {turma.curso?.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="filters-grid">
                    <label>
                        <input
                            type="checkbox"
                            name="somenteFuturas"
                            checked={filters.somenteFuturas}
                            onChange={handleFilterChange}
                        />{" "}
                        Somente futuras
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="somenteHoje"
                            checked={filters.somenteHoje}
                            onChange={handleFilterChange}
                        />{" "}
                        Somente hoje
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="semInstrutor"
                            checked={filters.semInstrutor}
                            onChange={handleFilterChange}
                        />{" "}
                        Sem instrutor
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="comLaboratorio"
                            checked={filters.comLaboratorio}
                            onChange={handleFilterChange}
                        />{" "}
                        Com laboratório
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="comVpo"
                            checked={filters.comVpo}
                            onChange={handleFilterChange}
                        />{" "}
                        Com VPO
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="avaliacaoFinal"
                            checked={filters.avaliacaoFinal}
                            onChange={handleFilterChange}
                        />{" "}
                        Avaliação final
                    </label>
                </div>

                <div className="form-grid cronograma-filtros-extra">
                    <div className="form-group">
                        <label>Módulo</label>
                        <select name="modulo" value={filters.modulo} onChange={handleFilterChange}>
                            <option value="">Todos</option>
                            <option value="1">Módulo 1</option>
                            <option value="2">Módulo 2</option>
                            <option value="3">Módulo 3</option>
                            <option value="4">Módulo 4</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Disciplina</label>
                        <select
                            name="disciplinaId"
                            value={filters.disciplinaId}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todas</option>
                            {disciplinasDisponiveis.map((disciplina) => (
                                <option key={disciplina.id} value={disciplina.id}>
                                    {disciplina.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Data de corte para regeneração</label>
                        <input
                            type="date"
                            value={dataCorte}
                            onChange={(e) => setDataCorte(e.target.value)}
                        />
                    </div>
                </div>

                <div className="action-row">
                    <button
                        className="btn-primary"
                        type="button"
                        onClick={handleBuscar}
                        disabled={loading}
                    >
                        {loading ? "Buscando..." : "Buscar cronograma"}
                    </button>

                    {isAdmin && (
                        <button
                            className="btn-primary"
                            type="button"
                            onClick={handleGerar}
                            disabled={gerando}
                        >
                            {gerando ? "Gerando..." : "Gerar cronograma"}
                        </button>
                    )}

                    {canManage ? (
                        <button
                            className="btn-secondary"
                            type="button"
                            onClick={handleRegenerar}
                            disabled={regenerando}
                        >
                            {regenerando ? "Regenerando..." : "Regenerar a partir da data"}
                        </button>
                    ) : null}
                </div>

                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : null}
            </div>

            {turmaSelecionada ? (
                <div className="card">
                    <h3>Resumo da turma</h3>
                    <div className="cronograma-resumo-turma">
                        <div>
                            <strong>Turma:</strong> {turmaSelecionada.nome}
                        </div>
                        <div>
                            <strong>Turno:</strong> {getTurnoLabel(turmaSelecionada.turno)}
                        </div>
                        <div>
                            <strong>Tipo de horário:</strong>{" "}
                            {getTipoHorarioLabel(turmaSelecionada.tipoHorario)}
                        </div>
                        <div>
                            <strong>Horário semana:</strong> {resumoHorarioTurma?.semana || "-"}
                        </div>
                        <div>
                            <strong>Horário sábado:</strong> {resumoHorarioTurma?.sabado || "-"}
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="card">
                <h3>Aulas geradas</h3>

                {!cronograma.length ? (
                    <p>Nenhuma aula encontrada para os filtros aplicados.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Horário</th>
                                    <th>Disciplina</th>
                                    <th>Encontro</th>
                                    <th>Módulo</th>
                                    <th>Tipo</th>
                                    <th>Observações</th>
                                    <th>Instrutor efetivo</th>
                                    <th>Reservas</th>
                                    {canManage ? <th>Ações</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {cronograma.map((aula) => (
                                    <tr key={aula.id} className={getRowClass(aula)}>
                                        <td>{new Date(aula.data).toLocaleDateString("pt-BR")}</td>
                                        <td>{formatHorarioAula(aula)}</td>
                                        <td>{aula.turmaDisciplina?.disciplina?.nome || "-"}</td>
                                        <td>
                                            {aula.numeroEncontroDisciplina}/
                                            {aula.turmaDisciplina?.quantidadeEncontros}
                                        </td>
                                        <td>{aula.turmaDisciplina?.modulo ?? "-"}</td>
                                        <td>{aula.tipoAula}</td>
                                        <td>{aula.observacoes || "-"}</td>
                                        <td>{getInstrutorEfetivo(aula)}</td>
                                        <td>
                                            {aula.reservas?.length ? (
                                                aula.reservas
                                                    .filter((r) => r.status === "ativa")
                                                    .map((r) => `${r.tipo}: ${r.recursoNome}`)
                                                    .join(" | ")
                                            ) : (
                                                "Sem reserva"
                                            )}
                                        </td>

                                        {canManage ? (
                                            <td>
                                                <div className="cronograma-actions-column">
                                                    <select
                                                        value={aula.instrutorId || ""}
                                                        onChange={(e) =>
                                                            handleSetInstrutor(aula.id, e.target.value)
                                                        }
                                                    >
                                                        <option value="">
                                                            Usar padrão / sem instrutor
                                                        </option>
                                                        {instrutores.map((instrutor) => (
                                                            <option
                                                                key={instrutor.id}
                                                                value={instrutor.id}
                                                            >
                                                                {instrutor.nome}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <select
                                                        defaultValue=""
                                                        onChange={(e) => {
                                                            if (!e.target.value) return;
                                                            handleSetInstrutorAPartir(
                                                                aula,
                                                                e.target.value
                                                            );
                                                            e.target.value = "";
                                                        }}
                                                    >
                                                        <option value="">
                                                            Alterar a partir desta aula...
                                                        </option>
                                                        {instrutores.map((instrutor) => (
                                                            <option
                                                                key={instrutor.id}
                                                                value={instrutor.id}
                                                            >
                                                                {instrutor.nome}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <div className="table-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() =>
                                                                handleCriarReserva(aula, "laboratorio")
                                                            }
                                                        >
                                                            + Lab
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-table-success"
                                                            onClick={() =>
                                                                handleCriarReserva(aula, "VPO")
                                                            }
                                                        >
                                                            + VPO
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}