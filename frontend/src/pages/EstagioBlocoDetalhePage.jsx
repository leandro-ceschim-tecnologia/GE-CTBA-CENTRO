import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

export default function EstagioBlocoDetalhePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [bloco, setBloco] = useState(null);
    const [camposDisponiveis, setCamposDisponiveis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [success, setSuccess] = useState("");

    const [campoForm, setCampoForm] = useState({
        campoId: "",
        ordem: "",
        observacoes: "",
    });

    const [grupoForm, setGrupoForm] = useState({
        nome: "",
        ordem: "",
        fixo: false,
        observacoes: "",
    });

    const [savingCampo, setSavingCampo] = useState(false);
    const [savingGrupo, setSavingGrupo] = useState(false);
    const [processingRodizio, setProcessingRodizio] = useState(false);

    useEffect(() => {
        loadPage();
    }, [id]);

    async function loadPage() {
        setLoading(true);
        setErro("");

        try {
            const [blocoData, camposData] = await Promise.all([
                apiRequest(`/estagios-enf/blocos/${id}`),
                apiRequest("/estagios-enf/campos"),
            ]);

            setBloco(blocoData);
            setCamposDisponiveis(Array.isArray(camposData) ? camposData : []);
        } catch (error) {
            setErro(error.message || "Erro ao carregar detalhes do bloco.");
        } finally {
            setLoading(false);
        }
    }

    const camposJaVinculadosIds = useMemo(() => {
        return (bloco?.campos || []).map((item) => item.campoId);
    }, [bloco]);

    const camposDisponiveisParaAdicionar = useMemo(() => {
        return camposDisponiveis.filter(
            (campo) => !camposJaVinculadosIds.includes(campo.id)
        );
    }, [camposDisponiveis, camposJaVinculadosIds]);

    const rotacoesAgrupadas = useMemo(() => {
        const mapa = new Map();

        (bloco?.rotacoes || []).forEach((rotacao) => {
            const chave = String(rotacao.ordem);

            if (!mapa.has(chave)) {
                mapa.set(chave, {
                    ordem: rotacao.ordem,
                    dataInicio: rotacao.dataInicio,
                    dataFim: rotacao.dataFim,
                    itens: [],
                });
            }

            mapa.get(chave).itens.push(rotacao);
        });

        return Array.from(mapa.values()).sort((a, b) => a.ordem - b.ordem);
    }, [bloco]);

    function formatarData(data) {
        if (!data) return "-";
        return new Date(data).toLocaleDateString();
    }

    function handleCampoChange(event) {
        const { name, value } = event.target;
        setCampoForm((prev) => ({ ...prev, [name]: value }));
        setErro("");
        setSuccess("");
    }

    function handleGrupoChange(event) {
        const { name, value, type, checked } = event.target;
        setGrupoForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErro("");
        setSuccess("");
    }

    async function handleAddCampo(event) {
        event.preventDefault();
        setSavingCampo(true);
        setErro("");
        setSuccess("");

        try {
            if (!campoForm.campoId) {
                throw new Error("Selecione um campo de estágio.");
            }

            await apiRequest(`/estagios-enf/blocos/${id}/campos`, {
                method: "POST",
                body: {
                    campoId: Number(campoForm.campoId),
                    ordem: campoForm.ordem ? Number(campoForm.ordem) : null,
                    observacoes: campoForm.observacoes?.trim() || null,
                },
            });

            setSuccess("Campo adicionado ao bloco com sucesso.");
            setCampoForm({
                campoId: "",
                ordem: "",
                observacoes: "",
            });

            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao adicionar campo.");
        } finally {
            setSavingCampo(false);
        }
    }

    async function handleRemoveCampo(campoVinculoId) {
        const confirmar = window.confirm("Deseja remover este campo do bloco?");
        if (!confirmar) return;

        setErro("");
        setSuccess("");

        try {
            await apiRequest(`/estagios-enf/blocos/${id}/campos/${campoVinculoId}`, {
                method: "DELETE",
            });

            setSuccess("Campo removido com sucesso.");
            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao remover campo.");
        }
    }

    async function handleCreateGrupo(event) {
        event.preventDefault();
        setSavingGrupo(true);
        setErro("");
        setSuccess("");

        try {
            if (!grupoForm.nome.trim()) {
                throw new Error("Informe o nome do grupo.");
            }

            await apiRequest(`/estagios-enf/blocos/${id}/grupos`, {
                method: "POST",
                body: {
                    nome: grupoForm.nome.trim(),
                    ordem: grupoForm.ordem ? Number(grupoForm.ordem) : null,
                    fixo: grupoForm.fixo,
                    observacoes: grupoForm.observacoes?.trim() || null,
                },
            });

            setSuccess("Grupo criado com sucesso.");
            setGrupoForm({
                nome: "",
                ordem: "",
                fixo: false,
                observacoes: "",
            });

            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao criar grupo.");
        } finally {
            setSavingGrupo(false);
        }
    }

    async function handleDeleteGrupo(grupoId) {
        const confirmar = window.confirm("Deseja remover este grupo?");
        if (!confirmar) return;

        setErro("");
        setSuccess("");

        try {
            await apiRequest(`/estagios-enf/grupos/${grupoId}`, {
                method: "DELETE",
            });

            setSuccess("Grupo removido com sucesso.");
            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao remover grupo.");
        }
    }

    async function handleGerarRodizio() {
        const confirmar = window.confirm(
            "Deseja gerar o rodízio automático deste bloco? Rodízios existentes serão substituídos."
        );
        if (!confirmar) return;

        setProcessingRodizio(true);
        setErro("");
        setSuccess("");

        try {
            await apiRequest(`/estagios-enf/blocos/${id}/rotacoes/gerar-automatico`, {
                method: "POST",
            });

            setSuccess("Rodízio automático gerado com sucesso.");
            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao gerar rodízio automático.");
        } finally {
            setProcessingRodizio(false);
        }
    }

    async function handleLimparRodizio() {
        const confirmar = window.confirm(
            "Deseja remover todos os rodízios deste bloco?"
        );
        if (!confirmar) return;

        setProcessingRodizio(true);
        setErro("");
        setSuccess("");

        try {
            await apiRequest(`/estagios-enf/blocos/${id}/rotacoes`, {
                method: "DELETE",
            });

            setSuccess("Rodízios removidos com sucesso.");
            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao limpar rodízio.");
        } finally {
            setProcessingRodizio(false);
        }
    }

    return (
        <Layout
            title="Detalhe do Bloco de Estágio"
            subtitle="Configure campos, grupos e rodízio do bloco"
        >
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Detalhe do bloco</h2>
                        <p>Gerencie a estrutura operacional do bloco.</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/estagios-enfermagem")}
                    >
                        Voltar
                    </button>
                </div>

                {erro && <div className="alert alert-error">{erro}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {loading && <p>Carregando...</p>}

                {!loading && bloco && (
                    <>
                        <div className="info-grid">
                            <div className="info-card">
                                <strong>Turma</strong>
                                <span>{bloco.turma?.nome || "-"}</span>
                            </div>

                            <div className="info-card">
                                <strong>Curso</strong>
                                <span>{bloco.curso?.nome || "-"}</span>
                            </div>

                            <div className="info-card">
                                <strong>Bloco</strong>
                                <span>{bloco.numeroBloco}</span>
                            </div>

                            <div className="info-card">
                                <strong>Carga horária</strong>
                                <span>{bloco.cargaHorariaPrevista}h</span>
                            </div>

                            <div className="info-card">
                                <strong>Turno</strong>
                                <span>{bloco.turno || "-"}</span>
                            </div>

                            <div className="info-card">
                                <strong>Período</strong>
                                <span>
                                    {formatarData(bloco.dataInicio)} até {formatarData(bloco.dataFim)}
                                </span>
                            </div>
                        </div>

                        <div className="stage-detail-grid">
                            <section className="page-card nested-card">
                                <h3>Campos do bloco</h3>

                                <form className="form-grid" onSubmit={handleAddCampo}>
                                    <div className="form-group">
                                        <label htmlFor="campoId">Campo</label>
                                        <select
                                            id="campoId"
                                            name="campoId"
                                            value={campoForm.campoId}
                                            onChange={handleCampoChange}
                                            disabled={savingCampo}
                                        >
                                            <option value="">Selecione</option>
                                            {camposDisponiveisParaAdicionar.map((campo) => (
                                                <option key={campo.id} value={campo.id}>
                                                    {campo.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="ordemCampo">Ordem</label>
                                        <input
                                            id="ordemCampo"
                                            name="ordem"
                                            type="number"
                                            min="1"
                                            value={campoForm.ordem}
                                            onChange={handleCampoChange}
                                            disabled={savingCampo}
                                            placeholder="Ex.: 1"
                                        />
                                    </div>

                                    <div className="form-group form-group-full">
                                        <label htmlFor="observacoesCampo">Observações</label>
                                        <input
                                            id="observacoesCampo"
                                            name="observacoes"
                                            type="text"
                                            value={campoForm.observacoes}
                                            onChange={handleCampoChange}
                                            disabled={savingCampo}
                                            placeholder="Observações sobre o campo no bloco"
                                        />
                                    </div>

                                    <div className="form-actions form-group-full">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={savingCampo}
                                        >
                                            {savingCampo ? "Adicionando..." : "Adicionar campo"}
                                        </button>
                                    </div>
                                </form>

                                <div className="table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Ordem</th>
                                                <th>Campo</th>
                                                <th>Observações</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bloco.campos?.length ? (
                                                bloco.campos.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{item.ordem ?? "-"}</td>
                                                        <td>{item.campo?.nome || "-"}</td>
                                                        <td>{item.observacoes || "-"}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() =>
                                                                    handleRemoveCampo(item.id)
                                                                }
                                                            >
                                                                Remover
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4">
                                                        Nenhum campo vinculado ao bloco.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="page-card nested-card">
                                <h3>Grupos do bloco</h3>

                                <form className="form-grid" onSubmit={handleCreateGrupo}>
                                    <div className="form-group">
                                        <label htmlFor="nomeGrupo">Nome do grupo</label>
                                        <input
                                            id="nomeGrupo"
                                            name="nome"
                                            type="text"
                                            value={grupoForm.nome}
                                            onChange={handleGrupoChange}
                                            disabled={savingGrupo}
                                            placeholder="Ex.: Grupo A"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="ordemGrupo">Ordem</label>
                                        <input
                                            id="ordemGrupo"
                                            name="ordem"
                                            type="number"
                                            min="1"
                                            value={grupoForm.ordem}
                                            onChange={handleGrupoChange}
                                            disabled={savingGrupo}
                                            placeholder="Ex.: 1"
                                        />
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-inline" htmlFor="fixoGrupo">
                                            <input
                                                id="fixoGrupo"
                                                name="fixo"
                                                type="checkbox"
                                                checked={grupoForm.fixo}
                                                onChange={handleGrupoChange}
                                                disabled={savingGrupo}
                                            />
                                            Grupo fixo
                                        </label>
                                    </div>

                                    <div className="form-group form-group-full">
                                        <label htmlFor="observacoesGrupo">Observações</label>
                                        <input
                                            id="observacoesGrupo"
                                            name="observacoes"
                                            type="text"
                                            value={grupoForm.observacoes}
                                            onChange={handleGrupoChange}
                                            disabled={savingGrupo}
                                            placeholder="Observações sobre o grupo"
                                        />
                                    </div>

                                    <div className="form-actions form-group-full">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={savingGrupo}
                                        >
                                            {savingGrupo ? "Criando..." : "Criar grupo"}
                                        </button>
                                    </div>
                                </form>

                                <div className="group-list">
                                    {bloco.grupos?.length ? (
                                        bloco.grupos.map((grupo) => (
                                            <div key={grupo.id} className="group-card">
                                                <div className="group-card-header">
                                                    <div>
                                                        <strong>{grupo.nome}</strong>
                                                        <div className="group-meta">
                                                            Ordem: {grupo.ordem ?? "-"} · Alunos:{" "}
                                                            {grupo.alunos?.length ?? 0} ·{" "}
                                                            {grupo.fixo ? "Fixo" : "Rodízio"}
                                                        </div>
                                                    </div>

                                                    <div className="group-actions">
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/estagios-enfermagem/grupos/${grupo.id}`
                                                                )
                                                            }
                                                        >
                                                            Abrir grupo
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() =>
                                                                handleDeleteGrupo(grupo.id)
                                                            }
                                                        >
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>

                                                {grupo.observacoes && (
                                                    <div className="group-note">
                                                        {grupo.observacoes}
                                                    </div>
                                                )}

                                                <ul className="group-students">
                                                    {grupo.alunos?.length ? (
                                                        grupo.alunos.map((item) => (
                                                            <li key={item.id}>
                                                                {item.aluno?.nome || "-"}
                                                            </li>
                                                        ))
                                                    ) : (
                                                        <li>Nenhum aluno neste grupo.</li>
                                                    )}
                                                </ul>
                                            </div>
                                        ))
                                    ) : (
                                        <p>Nenhum grupo criado neste bloco.</p>
                                    )}
                                </div>
                            </section>
                        </div>

                        <section className="page-card nested-card">
                            <div className="page-header">
                                <div>
                                    <h3>Rodízio do bloco</h3>
                                    <p>
                                        Gere automaticamente e visualize a distribuição por etapa.
                                    </p>
                                </div>

                                <div className="group-actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleGerarRodizio}
                                        disabled={processingRodizio}
                                    >
                                        {processingRodizio
                                            ? "Processando..."
                                            : "Gerar rodízio automático"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        onClick={handleLimparRodizio}
                                        disabled={processingRodizio || !(bloco.rotacoes?.length)}
                                    >
                                        Limpar rodízio
                                    </button>
                                </div>
                            </div>

                            {rotacoesAgrupadas.length ? (
                                <div className="rodizio-list">
                                    {rotacoesAgrupadas.map((etapa) => (
                                        <div key={etapa.ordem} className="rodizio-card">
                                            <div className="rodizio-card-header">
                                                <strong>Etapa {etapa.ordem}</strong>
                                                <span>
                                                    {formatarData(etapa.dataInicio)} até{" "}
                                                    {formatarData(etapa.dataFim)}
                                                </span>
                                            </div>

                                            <div className="table-responsive">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Grupo</th>
                                                            <th>Campo</th>
                                                            <th>Tipo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {etapa.itens.map((item) => (
                                                            <tr key={item.id}>
                                                                <td>{item.grupo?.nome || "-"}</td>
                                                                <td>{item.campo?.nome || "-"}</td>
                                                                <td>
                                                                    {item.fixo
                                                                        ? "Fixo"
                                                                        : "Rodízio"}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Nenhum rodízio gerado para este bloco.</p>
                            )}
                        </section>
                    </>
                )}
            </section>
        </Layout>
    );
}