import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const initialForm = {
    tipo: "DECLARACAO",
    templateKey: "",
    userId: "",
    titulo: "",
    assunto: "",
    observacoes: "",
    nomeSolicitante: "",
    cpfSolicitante: "",
    matriculaSolicitante: "",
    fone1Solicitante: "",
    fone2Solicitante: "",
    cursoSolicitante: "",
    turmaSolicitante: "",
    destinatarioNome: "",
    destinatarioCargo: "",
    destinatarioOrgao: "",
    variaveisJson: "",
};

function getTipoDocumentoLabel(tipo) {
    const labels = {
        DECLARACAO: "Declaração",
        OFICIO: "Ofício",
        REQUERIMENTO: "Requerimento",
    };

    return labels[tipo] || tipo;
}

function formatCpfInput(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

    return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhoneInput(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatDate(value) {
    if (!value) return "-";

    try {
        return new Date(value).toLocaleDateString("pt-BR");
    } catch {
        return "-";
    }
}

function getCanceladoLabel(cancelado) {
    return cancelado ? "Cancelado" : "Ativo";
}

export default function DocumentosPage() {
    const [users, setUsers] = useState([]);
    const [documentos, setDocumentos] = useState([]);
    const [form, setForm] = useState(initialForm);

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [processingId, setProcessingId] = useState(null);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [filtroTipo, setFiltroTipo] = useState("");
    const [filtroCancelado, setFiltroCancelado] = useState("");

    const [documentoVisualizando, setDocumentoVisualizando] = useState(null);

    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    const usuarioSelecionado = useMemo(() => {
        if (!form.userId) return null;
        return users.find((item) => item.id === Number(form.userId)) || null;
    }, [form.userId, users]);

    const templatesDoTipo = useMemo(() => {
        return templates.filter((item) => item.tipo === form.tipo);
    }, [templates, form.tipo]);

    const exigeDestinatario = form.tipo === "OFICIO";
    const exibeCamposSolicitante =
        form.tipo === "DECLARACAO" || form.tipo === "REQUERIMENTO";

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setDocumentoVisualizando(null);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (filtroTipo) {
                params.set("tipo", filtroTipo);
            }

            if (filtroCancelado) {
                params.set("cancelado", filtroCancelado);
            }

            const queryString = params.toString();
            const documentosPath = queryString
                ? `/documentos?${queryString}`
                : "/documentos";

            const [usersData, documentosData] = await Promise.all([
                apiRequest("/users"),
                apiRequest(documentosPath),
            ]);

            setUsers(Array.isArray(usersData) ? usersData : []);
            setDocumentos(Array.isArray(documentosData) ? documentosData : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar documentos.");
        } finally {
            setLoading(false);
        }
    }

    async function loadTemplates(tipoSelecionado) {
        try {
            setTemplatesLoading(true);

            const query = tipoSelecionado
                ? `/documentos/templates?tipo=${encodeURIComponent(tipoSelecionado)}`
                : "/documentos/templates";

            const data = await apiRequest(query);
            setTemplates(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro ao carregar templates:", error);
            setTemplates([]);
        } finally {
            setTemplatesLoading(false);
        }
    }

    useEffect(() => {
        loadTemplates(form.tipo);
    }, []);

    useEffect(() => {
        loadData();
    }, [filtroTipo, filtroCancelado]);

    useEffect(() => {
        if (!usuarioSelecionado) return;

        setForm((prev) => ({
            ...prev,
            nomeSolicitante: prev.nomeSolicitante || usuarioSelecionado.nome || "",
            cpfSolicitante:
                prev.cpfSolicitante ||
                formatCpfInput(usuarioSelecionado.cpf || ""),
            matriculaSolicitante:
                prev.matriculaSolicitante || usuarioSelecionado.matricula || "",
            fone1Solicitante:
                prev.fone1Solicitante ||
                formatPhoneInput(usuarioSelecionado.fone1 || ""),
            fone2Solicitante:
                prev.fone2Solicitante ||
                formatPhoneInput(usuarioSelecionado.fone2 || ""),
            cursoSolicitante:
                prev.cursoSolicitante ||
                usuarioSelecionado.turma?.curso?.nome ||
                "",
            turmaSolicitante:
                prev.turmaSolicitante ||
                usuarioSelecionado.turma?.nome ||
                "",
        }));
    }, [usuarioSelecionado]);

    function resetForm() {
        setForm(initialForm);
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => {
            const next = {
                ...prev,
                [name]: value,
            };

            /**
             * Quando trocar o tipo:
             * - limpamos o templateKey
             * - depois carregamos os modelos do novo tipo
             */
            if (name === "tipo") {
                next.templateKey = "";
            }

            return next;
        });

        if (name === "tipo") {
            loadTemplates(value);
        }
    }

    function handleSelectUser(event) {
        const value = event.target.value;

        if (!value) {
            setForm((prev) => ({
                ...prev,
                userId: "",
            }));
            return;
        }

        setForm((prev) => ({
            ...prev,
            userId: value,
            nomeSolicitante: "",
            cpfSolicitante: "",
            matriculaSolicitante: "",
            fone1Solicitante: "",
            fone2Solicitante: "",
            cursoSolicitante: "",
            turmaSolicitante: "",
        }));
    }

    function parseVariaveisJson() {
        const raw = form.variaveisJson.trim();

        if (!raw) return {};

        try {
            const parsed = JSON.parse(raw);

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed;
            }

            throw new Error("As variáveis extras devem ser um objeto JSON.");
        } catch (err) {
            throw new Error(
                err.message || "JSON inválido no campo de variáveis extras."
            );
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSending(true);
            setError("");
            setSuccess("");

            const variaveis = parseVariaveisJson();

            const payload = {
                tipo: form.tipo,

                templateKey: form.templateKey || null,

                userId: form.userId ? Number(form.userId) : null,
                titulo: form.titulo,
                assunto: form.assunto || null,
                observacoes: form.observacoes || null,

                nomeSolicitante: form.nomeSolicitante || null,
                cpfSolicitante: form.cpfSolicitante || null,
                matriculaSolicitante: form.matriculaSolicitante || null,
                fone1Solicitante: form.fone1Solicitante || null,
                fone2Solicitante: form.fone2Solicitante || null,
                cursoSolicitante: form.cursoSolicitante || null,
                turmaSolicitante: form.turmaSolicitante || null,

                destinatarioNome: form.destinatarioNome || null,
                destinatarioCargo: form.destinatarioCargo || null,
                destinatarioOrgao: form.destinatarioOrgao || null,

                variaveis,
            };

            await apiRequest("/documentos", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setSuccess("Documento emitido com sucesso.");
            resetForm();
            await loadData();
        } catch (err) {
            setError(err.message || "Erro ao emitir documento.");
        } finally {
            setSending(false);
        }
    }

    async function handleRegenerar(documento) {
        const confirmar = window.confirm(
            `Deseja regenerar o documento "${documento.titulo}"?`
        );

        if (!confirmar) return;

        try {
            setProcessingId(documento.id);
            setError("");
            setSuccess("");

            await apiRequest(`/documentos/${documento.id}/regenerar`, {
                method: "POST",
            });

            setSuccess("Documento regenerado com sucesso.");
            await loadData();
        } catch (err) {
            setError(err.message || "Erro ao regenerar documento.");
        } finally {
            setProcessingId(null);
        }
    }

    async function handleCancelar(documento) {
        if (documento.cancelado) return;

        const confirmar = window.confirm(
            `Deseja realmente cancelar o documento "${documento.titulo}"?`
        );

        if (!confirmar) return;

        try {
            setProcessingId(documento.id);
            setError("");
            setSuccess("");

            await apiRequest(`/documentos/${documento.id}/cancelar`, {
                method: "PATCH",
            });

            setSuccess("Documento cancelado com sucesso.");
            await loadData();
        } catch (err) {
            setError(err.message || "Erro ao cancelar documento.");
        } finally {
            setProcessingId(null);
        }
    }

    async function handleDownload(documento) {
        try {
            setProcessingId(documento.id);
            setError("");
            setSuccess("");

            const result = await apiRequest(`/documentos/${documento.id}/download`);

            const backendBaseUrl =
                import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ||
                "http://localhost:3000";

            if (result?.documentoUrl) {
                const fileUrl = result.documentoUrl.startsWith("http")
                    ? result.documentoUrl
                    : `${backendBaseUrl}${result.documentoUrl}`;

                window.open(fileUrl, "_blank");
                return;
            }

            if (result?.documentoDocxUrl) {
                const fileUrl = result.documentoDocxUrl.startsWith("http")
                    ? result.documentoDocxUrl
                    : `${backendBaseUrl}${result.documentoDocxUrl}`;

                window.open(fileUrl, "_blank");
                return;
            }

            setError("Nenhum arquivo disponível para download.");
        } catch (err) {
            setError(err.message || "Erro ao obter download do documento.");
        } finally {
            setProcessingId(null);
        }
    }

    function handleVisualizar(documento) {
        setDocumentoVisualizando(documento);
    }

    function fecharModalDocumento() {
        setDocumentoVisualizando(null);
    }

    return (
        <Layout
            title="Documentos Oficiais"
            subtitle="Emissão de declarações, ofícios e requerimentos"
        >
            {/*             <div className="page-header">
                <h2>Documentos Oficiais</h2>
                <p>
                    Emita, regenere, cancele e acompanhe declarações, ofícios e
                    requerimentos.
                </p>
            </div>
 */}
            <div className="card">
                <h3>Novo documento</h3>

                <form onSubmit={handleSubmit} className="user-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Tipo</label>
                            <select
                                name="tipo"
                                value={form.tipo}
                                onChange={handleChange}
                            >
                                <option value="DECLARACAO">Declaração</option>
                                <option value="OFICIO">Ofício</option>
                                <option value="REQUERIMENTO">Requerimento</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Modelo / template</label>
                            <select
                                name="templateKey"
                                value={form.templateKey}
                                onChange={handleChange}
                                disabled={templatesLoading}
                            >
                                <option value="">
                                    {templatesLoading ? "Carregando modelos..." : "Usar modelo padrão do tipo"}
                                </option>

                                {templatesDoTipo.map((item) => (
                                    <option key={item.key} value={item.key}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>

                            <small style={{ color: "#666" }}>
                                Se nenhum modelo for escolhido, o sistema usará o padrão do tipo selecionado.
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Ao usuário</label>
                            <select
                                name="userId"
                                value={form.userId}
                                onChange={handleSelectUser}
                            >
                                <option value="">Não vincular</option>
                                {users.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nome} - {item.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                name="titulo"
                                value={form.titulo}
                                onChange={handleChange}
                                placeholder="Digite o título do documento"
                            />
                        </div>

                        <div className="form-group">
                            <label>Assunto</label>
                            <input
                                type="text"
                                name="assunto"
                                value={form.assunto}
                                onChange={handleChange}
                                placeholder="Digite o assunto"
                            />
                        </div>

                        {exibeCamposSolicitante ? (
                            <>
                                <div className="form-group">
                                    <label>Solicitante</label>
                                    <input
                                        type="text"
                                        name="nomeSolicitante"
                                        value={form.nomeSolicitante}
                                        onChange={handleChange}
                                        placeholder="Nome completo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>CPF</label>
                                    <input
                                        type="text"
                                        name="cpfSolicitante"
                                        value={form.cpfSolicitante}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                cpfSolicitante: formatCpfInput(
                                                    e.target.value
                                                ),
                                            }))
                                        }
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Matrícula</label>
                                    <input
                                        type="text"
                                        name="matriculaSolicitante"
                                        value={form.matriculaSolicitante}
                                        onChange={handleChange}
                                        placeholder="Matrícula"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Fone 1</label>
                                    <input
                                        type="text"
                                        name="fone1Solicitante"
                                        value={form.fone1Solicitante}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                fone1Solicitante: formatPhoneInput(
                                                    e.target.value
                                                ),
                                            }))
                                        }
                                        placeholder="(41) 99999-9999"
                                        maxLength={15}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Fone 2</label>
                                    <input
                                        type="text"
                                        name="fone2Solicitante"
                                        value={form.fone2Solicitante}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                fone2Solicitante: formatPhoneInput(
                                                    e.target.value
                                                ),
                                            }))
                                        }
                                        placeholder="(41) 99999-9999"
                                        maxLength={15}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Curso</label>
                                    <input
                                        type="text"
                                        name="cursoSolicitante"
                                        value={form.cursoSolicitante}
                                        onChange={handleChange}
                                        placeholder="Curso do solicitante"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Turma</label>
                                    <input
                                        type="text"
                                        name="turmaSolicitante"
                                        value={form.turmaSolicitante}
                                        onChange={handleChange}
                                        placeholder="Turma do solicitante"
                                    />
                                </div>
                            </>
                        ) : null}

                        {exigeDestinatario ? (
                            <>
                                <div className="form-group">
                                    <label>Destinatário</label>
                                    <input
                                        type="text"
                                        name="destinatarioNome"
                                        value={form.destinatarioNome}
                                        onChange={handleChange}
                                        placeholder="Nome do destinatário"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input
                                        type="text"
                                        name="destinatarioCargo"
                                        value={form.destinatarioCargo}
                                        onChange={handleChange}
                                        placeholder="Cargo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Órgão / instituição</label>
                                    <input
                                        type="text"
                                        name="destinatarioOrgao"
                                        value={form.destinatarioOrgao}
                                        onChange={handleChange}
                                        placeholder="Órgão ou instituição"
                                    />
                                </div>
                            </>
                        ) : null}

                        <div className="form-group form-group-full">
                            <label>Observações</label>
                            <textarea
                                name="observacoes"
                                value={form.observacoes}
                                onChange={handleChange}
                                placeholder="Observações do documento"
                                rows={4}
                            />
                        </div>

                        <div className="form-group form-group-full">
                            <label>Variáveis extras em JSON</label>
                            <textarea
                                name="variaveisJson"
                                value={form.variaveisJson}
                                onChange={handleChange}
                                placeholder={'Ex.: {"CAMPO_EXTRA":"Valor","SETOR":"Secretaria"}'}
                                rows={5}
                            />
                            <small style={{ color: "#666" }}>
                                Use apenas se o template possuir placeholders extras.
                            </small>
                        </div>
                    </div>

                    {error ? <p className="form-error">{error}</p> : null}
                    {success ? <p className="form-success">{success}</p> : null}

                    <div className="action-row">
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={sending}
                        >
                            {sending ? "Emitindo..." : "Emitir documento"}
                        </button>

                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={resetForm}
                            disabled={sending}
                        >
                            Limpar formulário
                        </button>
                    </div>
                </form>
            </div>

            <div className="card">
                <div
                    className="page-header"
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "end",
                        gap: "16px",
                        flexWrap: "wrap",
                        marginBottom: "16px",
                    }}
                >
                    <div>
                        <h3 style={{ marginBottom: 4 }}>Documentos emitidos</h3>
                        <p style={{ margin: 0 }}>
                            Consulte, regenere, cancele e baixe documentos emitidos.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "12px",
                            minWidth: "320px",
                            flex: 1,
                            maxWidth: "520px",
                        }}
                    >
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Filtrar por tipo</label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="DECLARACAO">Declaração</option>
                                <option value="OFICIO">Ofício</option>
                                <option value="REQUERIMENTO">Requerimento</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label>Filtrar por status</label>
                            <select
                                value={filtroCancelado}
                                onChange={(e) => setFiltroCancelado(e.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="false">Ativos</option>
                                <option value="true">Cancelados</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p>Carregando documentos...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Tipo</th>
                                    <th>Título</th>
                                    <th>Solicitante</th>
                                    <th>Assunto</th>
                                    <th>Data</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documentos.length ? (
                                    documentos.map((item) => {
                                        const isProcessing = processingId === item.id;

                                        return (
                                            <tr key={item.id}>
                                                <td>{item.codigoDocumento || "-"}</td>
                                                <td>{getTipoDocumentoLabel(item.tipo)}</td>
                                                <td>{item.titulo || "-"}</td>
                                                <td>{item.nomeSolicitante || "-"}</td>
                                                <td>{item.assunto || "-"}</td>
                                                <td>{formatDate(item.emitidoEm || item.createdAt)}</td>
                                                <td>{getCanceladoLabel(item.cancelado)}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() => handleVisualizar(item)}
                                                        >
                                                            Ver
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() => handleDownload(item)}
                                                            disabled={isProcessing}
                                                        >
                                                            {isProcessing ? "Aguarde..." : "Baixar"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-table-success"
                                                            onClick={() => handleRegenerar(item)}
                                                            disabled={isProcessing || item.cancelado}
                                                        >
                                                            Regenerar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn-table-danger"
                                                            onClick={() => handleCancelar(item)}
                                                            disabled={isProcessing || item.cancelado}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8">Nenhum documento encontrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {documentoVisualizando ? (
                <div
                    className="documento-modal-overlay"
                    onClick={fecharModalDocumento}
                >
                    <div
                        className="documento-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="documento-modal-header">
                            <div>
                                <h3>Detalhes do documento</h3>
                                <p>
                                    Visualize as informações completas do documento emitido.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="documento-modal-close"
                                onClick={fecharModalDocumento}
                            >
                                ×
                            </button>
                        </div>

                        <div className="documento-modal-body">
                            <div className="documento-modal-grid">
                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Código</span>
                                    <strong>{documentoVisualizando.codigoDocumento || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Tipo</span>
                                    <strong>{getTipoDocumentoLabel(documentoVisualizando.tipo)}</strong>
                                </div>

                                <div className="documento-detail-item documento-detail-item-full">
                                    <span className="documento-detail-label">Título</span>
                                    <strong>{documentoVisualizando.titulo || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Status</span>
                                    <strong>{getCanceladoLabel(documentoVisualizando.cancelado)}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Emitido em</span>
                                    <strong>
                                        {formatDate(
                                            documentoVisualizando.emitidoEm ||
                                            documentoVisualizando.createdAt
                                        )}
                                    </strong>
                                </div>

                                <div className="documento-detail-item documento-detail-item-full">
                                    <span className="documento-detail-label">Solicitante</span>
                                    <strong>{documentoVisualizando.nomeSolicitante || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">CPF</span>
                                    <strong>{documentoVisualizando.cpfSolicitante || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Matrícula</span>
                                    <strong>{documentoVisualizando.matriculaSolicitante || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Fone 1</span>
                                    <strong>{documentoVisualizando.fone1Solicitante || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Fone 2</span>
                                    <strong>{documentoVisualizando.fone2Solicitante || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Curso</span>
                                    <strong>{documentoVisualizando.cursoSolicitante || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Turma</span>
                                    <strong>{documentoVisualizando.turmaSolicitante || "-"}</strong>
                                </div>

                                <div className="documento-detail-item documento-detail-item-full">
                                    <span className="documento-detail-label">Destinatário</span>
                                    <strong>{documentoVisualizando.destinatarioNome || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Cargo destinatário</span>
                                    <strong>{documentoVisualizando.destinatarioCargo || "-"}</strong>
                                </div>

                                <div className="documento-detail-item">
                                    <span className="documento-detail-label">Órgão / instituição</span>
                                    <strong>{documentoVisualizando.destinatarioOrgao || "-"}</strong>
                                </div>

                                <div className="documento-detail-item documento-detail-item-full">
                                    <span className="documento-detail-label">Assunto</span>
                                    <strong>{documentoVisualizando.assunto || "-"}</strong>
                                </div>

                                <div className="documento-detail-item documento-detail-item-full">
                                    <span className="documento-detail-label">Observações</span>
                                    <strong>{documentoVisualizando.observacoes || "-"}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="documento-modal-footer">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={fecharModalDocumento}
                            >
                                Fechar
                            </button>

                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleDownload(documentoVisualizando)}
                            >
                                Baixar documento
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </Layout>
    );
}