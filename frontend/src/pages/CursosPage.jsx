import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function CursosPage() {
    const { user } = useAuth();

    const [cursos, setCursos] = useState([]);
    const [nome, setNome] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingId, setEditingId] = useState(null);

    const isAdmin = user?.role === "admin";

    async function loadCursos() {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest("/cursos");
            setCursos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCursos();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSending(true);
            setError("");
            setSuccess("");

            if (!nome.trim()) {
                setError("Informe o nome do curso.");
                return;
            }

            if (editingId) {
                await apiRequest(`/cursos/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify({ nome }),
                });

                setSuccess("Curso atualizado com sucesso.");
            } else {
                await apiRequest("/cursos", {
                    method: "POST",
                    body: JSON.stringify({ nome }),
                });

                setSuccess("Curso cadastrado com sucesso.");
            }

            setNome("");
            setEditingId(null);
            await loadCursos();
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    function handleEdit(curso) {
        setEditingId(curso.id);
        setNome(curso.nome);
        setError("");
        setSuccess("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCancelEdit() {
        setEditingId(null);
        setNome("");
        setError("");
        setSuccess("");
    }

    async function handleToggleStatus(curso) {
        const acao = curso.ativo ? "inativar" : "ativar";
        const confirmar = window.confirm(
            `Deseja realmente ${acao} o curso "${curso.nome}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            await apiRequest(`/cursos/${curso.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    ativo: !curso.ativo,
                }),
            });

            setSuccess(
                curso.ativo
                    ? "Curso inativado com sucesso."
                    : "Curso ativado com sucesso."
            );

            await loadCursos();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <Layout title="Cursos" subtitle="Gestão de Cursos da Unidade">
            {/* <div className="page-header">
                <h2>Cursos</h2>
                <p>Gestão de cursos da instituição.</p>
            </div> */}

            {isAdmin && (
                <div className="card">
                    <h3>{editingId ? "Editar curso" : "Novo curso"}</h3>

                    <form onSubmit={handleSubmit} className="user-form">
                        <div className="form-group">
                            <label>Nome do curso</label>
                            <input
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Radiologia"
                            />
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
                                        : "Cadastrar curso"}
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
                <h3>Lista de cursos</h3>

                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Status</th>
                                    {isAdmin ? <th>Ações</th> : null}
                                </tr>
                            </thead>

                            <tbody>
                                {cursos.length ? (
                                    cursos.map((curso) => (
                                        <tr key={curso.id}>
                                            <td>{curso.id}</td>
                                            <td>{curso.nome}</td>
                                            <td>{curso.ativo ? "Ativo" : "Inativo"}</td>
                                            {isAdmin ? (
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() => handleEdit(curso)}
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={
                                                                curso.ativo
                                                                    ? "btn-table-danger"
                                                                    : "btn-table-success"
                                                            }
                                                            onClick={() => handleToggleStatus(curso)}
                                                        >
                                                            {curso.ativo ? "Inativar" : "Ativar"}
                                                        </button>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? "4" : "3"}>
                                            Nenhum curso encontrado.
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