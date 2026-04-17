import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
    nome: "",
    cursoId: "",
    quantidadeEncontros: "",
    modulo: "1",
    ordem: "",
};

export default function DisciplinasPage() {
    const { user } = useAuth();

    const [disciplinas, setDisciplinas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isAdmin = user?.role === "admin";

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [disciplinasData, cursosData] = await Promise.all([
                apiRequest("/disciplinas"),
                apiRequest("/cursos"),
            ]);

            setDisciplinas(disciplinasData);
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

    function handleEdit(disciplina) {
        setEditingId(disciplina.id);
        setError("");
        setSuccess("");

        setForm({
            nome: disciplina.nome || "",
            cursoId: disciplina.cursoId ? String(disciplina.cursoId) : "",
            quantidadeEncontros: disciplina.quantidadeEncontros
                ? String(disciplina.quantidadeEncontros)
                : "",
            modulo: disciplina.modulo ? String(disciplina.modulo) : "1",
            ordem: disciplina.ordem ? String(disciplina.ordem) : "",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCancelEdit() {
        setEditingId(null);
        setForm(initialForm);
        setError("");
        setSuccess("");
    }

    async function handleToggleStatus(disciplina) {
        const acao = disciplina.ativo ? "inativar" : "ativar";
        const confirmar = window.confirm(
            `Deseja realmente ${acao} a disciplina "${disciplina.nome}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            await apiRequest(`/disciplinas/${disciplina.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    ativo: !disciplina.ativo,
                }),
            });

            setSuccess(
                disciplina.ativo
                    ? "Disciplina inativada com sucesso."
                    : "Disciplina ativada com sucesso."
            );

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSending(true);
            setError("");
            setSuccess("");

            const payload = {
                nome: form.nome,
                cursoId: Number(form.cursoId),
                quantidadeEncontros: Number(form.quantidadeEncontros),
                modulo: Number(form.modulo),
                ordem: Number(form.ordem),
            };

            if (editingId) {
                await apiRequest(`/disciplinas/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });

                setSuccess("Disciplina atualizada com sucesso.");
            } else {
                await apiRequest("/disciplinas", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                setSuccess("Disciplina cadastrada com sucesso.");
            }

            setForm(initialForm);
            setEditingId(null);
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    return (
        <Layout title="Disciplinas" subtitle="Gestão de disciplinas vinculadas ao curso">
            {/* <div className="page-header">
                <h2>Disciplinas</h2>
                <p>Gestão de disciplinas vinculadas aos cursos.</p>
            </div> */}

            {isAdmin && (
                <div className="card">
                    <h3>{editingId ? "Editar disciplina" : "Nova disciplina"}</h3>

                    <form onSubmit={handleSubmit} className="user-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Nome da disciplina</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={form.nome}
                                    onChange={handleChange}
                                    placeholder="Ex: Radiobiologia"
                                />
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
                                <label>Quantidade de encontros</label>
                                <input
                                    type="number"
                                    name="quantidadeEncontros"
                                    value={form.quantidadeEncontros}
                                    onChange={handleChange}
                                    placeholder="Ex: 11"
                                />
                            </div>

                            <div className="form-group">
                                <label>Módulo</label>
                                <select
                                    name="modulo"
                                    value={form.modulo}
                                    onChange={handleChange}
                                >
                                    <option value="1">Módulo 1</option>
                                    <option value="2">Módulo 2</option>
                                    <option value="3">Módulo 3</option>
                                    <option value="4">Módulo 4</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Ordem</label>
                                <input
                                    type="number"
                                    name="ordem"
                                    value={form.ordem}
                                    onChange={handleChange}
                                    placeholder="Ex: 2"
                                />
                            </div>
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
                                        : "Cadastrar disciplina"}
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

            <div>
                <h3></h3>
            </div>

            <div className="card">
                <h3>Disciplinas cadastradas</h3>

                {loading ? (
                    <p>Carregando disciplinas...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Disciplina</th>
                                    <th>Curso</th>
                                    <th>Encontros</th>
                                    <th>Módulo</th>
                                    <th>Ordem</th>
                                    <th>Status</th>
                                    {isAdmin ? <th>Ações</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {disciplinas.length ? (
                                    disciplinas.map((disciplina) => (
                                        <tr key={disciplina.id}>
                                            <td>{disciplina.id}</td>
                                            <td>{disciplina.nome}</td>
                                            <td>{disciplina.curso?.nome || "-"}</td>
                                            <td>{disciplina.quantidadeEncontros}</td>
                                            <td>{disciplina.modulo}</td>
                                            <td>{disciplina.ordem}</td>
                                            <td>{disciplina.ativo ? "Ativa" : "Inativa"}</td>
                                            {isAdmin ? (
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() => handleEdit(disciplina)}
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={
                                                                disciplina.ativo
                                                                    ? "btn-table-danger"
                                                                    : "btn-table-success"
                                                            }
                                                            onClick={() => handleToggleStatus(disciplina)}
                                                        >
                                                            {disciplina.ativo ? "Inativar" : "Ativar"}
                                                        </button>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? "8" : "7"}>
                                            Nenhuma disciplina encontrada.
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