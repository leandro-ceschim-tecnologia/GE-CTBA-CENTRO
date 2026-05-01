import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
    nome: "",
    capacidade: "",
    bloco: "",
    ordem: "0",
};

export default function SalasPage() {
    const { user } = useAuth();

    const [salas, setSalas] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [statusFilter, setStatusFilter] = useState("todas");
    const [busca, setBusca] = useState("");

    const canManage = [
        "admin",
        "pedagogico",
        "coordenacao",
        "coordsetor",
        "secretaria",
    ].includes(user?.role);

    useEffect(() => {
        loadSalas();
    }, []);

    async function loadSalas() {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest("/salas");
            setSalas(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar salas.");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function resetForm() {
        setForm(initialForm);
        setEditingId(null);
    }

    function handleEdit(sala) {
        setEditingId(sala.id);
        setError("");
        setSuccess("");

        setForm({
            nome: sala.nome || "",
            capacidade:
                sala.capacidade === null || sala.capacidade === undefined
                    ? ""
                    : String(sala.capacidade),
            bloco: sala.bloco || "",
            ordem:
                sala.ordem === null || sala.ordem === undefined
                    ? "0"
                    : String(sala.ordem),
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCancelEdit() {
        resetForm();
        setError("");
        setSuccess("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSending(true);
            setError("");
            setSuccess("");

            const payload = {
                nome: form.nome.trim(),
                capacidade:
                    form.capacidade === "" ? null : Number(form.capacidade),
                bloco: form.bloco.trim() || null,
                ordem: form.ordem === "" ? 0 : Number(form.ordem),
            };

            if (editingId) {
                await apiRequest(`/salas/${editingId}`, {
                    method: "PUT",
                    body: payload,
                });

                setSuccess("Sala atualizada com sucesso.");
            } else {
                await apiRequest("/salas", {
                    method: "POST",
                    body: payload,
                });

                setSuccess("Sala cadastrada com sucesso.");
            }

            resetForm();
            await loadSalas();
        } catch (err) {
            setError(err.message || "Erro ao salvar sala.");
        } finally {
            setSending(false);
        }
    }

    async function handleToggleStatus(sala) {
        const acao = sala.ativo ? "inativar" : "ativar";
        const confirmar = window.confirm(
            `Deseja realmente ${acao} a sala "${sala.nome}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            await apiRequest(`/salas/${sala.id}/status`, {
                method: "PATCH",
                body: {
                    ativo: !sala.ativo,
                },
            });

            setSuccess(
                sala.ativo
                    ? "Sala inativada com sucesso."
                    : "Sala ativada com sucesso."
            );

            await loadSalas();
        } catch (err) {
            setError(err.message || "Erro ao alterar status da sala.");
        }
    }

    async function handleDelete(sala) {
        const confirmar = window.confirm(
            `Deseja realmente excluir a sala "${sala.nome}"?\n\nSe houver vínculos, ela será apenas inativada.`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            const response = await apiRequest(`/salas/${sala.id}`, {
                method: "DELETE",
            });

            setSuccess(
                response.message ||
                (response.softDeleted
                    ? "Sala inativada com sucesso."
                    : "Sala excluída com sucesso.")
            );

            if (editingId === sala.id) {
                resetForm();
            }

            await loadSalas();
        } catch (err) {
            setError(err.message || "Erro ao excluir sala.");
        }
    }

    const salasFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return salas.filter((sala) => {
            const matchStatus =
                statusFilter === "todas" ||
                (statusFilter === "ativas" && sala.ativo) ||
                (statusFilter === "inativas" && !sala.ativo);

            const matchBusca =
                !termo ||
                sala.nome?.toLowerCase().includes(termo) ||
                sala.bloco?.toLowerCase().includes(termo) ||
                String(sala.capacidade || "").includes(termo);

            return matchStatus && matchBusca;
        });
    }, [salas, statusFilter, busca]);

    return (
        <Layout
            title="Salas"
            subtitle="Cadastre e gerencie as salas da unidade"
        >
            {canManage ? (
                <div className="page-card">
                    <div className="page-card-header">
                        <div>
                            <h3>{editingId ? "Editar sala" : "Nova sala"}</h3>
                            <p>
                                Cadastre as salas que poderão ser usadas no
                                ensalamento e nas ofertas acadêmicas.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="user-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nome da sala</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    placeholder="Ex: Sala 01"
                                />
                            </div>

                            <div className="form-group">
                                <label>Capacidade</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="capacidade"
                                    value={form.capacidade}
                                    onChange={handleChange}
                                    placeholder="Ex: 40"
                                />
                            </div>

                            <div className="form-group">
                                <label>Bloco</label>
                                <input
                                    type="text"
                                    name="bloco"
                                    value={form.bloco}
                                    onChange={handleChange}
                                    placeholder="Ex: Bloco A"
                                />
                            </div>

                            <div className="form-group">
                                <label>Ordem</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="ordem"
                                    value={form.ordem}
                                    onChange={handleChange}
                                    placeholder="Ex: 1"
                                />
                            </div>
                        </div>

                        {error ? <div className="alert alert-error">{error}</div> : null}
                        {success ? <div className="alert alert-success">{success}</div> : null}

                        <div className="action-row">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={sending}
                            >
                                {sending
                                    ? editingId
                                        ? "Salvando..."
                                        : "Cadastrando..."
                                    : editingId
                                        ? "Salvar alterações"
                                        : "Cadastrar sala"}
                            </button>

                            {editingId ? (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                >
                                    Cancelar edição
                                </button>
                            ) : null}
                        </div>
                    </form>
                </div>
            ) : null}

            <div className="page-card">
                <div className="page-card-header">
                    <div>
                        <h3>Salas cadastradas</h3>
                        <p>
                            Visualize e acompanhe as salas disponíveis para uso
                            na unidade.
                        </p>
                    </div>
                </div>

                <div className="filters-grid">
                    <div className="form-group">
                        <label>Buscar</label>
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Nome, bloco ou capacidade"
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="todas">Todas</option>
                            <option value="ativas">Apenas ativas</option>
                            <option value="inativas">Apenas inativas</option>
                        </select>
                    </div>
                </div>

                {!canManage && error ? (
                    <div className="alert alert-error">{error}</div>
                ) : null}

                {loading ? (
                    <div className="empty-state">Carregando salas...</div>
                ) : !salasFiltradas.length ? (
                    <div className="empty-state">
                        Nenhuma sala encontrada para o filtro selecionado.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Ordem</th>
                                    <th>Nome</th>
                                    <th>Capacidade</th>
                                    <th>Bloco</th>
                                    <th>Status</th>
                                    {canManage ? <th>Ações</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {salasFiltradas.map((sala) => (
                                    <tr key={sala.id}>
                                        <td>{sala.ordem ?? 0}</td>
                                        <td>
                                            <div className="table-primary-text">
                                                {sala.nome}
                                            </div>
                                        </td>
                                        <td>{sala.capacidade ?? "-"}</td>
                                        <td>{sala.bloco || "-"}</td>
                                        <td>
                                            <span
                                                className={
                                                    sala.ativo
                                                        ? "badge success"
                                                        : "badge neutral"
                                                }
                                            >
                                                {sala.ativo ? "Ativa" : "Inativa"}
                                            </span>
                                        </td>

                                        {canManage ? (
                                            <td>
                                                <div className="actions-wrap">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleEdit(sala)}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={
                                                            sala.ativo
                                                                ? "btn btn-warning btn-sm"
                                                                : "btn btn-success btn-sm"
                                                        }
                                                        onClick={() => handleToggleStatus(sala)}
                                                    >
                                                        {sala.ativo ? "Inativar" : "Ativar"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(sala)}
                                                    >
                                                        Excluir
                                                    </button>
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