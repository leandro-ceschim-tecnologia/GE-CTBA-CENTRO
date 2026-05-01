import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

export default function EstagioGrupoPage() {
    const { grupoId } = useParams();
    const navigate = useNavigate();

    const [grupo, setGrupo] = useState(null);
    const [alunosDisponiveis, setAlunosDisponiveis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [success, setSuccess] = useState("");
    const [alunoId, setAlunoId] = useState("");

    useEffect(() => {
        loadPage();
    }, [grupoId]);

    async function loadPage() {
        setLoading(true);
        setErro("");
        setSuccess("");

        try {
            const grupoData = await apiRequest(`/estagios-enf/grupos/${grupoId}`);
            setGrupo(grupoData);

            if (grupoData?.blocoId) {
                const disponiveis = await apiRequest(
                    `/estagios-enf/blocos/${grupoData.blocoId}/alunos-disponiveis`
                );
                setAlunosDisponiveis(Array.isArray(disponiveis) ? disponiveis : []);
            } else {
                setAlunosDisponiveis([]);
            }
        } catch (error) {
            setErro(error.message || "Erro ao carregar grupo.");
            setGrupo(null);
            setAlunosDisponiveis([]);
        } finally {
            setLoading(false);
        }
    }

    const alunosDoGrupo = useMemo(() => {
        return grupo?.alunos || [];
    }, [grupo]);

    async function handleAdicionarAluno(event) {
        event.preventDefault();
        setSaving(true);
        setErro("");
        setSuccess("");

        try {
            if (!alunoId) {
                throw new Error("Selecione um aluno.");
            }

            await apiRequest(`/estagios-enf/grupos/${grupoId}/alunos`, {
                method: "POST",
                body: {
                    alunoId: Number(alunoId),
                },
            });

            setSuccess("Aluno adicionado ao grupo com sucesso.");
            setAlunoId("");
            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao adicionar aluno ao grupo.");
        } finally {
            setSaving(false);
        }
    }

    async function handleRemoverAluno(alunoIdParaRemover) {
        const confirmar = window.confirm("Deseja remover este aluno do grupo?");
        if (!confirmar) return;

        setErro("");
        setSuccess("");

        try {
            await apiRequest(
                `/estagios-enf/grupos/${grupoId}/alunos/${alunoIdParaRemover}`,
                {
                    method: "DELETE",
                }
            );

            setSuccess("Aluno removido do grupo com sucesso.");
            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao remover aluno do grupo.");
        }
    }

    return (
        <Layout
            title="Grupo de Estágio"
            subtitle="Gerencie os alunos vinculados ao grupo"
        >
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Detalhe do grupo</h2>
                        <p>Distribua os alunos da turma dentro deste grupo.</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                            grupo?.blocoId
                                ? navigate(`/estagios-enfermagem/blocos/${grupo.blocoId}`)
                                : navigate("/estagios-enfermagem")
                        }
                    >
                        Voltar ao bloco
                    </button>
                </div>

                {erro && <div className="alert alert-error">{erro}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading && <p>Carregando...</p>}

                {!loading && grupo && (
                    <>
                        <div className="info-grid">
                            <div className="info-card">
                                <strong>Grupo</strong>
                                <span>{grupo.nome || "-"}</span>
                            </div>

                            <div className="info-card">
                                <strong>Ordem</strong>
                                <span>{grupo.ordem ?? "-"}</span>
                            </div>

                            <div className="info-card">
                                <strong>Bloco</strong>
                                <span>
                                    {grupo.bloco?.numeroBloco
                                        ? `Bloco ${grupo.bloco.numeroBloco}`
                                        : "-"}
                                </span>
                            </div>

                            <div className="info-card">
                                <strong>Turma</strong>
                                <span>{grupo.bloco?.turma?.nome || "-"}</span>
                            </div>

                            <div className="info-card">
                                <strong>Curso</strong>
                                <span>{grupo.bloco?.curso?.nome || "-"}</span>
                            </div>

                            <div className="info-card">
                                <strong>Quantidade de alunos</strong>
                                <span>{alunosDoGrupo.length}</span>
                            </div>
                        </div>

                        {grupo.observacoes && (
                            <div className="info-card">
                                <strong>Observações</strong>
                                <span>{grupo.observacoes}</span>
                            </div>
                        )}

                        <div className="stage-detail-grid">
                            <section className="page-card nested-card">
                                <h3>Adicionar aluno ao grupo</h3>

                                <form className="form-grid" onSubmit={handleAdicionarAluno}>
                                    <div className="form-group form-group-full">
                                        <label htmlFor="alunoId">Aluno disponível</label>
                                        <select
                                            id="alunoId"
                                            name="alunoId"
                                            value={alunoId}
                                            onChange={(event) => setAlunoId(event.target.value)}
                                            disabled={saving}
                                        >
                                            <option value="">Selecione</option>
                                            {alunosDisponiveis.map((aluno) => (
                                                <option key={aluno.id} value={aluno.id}>
                                                    {aluno.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-actions form-group-full">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={saving}
                                        >
                                            {saving ? "Adicionando..." : "Adicionar aluno"}
                                        </button>
                                    </div>
                                </form>
                            </section>

                            <section className="page-card nested-card">
                                <h3>Alunos do grupo</h3>

                                <div className="table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>E-mail</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alunosDoGrupo.length ? (
                                                alunosDoGrupo.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{item.aluno?.nome || "-"}</td>
                                                        <td>{item.aluno?.email || "-"}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() =>
                                                                    handleRemoverAluno(item.alunoId)
                                                                }
                                                            >
                                                                Remover
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3">
                                                        Nenhum aluno vinculado a este grupo.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    </>
                )}
            </section>
        </Layout>
    );
}