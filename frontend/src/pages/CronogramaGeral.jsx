import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const initialFilters = {
    somenteFuturas: true,
    somenteHoje: false,
    cursoId: "",
    turmaId: "",
    modulo: "",
    disciplinaId: "",
    tipoReserva: "",
    recursoNome: "",
    semInstrutor: false,
    avaliacaoFinal: false,
    dataInicio: "",
    dataFim: "",
    busca: "",
};

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function formatDateBR(dateValue) {
    if (!dateValue) return "-";
    return new Date(dateValue).toLocaleDateString("pt-BR");
}

function formatHorarioAula(aula) {
    if (!aula?.horarioInicio || !aula?.horarioFim) return "-";
    return `${aula.horarioInicio} às ${aula.horarioFim}`;
}

function getInstrutorEfetivo(aula) {
    return (
        aula?.instrutor?.nome ||
        aula?.turmaDisciplina?.instrutorPadrao?.nome ||
        "Sem instrutor"
    );
}

function getReservasAtivas(aula) {
    return Array.isArray(aula?.reservas)
        ? aula.reservas.filter((reserva) => reserva.status === "ativa")
        : [];
}

function getReservaResumo(aula) {
    const reservas = getReservasAtivas(aula);

    if (!reservas.length) return "Sem reserva";

    return reservas
        .map((reserva) => {
            const tipoLabel =
                reserva.tipo === "laboratorio"
                    ? "LAB"
                    : String(reserva.tipo || "").toUpperCase();

            return `${tipoLabel}: ${reserva.recursoNome || "-"}`;
        })
        .join(" | ");
}

function getTipoReservaPrincipal(aula) {
    const reservas = getReservasAtivas(aula);

    if (!reservas.length) return "sem_reserva";
    if (reservas.some((r) => r.tipo === "laboratorio")) return "laboratorio";
    if (reservas.some((r) => String(r.tipo).toLowerCase() === "vpo")) return "vpo";
    return "outra";
}

function getRowClass(aula) {
    const reservas = getReservasAtivas(aula);
    const hasLab = reservas.some((reserva) => reserva.tipo === "laboratorio");
    const hasVpo = reservas.some(
        (reserva) => String(reserva.tipo).toLowerCase() === "vpo"
    );
    const semInstrutorEfetivo =
        !aula?.instrutorId && !aula?.turmaDisciplina?.instrutorPadraoId;

    if (aula?.tipoAula === "Avaliação Final") return "row-avaliacao-final";
    if (semInstrutorEfetivo) return "row-sem-instrutor";
    if (hasLab) return "row-com-laboratorio";
    if (hasVpo) return "row-com-vpo";

    return "";
}

function isMesmoDia(dataAula, dataComparacao) {
    if (!dataAula || !dataComparacao) return false;

    const aula = new Date(dataAula).toISOString().slice(0, 10);
    return aula === dataComparacao;
}

function getTipoExibicao(aula) {
    const reservas = getReservasAtivas(aula);

    const temLab = reservas.some((reserva) => reserva.tipo === "laboratorio");
    const temVpo = reservas.some(
        (reserva) => String(reserva.tipo).toLowerCase() === "vpo"
    );

    if (temLab) return "Laboratório";
    if (temVpo) return "VPO";

    return aula?.tipoAula || "-";
}

export default function CronogramaGeral() {
    const [turmas, setTurmas] = useState([]);
    const [cronogramaGeral, setCronogramaGeral] = useState([]);
    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(true);
    const [reloading, setReloading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadCronogramaGeral();
    }, []);

    async function loadCronogramaGeral() {
        try {
            setLoading(true);
            setError("");

            const turmasData = await apiRequest("/turmas");
            const turmasLista = Array.isArray(turmasData) ? turmasData : [];
            setTurmas(turmasLista);

            const resultados = await Promise.all(
                turmasLista.map(async (turma) => {
                    try {
                        const aulas = await apiRequest(
                            `/cronograma/turma/${turma.id}?somenteFuturas=false`
                        );

                        return (Array.isArray(aulas) ? aulas : []).map((aula) => ({
                            ...aula,
                            turmaRef: turma,
                        }));
                    } catch (err) {
                        return [];
                    }
                })
            );

            const consolidado = resultados
                .flat()
                .sort((a, b) => {
                    const dataA = new Date(a.data).getTime();
                    const dataB = new Date(b.data).getTime();

                    if (dataA !== dataB) return dataA - dataB;

                    const horaA = `${a.horarioInicio || ""}`.padEnd(5, "0");
                    const horaB = `${b.horarioInicio || ""}`.padEnd(5, "0");

                    return horaA.localeCompare(horaB);
                });

            setCronogramaGeral(consolidado);
        } catch (err) {
            setError(err.message || "Erro ao carregar cronograma geral.");
        } finally {
            setLoading(false);
            setReloading(false);
        }
    }

    function handleFilterChange(event) {
        const { name, value, type, checked } = event.target;

        setFilters((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleAtualizar() {
        setReloading(true);
        await loadCronogramaGeral();
    }

    const turmasMap = useMemo(() => {
        const map = new Map();

        turmas.forEach((turma) => {
            map.set(Number(turma.id), turma);
        });

        return map;
    }, [turmas]);

    const cursosDisponiveis = useMemo(() => {
        const map = new Map();

        turmas.forEach((turma) => {
            if (turma?.curso?.id) {
                map.set(turma.curso.id, turma.curso);
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            String(a.nome || "").localeCompare(String(b.nome || ""))
        );
    }, [turmas]);

    const disciplinasDisponiveis = useMemo(() => {
        const map = new Map();

        cronogramaGeral.forEach((aula) => {
            const disciplina = aula?.turmaDisciplina?.disciplina;
            if (disciplina?.id) {
                map.set(disciplina.id, disciplina);
            }
        });

        return Array.from(map.values()).sort((a, b) =>
            String(a.nome || "").localeCompare(String(b.nome || ""))
        );
    }, [cronogramaGeral]);

    const turmasDisponiveis = useMemo(() => {
        let lista = [...turmas];

        if (filters.cursoId) {
            lista = lista.filter(
                (turma) => String(turma?.curso?.id) === String(filters.cursoId)
            );
        }

        return lista.sort((a, b) =>
            String(a.nome || "").localeCompare(String(b.nome || ""))
        );
    }, [turmas, filters.cursoId]);

    const aulasFiltradas = useMemo(() => {
        const hoje = new Date().toISOString().slice(0, 10);

        return cronogramaGeral.filter((aula) => {
            const turmaIdResolvido =
                aula?.turma?.id || aula?.turmaRef?.id || aula?.turmaId || null;

            const turma =
                turmasMap.get(Number(turmaIdResolvido)) ||
                aula?.turma ||
                aula?.turmaRef ||
                null;

            const cursoId = turma?.curso?.id || "";
            const turmaId = turma?.id || "";
            const disciplinaId = aula?.turmaDisciplina?.disciplina?.id || "";
            const modulo = aula?.turmaDisciplina?.modulo ?? "";
            const instrutorEfetivo = getInstrutorEfetivo(aula);
            const reservaResumo = getReservaResumo(aula);
            const tipoReservaPrincipal = getTipoReservaPrincipal(aula);

            if (filters.somenteFuturas) {
                const dataAula = new Date(aula.data).toISOString().slice(0, 10);
                if (dataAula < hoje) return false;
            }

            if (filters.somenteHoje && !isMesmoDia(aula.data, hoje)) {
                return false;
            }

            if (filters.cursoId && String(cursoId) !== String(filters.cursoId)) {
                return false;
            }

            if (filters.turmaId && String(turmaId) !== String(filters.turmaId)) {
                return false;
            }

            if (filters.modulo && String(modulo) !== String(filters.modulo)) {
                return false;
            }

            if (
                filters.disciplinaId &&
                String(disciplinaId) !== String(filters.disciplinaId)
            ) {
                return false;
            }

            if (filters.semInstrutor) {
                const semInstrutorEfetivo =
                    !aula?.instrutorId && !aula?.turmaDisciplina?.instrutorPadraoId;
                if (!semInstrutorEfetivo) return false;
            }

            if (filters.avaliacaoFinal && aula?.tipoAula !== "Avaliação Final") {
                return false;
            }

            if (filters.tipoReserva) {
                if (filters.tipoReserva === "sem_reserva") {
                    if (tipoReservaPrincipal !== "sem_reserva") return false;
                } else if (tipoReservaPrincipal !== filters.tipoReserva) {
                    return false;
                }
            }

            if (filters.recursoNome) {
                const buscaRecurso = normalizarTexto(filters.recursoNome);
                if (!normalizarTexto(reservaResumo).includes(buscaRecurso)) {
                    return false;
                }
            }

            if (filters.dataInicio) {
                const dataAula = new Date(aula.data).toISOString().slice(0, 10);
                if (dataAula < filters.dataInicio) return false;
            }

            if (filters.dataFim) {
                const dataAula = new Date(aula.data).toISOString().slice(0, 10);
                if (dataAula > filters.dataFim) return false;
            }

            if (filters.busca) {
                const texto = normalizarTexto([
                    turma?.nome,
                    turma?.curso?.nome,
                    aula?.turmaDisciplina?.disciplina?.nome,
                    instrutorEfetivo,
                    aula?.observacoes,
                    reservaResumo,
                    aula?.tipoAula,
                ].join(" "));

                if (!texto.includes(normalizarTexto(filters.busca))) {
                    return false;
                }
            }

            return true;
        });
    }, [cronogramaGeral, filters, turmasMap]);

    const resumo = useMemo(() => {
        const turmasIds = new Set();
        const cursosIds = new Set();

        let totalLab = 0;
        let totalVpo = 0;
        let totalSemReserva = 0;

        aulasFiltradas.forEach((aula) => {
            const turmaIdResolvido =
                aula?.turma?.id || aula?.turmaRef?.id || aula?.turmaId || null;

            const turma =
                turmasMap.get(Number(turmaIdResolvido)) ||
                aula?.turma ||
                aula?.turmaRef ||
                null;

            const tipoReservaPrincipal = getTipoReservaPrincipal(aula);

            if (turma?.id) turmasIds.add(turma.id);
            if (turma?.curso?.id) cursosIds.add(turma.curso.id);

            if (tipoReservaPrincipal === "laboratorio") totalLab += 1;
            else if (tipoReservaPrincipal === "vpo") totalVpo += 1;
            else if (tipoReservaPrincipal === "sem_reserva") totalSemReserva += 1;
        });

        return {
            totalAulas: aulasFiltradas.length,
            totalTurmas: turmasIds.size,
            totalCursos: cursosIds.size,
            totalLab,
            totalVpo,
            totalSemReserva,
        };
    }, [aulasFiltradas, turmasMap]);

    return (
        <Layout
            title="Cronograma Geral"
            subtitle="Visão geral do cronograma de todas as turmas e cursos"
        >
            <div className="cronograma-geral-page">
                <div className="card">
                    <div className="action-row">
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleAtualizar}
                            disabled={reloading || loading}
                        >
                            {reloading ? "Atualizando..." : "Atualizar visão geral"}
                        </button>
                    </div>

                    {error ? <p className="form-error">{error}</p> : null}

                    <div className="form-grid">
                        <div className="form-group">
                            <label>Curso</label>
                            <select
                                name="cursoId"
                                value={filters.cursoId}
                                onChange={handleFilterChange}
                            >
                                <option value="">Todos os cursos</option>
                                {cursosDisponiveis.map((curso) => (
                                    <option key={curso.id} value={curso.id}>
                                        {curso.nome}
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
                            >
                                <option value="">Todas as turmas</option>
                                {turmasDisponiveis.map((turma) => (
                                    <option key={turma.id} value={turma.id}>
                                        {turma.nome} - {turma.curso?.nome || "-"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Módulo</label>
                            <select
                                name="modulo"
                                value={filters.modulo}
                                onChange={handleFilterChange}
                            >
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
                            <label>Tipo de reserva</label>
                            <select
                                name="tipoReserva"
                                value={filters.tipoReserva}
                                onChange={handleFilterChange}
                            >
                                <option value="">Todos</option>
                                <option value="laboratorio">Somente LAB</option>
                                <option value="vpo">Somente VPO</option>
                                <option value="sem_reserva">Sem reserva</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Nome do LAB / VPO</label>
                            <input
                                type="text"
                                name="recursoNome"
                                value={filters.recursoNome}
                                onChange={handleFilterChange}
                                placeholder="Ex.: Radiologia"
                            />
                        </div>

                        <div className="form-group">
                            <label>Data inicial</label>
                            <input
                                type="date"
                                name="dataInicio"
                                value={filters.dataInicio}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Data final</label>
                            <input
                                type="date"
                                name="dataFim"
                                value={filters.dataFim}
                                onChange={handleFilterChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Busca geral</label>
                            <input
                                type="text"
                                name="busca"
                                value={filters.busca}
                                onChange={handleFilterChange}
                                placeholder="Curso, turma, disciplina, instrutor..."
                            />
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
                                name="avaliacaoFinal"
                                checked={filters.avaliacaoFinal}
                                onChange={handleFilterChange}
                            />{" "}
                            Avaliação final
                        </label>
                    </div>
                </div>

                <div className="cronograma-summary-grid">
                    <div className="card">
                        <h3>Total de aulas</h3>
                        <strong>{resumo.totalAulas}</strong>
                    </div>

                    <div className="card">
                        <h3>Turmas exibidas</h3>
                        <strong>{resumo.totalTurmas}</strong>
                    </div>

                    <div className="card">
                        <h3>Cursos exibidos</h3>
                        <strong>{resumo.totalCursos}</strong>
                    </div>

                    <div className="card">
                        <h3>Aulas com LAB</h3>
                        <strong>{resumo.totalLab}</strong>
                    </div>

                    <div className="card">
                        <h3>Aulas com VPO</h3>
                        <strong>{resumo.totalVpo}</strong>
                    </div>

                    <div className="card">
                        <h3>Sem reserva</h3>
                        <strong>{resumo.totalSemReserva}</strong>
                    </div>
                </div>

                <div className="card">
                    <h3>Visão geral consolidada</h3>

                    {loading ? (
                        <p>Carregando cronograma geral...</p>
                    ) : !aulasFiltradas.length ? (
                        <p>Nenhuma aula encontrada para os filtros aplicados.</p>
                    ) : (
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Horário</th>
                                        <th>Curso</th>
                                        <th>Turma</th>
                                        <th>Disciplina</th>
                                        <th>Módulo</th>
                                        <th>Encontro</th>
                                        <th>Tipo</th>
                                        <th>Instrutor</th>
                                        <th>Reserva</th>
                                        <th>Observações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aulasFiltradas.map((aula) => {
                                        const turmaIdResolvido =
                                            aula?.turma?.id ||
                                            aula?.turmaRef?.id ||
                                            aula?.turmaId ||
                                            null;

                                        const turma =
                                            turmasMap.get(Number(turmaIdResolvido)) ||
                                            aula?.turma ||
                                            aula?.turmaRef ||
                                            null;

                                        return (
                                            <tr key={aula.id} className={getRowClass(aula)}>
                                                <td>{formatDateBR(aula.data)}</td>
                                                <td>{formatHorarioAula(aula)}</td>
                                                <td>{turma?.curso?.nome || "-"}</td>
                                                <td>{turma?.nome || "-"}</td>
                                                <td>{aula?.turmaDisciplina?.disciplina?.nome || "-"}</td>
                                                <td>{aula?.turmaDisciplina?.modulo ?? "-"}</td>
                                                <td>
                                                    {aula?.numeroEncontroDisciplina || "-"}
                                                    {aula?.turmaDisciplina?.quantidadeEncontros
                                                        ? `/${aula.turmaDisciplina.quantidadeEncontros}`
                                                        : ""}
                                                </td>
                                                <td>{getTipoExibicao(aula)}</td>
                                                <td>{getInstrutorEfetivo(aula)}</td>
                                                <td>{getReservaResumo(aula)}</td>
                                                <td>{aula?.observacoes || "-"}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}