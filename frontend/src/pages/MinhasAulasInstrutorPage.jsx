import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const LABORATORIOS = [
    "Laboratório de Radiologia",
    "Laboratório de Enfermagem",
    "Laboratório de Massagem Profissional",
    "Laboratório de Corte e Costura",
    "Laboratório de Edificações",
    "Laboratório de Eletrotécnica",
    "Laboratório de Informática",
];

function getReservaLabel(aula) {
    const reservasAtivas = (aula.reservas || []).filter(
        (reserva) => reserva.status === "ativa"
    );

    if (!reservasAtivas.length) return "OK";

    const lab = reservasAtivas.find((r) => r.tipo === "laboratorio");
    if (lab) return `Laboratório: ${lab.recursoNome}`;

    const vpo = reservasAtivas.find((r) => r.tipo === "vpo");
    if (vpo) return `VPO: ${vpo.recursoNome}`;

    return "OK";
}

function getRowClass(aula) {
    if (aula.status === "cancelada") return "row-cancelada";
    if (aula.status === "realizada") return "row-realizada";
    if (aula.status === "ajustada") return "row-ajustada";
    if (aula.tipoAula === "Avaliação Final") return "row-avaliacao-final";
    if (!aula.instrutorEfetivo) return "row-sem-instrutor";

    const reservas = aula.reservas || [];
    if (reservas.some((r) => r.tipo === "laboratorio" && r.status === "ativa")) {
        return "row-com-laboratorio";
    }
    if (reservas.some((r) => r.tipo === "vpo" && r.status === "ativa")) {
        return "row-com-vpo";
    }

    return "";
}

function getDefaultTurno(turno) {
    return turno || "noite";
}

function getDefaultTimeByTurno(turno) {
    if (turno === "manha") {
        return { inicio: "08:00", fim: "12:00" };
    }
    if (turno === "tarde") {
        return { inicio: "13:00", fim: "17:00" };
    }
    return { inicio: "18:30", fim: "22:30" };
}

function formatDateToInput(dateValue) {
    if (!dateValue) return "";

    if (typeof dateValue === "string") {
        const somenteDataMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (somenteDataMatch) {
            return dateValue;
        }

        const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})T/);
        if (isoMatch) {
            return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
        }
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const dia = String(date.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function formatDateToBR(dateValue) {
    if (!dateValue) return "-";

    if (typeof dateValue === "string") {
        const somenteDataMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (somenteDataMatch) {
            const [, ano, mes, dia] = somenteDataMatch;
            return `${dia}/${mes}/${ano}`;
        }

        const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})T/);
        if (isoMatch) {
            const [, ano, mes, dia] = isoMatch;
            return `${dia}/${mes}/${ano}`;
        }
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("pt-BR");
}

export default function MinhasAulasInstrutorPage() {
    const [aulas, setAulas] = useState([]);
    const [somenteFuturas, setSomenteFuturas] = useState(true);
    const [turmaSelecionada, setTurmaSelecionada] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [ofertas, setOfertas] = useState([]);

    const [modalReserva, setModalReserva] = useState({
        aberto: false,
        tipo: null,
        aula: null,
    });

    const [modalCancelamento, setModalCancelamento] = useState({
        aberto: false,
        reserva: null,
    });

    const [formReserva, setFormReserva] = useState({
        recursoNome: "",
        data: "",
        turno: "noite",
        horarioInicio: "",
        horarioFim: "",
    });

    async function loadAulas() {
        const data = await apiRequest(
            `/minhas-aulas/instrutor?somenteFuturas=${somenteFuturas}`
        );

        setAulas(Array.isArray(data) ? data : []);
    }

    async function loadOfertasInstrutor() {
        try {
            const data = await apiRequest("/ofertas/minhas-ofertas/instrutor");
            setOfertas(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar ofertas do instrutor.");
        }
    }

    useEffect(() => {
        async function loadPage() {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                await Promise.all([loadAulas(), loadOfertasInstrutor()]);
            } catch (err) {
                setError(err.message || "Erro ao carregar dados do instrutor.");
            } finally {
                setLoading(false);
            }
        }

        loadPage();
    }, [somenteFuturas]);


    async function confirmarCancelamentoReserva() {
        const reserva = modalCancelamento.reserva;

        if (!reserva) return;

        try {
            setError("");
            setSuccess("");

            await apiRequest(`/reservas/${reserva.id}/status`, {
                method: "PATCH",
                body: {
                    status: "cancelada",
                },
            });

            setSuccess("Reserva cancelada com sucesso.");
            setModalCancelamento({
                aberto: false,
                reserva: null,
            });

            await loadAulas();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleCancelarReserva(reserva) {
        setModalCancelamento({
            aberto: true,
            reserva,
        });
    }

    function abrirModalReserva(tipo, aula) {
        const turno = getDefaultTurno(aula.turma?.turno);
        const horario = getDefaultTimeByTurno(turno);

        setFormReserva({
            recursoNome: tipo === "laboratorio" ? LABORATORIOS[0] : "VPO",
            data: formatDateToInput(aula.data),
            turno,
            horarioInicio: horario.inicio,
            horarioFim: horario.fim,
        });

        setModalReserva({
            aberto: true,
            tipo,
            aula,
        });
    }

    async function salvarReserva() {
        const { aula, tipo } = modalReserva;

        if (!aula || !tipo) return;

        try {
            setError("");
            setSuccess("");

            const observacoes =
                tipo === "vpo"
                    ? `A VPO acontecerá no dia ${formatDateToBR(formReserva.data)}, no período da ${formReserva.turno}, com horário de início ${formReserva.horarioInicio} e término ${formReserva.horarioFim}. Lembre-se que o uso do uniforme é obrigatório.`
                    : tipo === "laboratorio"
                        ? `A aula de laboratório ocorrerá no dia ${formatDateToBR(formReserva.data)}. Recomenda-se o cuidado com as regras de vestimenta e o não uso de adornos.`
                        : null;

            await apiRequest("/reservas", {
                method: "POST",
                body: {
                    cronogramaAulaId: aula.id,
                    tipo,
                    ...formReserva,
                    observacoes,
                },
            });

            setSuccess("Reserva criada com sucesso.");
            setModalReserva({ aberto: false, tipo: null, aula: null });

            await loadAulas();
        } catch (err) {
            setError(err.message);
        }
    }

    const turmasUnicas = [
        ...new Map(
            aulas
                .filter((aula) => aula.turma?.id)
                .map((aula) => [aula.turma.id, aula.turma])
        ).values(),
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    const aulasFiltradas = aulas.filter((aula) => {
        if (!turmaSelecionada) return true;
        return aula.turma?.id === Number(turmaSelecionada);
    });

    return (
        <Layout
            title="Minhas Aulas"
            subtitle="Agenda do instrutor com gestão de laboratório e VPO"
        >
            {/* <div className="page-header">
                <h2>Minhas Aulas</h2>
                <p>Visualização das aulas atribuídas ao instrutor e criação de reservas.</p>
            </div> */}

            <div className="card">
                <div className="aulas-filtros">
                    <label className="checkbox-item">
                        <input
                            type="checkbox"
                            checked={somenteFuturas}
                            onChange={(e) => setSomenteFuturas(e.target.checked)}
                        />
                        <span>Mostrar somente aulas futuras</span>
                    </label>

                    <div className="filtro-bloco">
                        <label htmlFor="filtroTurma">Filtrar por turma</label>
                        <select
                            id="filtroTurma"
                            className="form-select"
                            value={turmaSelecionada}
                            onChange={(e) => setTurmaSelecionada(e.target.value)}
                        >
                            <option value="">Todas as turmas</option>
                            {turmasUnicas.map((turma) => (
                                <option key={turma.id} value={turma.id}>
                                    {turma.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Aulas atribuídas</h3>

                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : null}

                {loading ? (
                    <p>Carregando aulas...</p>
                ) : aulasFiltradas.length ? (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Turma</th>
                                    <th>Curso</th>
                                    <th>Disciplina</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Reserva</th>
                                    <th>Observações</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aulasFiltradas.map((aula) => {
                                    const reservasAtivas = (aula.reservas || []).filter(
                                        (reserva) => reserva.status === "ativa"
                                    );

                                    const reservaPrincipal =
                                        reservasAtivas.find((r) => r.tipo === "laboratorio") ||
                                        reservasAtivas.find((r) => r.tipo === "vpo") ||
                                        null;

                                    return (
                                        <tr key={aula.id} className={getRowClass(aula)}>
                                            <td>{formatDateToBR(aula.data)}</td>
                                            <td>{aula.turma?.nome || "-"}</td>
                                            <td>{aula.turma?.curso?.nome || "-"}</td>
                                            <td>{aula.turmaDisciplina?.disciplina?.nome || "-"}</td>
                                            <td>{aula.tipoAula}</td>
                                            <td>{aula.status}</td>
                                            <td>
                                                <span className="aula-reserva-label">
                                                    {getReservaLabel(aula)}
                                                </span>
                                            </td>
                                            <td>
                                                {reservaPrincipal?.observacoes ? (
                                                    reservaPrincipal.observacoes
                                                ) : (
                                                    <span className="aula-observacoes-vazio">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="cronograma-actions-column">
                                                    <div className="table-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() =>
                                                                abrirModalReserva(
                                                                    "laboratorio",
                                                                    aula
                                                                )
                                                            }
                                                        >
                                                            Reservar Lab
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-table-success"
                                                            onClick={() =>
                                                                abrirModalReserva("vpo", aula)
                                                            }
                                                        >
                                                            Reservar VPO
                                                        </button>
                                                    </div>

                                                    {reservasAtivas.map((reserva) => (
                                                        <button
                                                            key={reserva.id}
                                                            type="button"
                                                            className="btn-table-danger"
                                                            onClick={() =>
                                                                handleCancelarReserva(reserva)
                                                            }
                                                        >
                                                            Cancelar {reserva.tipo}:{" "}
                                                            {reserva.recursoNome}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Nenhuma aula encontrada.</p>
                )}
            </div>

            <div className="card">
                <h3>Palestras / Workshops / Minicursos / Treinamentos / Minicursos</h3>

                {loading ? (
                    <p>Carregando ofertas...</p>
                ) : ofertas.length ? (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Tipo</th>
                                    <th>Data</th>
                                    <th>Horário</th>
                                    <th>Local</th>
                                    <th>Status</th>
                                    <th>Inscritos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ofertas.map((oferta) => (
                                    <tr key={oferta.id}>
                                        <td>{oferta.titulo}</td>
                                        <td>{oferta.tipo}</td>
                                        <td>{formatDateToBR(oferta.dataEvento)}</td>
                                        <td>
                                            {oferta.horaInicio && oferta.horaFim
                                                ? `${oferta.horaInicio} às ${oferta.horaFim}`
                                                : "-"}
                                        </td>
                                        <td>{oferta.local || "-"}</td>
                                        <td>{oferta.status}</td>
                                        <td>{oferta?._count?.inscricoes ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Nenhuma oferta acadêmica atribuída.</p>
                )}
            </div>

            {modalCancelamento.aberto && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Cancelar reserva</h3>

                        <p>
                            Deseja cancelar a reserva{" "}
                            <strong>
                                {modalCancelamento.reserva?.tipo}:{" "}
                                {modalCancelamento.reserva?.recursoNome}
                            </strong>
                            ?
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-table-edit"
                                onClick={() =>
                                    setModalCancelamento({
                                        aberto: false,
                                        reserva: null,
                                    })
                                }
                            >
                                Voltar
                            </button>

                            <button
                                type="button"
                                className="btn-table-danger"
                                onClick={confirmarCancelamentoReserva}
                            >
                                Confirmar cancelamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalReserva.aberto && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>
                            {modalReserva.tipo === "laboratorio"
                                ? "Reservar Laboratório"
                                : "Reservar VPO"}
                        </h3>

                        <div className="form-group">
                            <label>Recurso</label>

                            {modalReserva.tipo === "laboratorio" ? (
                                <select
                                    className="form-select"
                                    value={formReserva.recursoNome}
                                    onChange={(e) =>
                                        setFormReserva((prev) => ({
                                            ...prev,
                                            recursoNome: e.target.value,
                                        }))
                                    }
                                >
                                    {LABORATORIOS.map((lab) => (
                                        <option key={lab} value={lab}>
                                            {lab}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formReserva.recursoNome}
                                    onChange={(e) =>
                                        setFormReserva((prev) => ({
                                            ...prev,
                                            recursoNome: e.target.value,
                                        }))
                                    }
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label>Data</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formReserva.data}
                                onChange={(e) =>
                                    setFormReserva((prev) => ({
                                        ...prev,
                                        data: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label>Turno</label>
                            <select
                                className="form-select"
                                value={formReserva.turno}
                                onChange={(e) =>
                                    setFormReserva((prev) => ({
                                        ...prev,
                                        turno: e.target.value,
                                    }))
                                }
                            >
                                <option value="manha">Manhã</option>
                                <option value="tarde">Tarde</option>
                                <option value="noite">Noite</option>
                            </select>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Início</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formReserva.horarioInicio}
                                    onChange={(e) =>
                                        setFormReserva((prev) => ({
                                            ...prev,
                                            horarioInicio: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>Fim</label>
                                <input
                                    type="time"
                                    className="form-input"
                                    value={formReserva.horarioFim}
                                    onChange={(e) =>
                                        setFormReserva((prev) => ({
                                            ...prev,
                                            horarioFim: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-table-danger"
                                onClick={() =>
                                    setModalReserva({
                                        aberto: false,
                                        tipo: null,
                                        aula: null,
                                    })
                                }
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="btn-table-success"
                                onClick={salvarReserva}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}