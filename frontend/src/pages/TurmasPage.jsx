import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
    nome: "",
    turno: "noite",
    cursoId: "",
    dataInicio: "",
    diasAula: [],
    datasPuladas: [],
    tipoHorario: "somente_semana",
    horarioSemanaInicio: "18:30",
    horarioSemanaFim: "22:30",
    horarioSabadoInicio: "",
    horarioSabadoFim: "",
    sabadoIntegral: false,
};

const diasSemanaOptions = [
    { value: "segunda", label: "Segunda" },
    { value: "terca", label: "Terça" },
    { value: "quarta", label: "Quarta" },
    { value: "quinta", label: "Quinta" },
    { value: "sexta", label: "Sexta" },
    { value: "sabado", label: "Sábado" },
];

function getTurnoLabel(turno) {
    if (turno === "manha") return "Manhã";
    if (turno === "tarde") return "Tarde";
    if (turno === "noite") return "Noite";
    if (turno === "sabado") return "Sábado";
    return turno;
}

function getTipoHorarioLabel(tipoHorario) {
    if (tipoHorario === "somente_semana") return "Somente semana";
    if (tipoHorario === "somente_sabado") return "Somente sábado";
    if (tipoHorario === "semana_e_sabado") return "Semana e sábado";
    return "-";
}

function formatDateInput(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDiasAula(value) {
    if (!Array.isArray(value) || !value.length) return "-";

    const labelMap = {
        segunda: "Segunda",
        terca: "Terça",
        quarta: "Quarta",
        quinta: "Quinta",
        sexta: "Sexta",
        sabado: "Sábado",
    };

    return value.map((dia) => labelMap[dia] || dia).join(", ");
}

function formatDatasPuladasPreview(value) {
    if (!Array.isArray(value) || !value.length) return "-";

    return value
        .map((data) => {
            const date = new Date(`${data}T00:00:00`);
            if (Number.isNaN(date.getTime())) return data;
            return date.toLocaleDateString("pt-BR");
        })
        .join(", ");
}

function formatDateToPtBr(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("pt-BR");
}

function getHorarioPadrao(turno, tipoHorario) {
    if (turno === "sabado" || tipoHorario === "somente_sabado") {
        return {
            horarioSemanaInicio: "",
            horarioSemanaFim: "",
            horarioSabadoInicio: "08:00",
            horarioSabadoFim: "17:00",
            sabadoIntegral: false,
            diasAula: ["sabado"],
            tipoHorario: "somente_sabado",
        };
    }

    if (turno === "manha") {
        return {
            horarioSemanaInicio: "08:00",
            horarioSemanaFim: "12:00",
            horarioSabadoInicio:
                tipoHorario === "semana_e_sabado" ? "08:00" : "",
            horarioSabadoFim:
                tipoHorario === "semana_e_sabado" ? "12:00" : "",
            sabadoIntegral: false,
        };
    }

    if (turno === "tarde") {
        return {
            horarioSemanaInicio: "14:00",
            horarioSemanaFim: "18:00",
            horarioSabadoInicio:
                tipoHorario === "semana_e_sabado" ? "13:00" : "",
            horarioSabadoFim:
                tipoHorario === "semana_e_sabado" ? "17:00" : "",
            sabadoIntegral: false,
        };
    }

    if (turno === "noite") {
        return {
            horarioSemanaInicio: "18:30",
            horarioSemanaFim: "22:30",
            horarioSabadoInicio:
                tipoHorario === "semana_e_sabado" ? "13:00" : "",
            horarioSabadoFim:
                tipoHorario === "semana_e_sabado" ? "17:00" : "",
            sabadoIntegral: false,
        };
    }

    return {
        horarioSemanaInicio: "",
        horarioSemanaFim: "",
        horarioSabadoInicio: "",
        horarioSabadoFim: "",
        sabadoIntegral: false,
    };
}

function formatHorarioSemana(turma) {
    if (!turma.horarioSemanaInicio || !turma.horarioSemanaFim) return "-";
    return `${turma.horarioSemanaInicio} às ${turma.horarioSemanaFim}`;
}

function formatHorarioSabado(turma) {
    if (!turma.horarioSabadoInicio || !turma.horarioSabadoFim) return "-";
    return `${turma.horarioSabadoInicio} às ${turma.horarioSabadoFim}`;
}

export default function TurmasPage() {
    const { user } = useAuth();

    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [statusFilter, setStatusFilter] = useState("todas");
    const [novaDataPulada, setNovaDataPulada] = useState("");

    const isAdmin = user?.role === "admin";

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [turmasData, cursosData] = await Promise.all([
                apiRequest("/turmas"),
                apiRequest("/cursos"),
            ]);

            setTurmas(turmasData);
            setCursos(cursosData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function applyHorarioAutomatico(novoTurno, novoTipoHorario) {
        const turnoFinal = novoTurno;
        const tipoHorarioFinal =
            novoTurno === "sabado" ? "somente_sabado" : novoTipoHorario;

        const horarioPadrao = getHorarioPadrao(turnoFinal, tipoHorarioFinal);

        setForm((prev) => {
            let novosDiasAula = [...prev.diasAula];

            if (turnoFinal === "sabado" || tipoHorarioFinal === "somente_sabado") {
                novosDiasAula = ["sabado"];
            } else if (tipoHorarioFinal === "somente_semana") {
                novosDiasAula = prev.diasAula.filter((dia) => dia !== "sabado");
            } else if (tipoHorarioFinal === "semana_e_sabado") {
                const diasSemDuplicacao = prev.diasAula.filter(
                    (dia, index, array) => array.indexOf(dia) === index
                );

                novosDiasAula = diasSemDuplicacao.includes("sabado")
                    ? diasSemDuplicacao
                    : [...diasSemDuplicacao, "sabado"];
            }

            return {
                ...prev,
                turno: turnoFinal,
                tipoHorario: horarioPadrao.tipoHorario || tipoHorarioFinal,
                horarioSemanaInicio: horarioPadrao.horarioSemanaInicio,
                horarioSemanaFim: horarioPadrao.horarioSemanaFim,
                horarioSabadoInicio: horarioPadrao.horarioSabadoInicio,
                horarioSabadoFim: horarioPadrao.horarioSabadoFim,
                sabadoIntegral: horarioPadrao.sabadoIntegral,
                diasAula: horarioPadrao.diasAula || novosDiasAula,
            };
        });
    }

    function handleTurnoChange(event) {
        const novoTurno = event.target.value;
        applyHorarioAutomatico(novoTurno, form.tipoHorario);
    }

    function handleTipoHorarioChange(event) {
        const novoTipoHorario = event.target.value;
        applyHorarioAutomatico(form.turno, novoTipoHorario);
    }

    function handleDiaAulaChange(event) {
        const { value, checked } = event.target;

        if (form.tipoHorario === "somente_sabado" || form.turno === "sabado") {
            return;
        }

        setForm((prev) => ({
            ...prev,
            diasAula: checked
                ? [...prev.diasAula, value]
                : prev.diasAula.filter((dia) => dia !== value),
        }));
    }

    function handleAddDataPulada() {
        if (!novaDataPulada) return;

        if (form.dataInicio && novaDataPulada < form.dataInicio) {
            setError("A data pulada não pode ser menor que a data de início da turma.");
            return;
        }

        if (form.datasPuladas.includes(novaDataPulada)) {
            setError("Essa data pulada já foi adicionada.");
            return;
        }

        setError("");

        setForm((prev) => ({
            ...prev,
            datasPuladas: [...prev.datasPuladas, novaDataPulada].sort(),
        }));

        setNovaDataPulada("");
    }

    function handleRemoveDataPulada(dataParaRemover) {
        setForm((prev) => ({
            ...prev,
            datasPuladas: prev.datasPuladas.filter((data) => data !== dataParaRemover),
        }));
    }

    function handleEdit(turma) {
        setEditingId(turma.id);
        setError("");
        setSuccess("");
        setNovaDataPulada("");

        setForm({
            nome: turma.nome || "",
            turno: turma.turno || "noite",
            cursoId: turma.cursoId ? String(turma.cursoId) : "",
            dataInicio: formatDateInput(turma.dataInicio),
            diasAula: Array.isArray(turma.diasAula) ? turma.diasAula : [],
            datasPuladas: Array.isArray(turma.datasPuladas) ? turma.datasPuladas : [],
            tipoHorario:
                turma.tipoHorario ||
                (() => {
                    const dias = Array.isArray(turma.diasAula) ? turma.diasAula : [];
                    const temSabado = dias.includes("sabado");
                    const temSemana = dias.some((dia) => dia !== "sabado");

                    if (temSabado && temSemana) return "semana_e_sabado";
                    if (temSabado) return "somente_sabado";
                    return "somente_semana";
                })(),
            horarioSemanaInicio: turma.horarioSemanaInicio || "",
            horarioSemanaFim: turma.horarioSemanaFim || "",
            horarioSabadoInicio: turma.horarioSabadoInicio || "",
            horarioSabadoFim: turma.horarioSabadoFim || "",
            sabadoIntegral: Boolean(turma.sabadoIntegral),
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCancelEdit() {
        setEditingId(null);
        setForm(initialForm);
        setError("");
        setSuccess("");
        setNovaDataPulada("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSending(true);
            setError("");
            setSuccess("");

            const payload = {
                nome: form.nome,
                turno: form.turno,
                cursoId: Number(form.cursoId),
                dataInicio: form.dataInicio,
                diasAula: form.diasAula,
                datasPuladas: form.datasPuladas,
                tipoHorario: form.tipoHorario,
                horarioSemanaInicio: form.horarioSemanaInicio || null,
                horarioSemanaFim: form.horarioSemanaFim || null,
                horarioSabadoInicio: form.horarioSabadoInicio || null,
                horarioSabadoFim: form.horarioSabadoFim || null,
                sabadoIntegral: form.sabadoIntegral,
            };

            if (editingId) {
                await apiRequest(`/turmas/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });

                setSuccess("Turma atualizada com sucesso.");
            } else {
                await apiRequest("/turmas", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                setSuccess("Turma cadastrada com sucesso.");
            }

            setForm(initialForm);
            setEditingId(null);
            setNovaDataPulada("");
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    async function handleToggleStatus(turma) {
        const acao = turma.ativo ? "inativar" : "ativar";
        const confirmar = window.confirm(
            `Deseja realmente ${acao} a turma "${turma.nome}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            await apiRequest(`/turmas/${turma.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    ativo: !turma.ativo,
                }),
            });

            setSuccess(
                turma.ativo
                    ? "Turma inativada com sucesso."
                    : "Turma ativada com sucesso."
            );

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(turma) {
        const confirmar = window.confirm(
            `Deseja realmente excluir a turma "${turma.nome}"?\n\nSe houver vínculos, ela será apenas inativada.`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            const response = await apiRequest(`/turmas/${turma.id}`, {
                method: "DELETE",
            });

            setSuccess(
                response.message ||
                (response.softDeleted
                    ? "Turma inativada com sucesso."
                    : "Turma excluída com sucesso.")
            );

            if (editingId === turma.id) {
                setEditingId(null);
                setForm(initialForm);
                setNovaDataPulada("");
            }

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    }

    const turmasFiltradas = useMemo(() => {
        if (statusFilter === "ativas") {
            return turmas.filter((turma) => turma.ativo);
        }

        if (statusFilter === "inativas") {
            return turmas.filter((turma) => !turma.ativo);
        }

        return turmas;
    }, [turmas, statusFilter]);

    return (
        <Layout title="Turmas" subtitle="Gestão de Turmas da Unidade">
            {isAdmin && (
                <div className="card">
                    <h3>{editingId ? "Editar turma" : "Nova turma"}</h3>

                    <form onSubmit={handleSubmit} className="user-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nome da turma</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    placeholder="Ex: RAD24-N"
                                />
                            </div>

                            <div className="form-group">
                                <label>Turno</label>
                                <select
                                    name="turno"
                                    value={form.turno}
                                    onChange={handleTurnoChange}
                                >
                                    <option value="manha">Manhã</option>
                                    <option value="tarde">Tarde</option>
                                    <option value="noite">Noite</option>
                                    <option value="sabado">Sábado</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Curso</label>
                                <select
                                    name="cursoId"
                                    value={form.cursoId}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecione um curso</option>
                                    {cursos.map((curso) => (
                                        <option key={curso.id} value={curso.id}>
                                            {curso.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Data de início</label>
                                <input
                                    type="date"
                                    name="dataInicio"
                                    value={form.dataInicio}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo de horário</label>
                                <select
                                    name="tipoHorario"
                                    value={form.tipoHorario}
                                    onChange={handleTipoHorarioChange}
                                    disabled={form.turno === "sabado"}
                                >
                                    <option value="somente_semana">Somente semana</option>
                                    <option value="semana_e_sabado">Semana e sábado</option>
                                    <option value="somente_sabado">Somente sábado</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Horário da semana</label>
                                <input
                                    type="text"
                                    value={
                                        form.horarioSemanaInicio && form.horarioSemanaFim
                                            ? `${form.horarioSemanaInicio} às ${form.horarioSemanaFim}`
                                            : "-"
                                    }
                                    disabled
                                />
                            </div>

                            <div className="form-group">
                                <label>Horário do sábado</label>
                                <input
                                    type="text"
                                    value={
                                        form.horarioSabadoInicio && form.horarioSabadoFim
                                            ? `${form.horarioSabadoInicio} às ${form.horarioSabadoFim}`
                                            : "-"
                                    }
                                    disabled
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Dias de aula</label>
                            <div className="checkbox-grid">
                                {diasSemanaOptions.map((dia) => (
                                    <label key={dia.value} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            value={dia.value}
                                            checked={form.diasAula.includes(dia.value)}
                                            onChange={handleDiaAulaChange}
                                            disabled={
                                                form.turno === "sabado" ||
                                                (form.tipoHorario === "somente_sabado" && dia.value !== "sabado") ||
                                                (form.tipoHorario === "somente_semana" && dia.value === "sabado")
                                            }
                                        />
                                        <span>{dia.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Datas puladas</label>

                            <div className="datas-puladas-input-row">
                                <input
                                    type="date"
                                    value={novaDataPulada}
                                    onChange={(event) => setNovaDataPulada(event.target.value)}
                                />

                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleAddDataPulada}
                                >
                                    Adicionar data
                                </button>
                            </div>

                            <small className="form-help">
                                Adicione as datas em que a turma não terá aula.
                            </small>

                            {form.datasPuladas.length ? (
                                <div className="datas-puladas-list">
                                    {form.datasPuladas.map((data) => (
                                        <div key={data} className="data-pulada-item">
                                            <span>{formatDateToPtBr(data)}</span>

                                            <button
                                                type="button"
                                                className="btn-remove-data"
                                                onClick={() => handleRemoveDataPulada(data)}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="datas-puladas-empty">
                                    Nenhuma data pulada adicionada.
                                </p>
                            )}
                        </div>

                        {error ? <p className="form-error">{error}</p> : null}
                        {success ? <p className="form-success">{success}</p> : null}

                        <div className="action-row">
                            <button type="submit" className="btn-primary" disabled={sending}>
                                {sending
                                    ? editingId
                                        ? "Salvando..."
                                        : "Cadastrando..."
                                    : editingId
                                        ? "Salvar alterações"
                                        : "Cadastrar turma"}
                            </button>

                            {editingId ? (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCancelEdit}
                                >
                                    Cancelar edição
                                </button>
                            ) : null}
                        </div>
                    </form>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h3>Turmas cadastradas</h3>

                    <div className="filtro-status">
                        <label htmlFor="statusFilter">Mostrar:</label>
                        <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="ativas">Apenas ativas</option>
                            <option value="inativas">Apenas inativas</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p>Carregando turmas...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Turma</th>
                                    <th>Turno</th>
                                    <th>Curso</th>
                                    <th>Tipo</th>
                                    <th>Semana</th>
                                    <th>Sábado</th>
                                    <th>Data início</th>
                                    <th>Dias de aula</th>
                                    <th>Datas puladas</th>
                                    <th>Status</th>
                                    {isAdmin ? <th>Ações</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {turmasFiltradas.length ? (
                                    turmasFiltradas.map((turma) => (
                                        <tr key={turma.id}>
                                            <td>{turma.id}</td>
                                            <td>{turma.nome}</td>
                                            <td>{getTurnoLabel(turma.turno)}</td>
                                            <td>{turma.curso?.nome || "-"}</td>
                                            <td>{getTipoHorarioLabel(turma.tipoHorario)}</td>
                                            <td>{formatHorarioSemana(turma)}</td>
                                            <td>{formatHorarioSabado(turma)}</td>
                                            <td>
                                                {turma.dataInicio
                                                    ? new Date(turma.dataInicio).toLocaleDateString("pt-BR")
                                                    : "-"}
                                            </td>
                                            <td>{formatDiasAula(turma.diasAula)}</td>
                                            <td>{formatDatasPuladasPreview(turma.datasPuladas)}</td>
                                            <td>{turma.ativo ? "Ativa" : "Inativa"}</td>

                                            {isAdmin ? (
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() => handleEdit(turma)}
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={
                                                                turma.ativo
                                                                    ? "btn-table-danger"
                                                                    : "btn-table-success"
                                                            }
                                                            onClick={() => handleToggleStatus(turma)}
                                                        >
                                                            {turma.ativo ? "Inativar" : "Ativar"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-table-danger"
                                                            onClick={() => handleDelete(turma)}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 12 : 11}>
                                            Nenhuma turma encontrada para o filtro selecionado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}