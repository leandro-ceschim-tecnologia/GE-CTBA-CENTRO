import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("pt-BR");
}

function getTipoDocumentoLabel(tipo) {
    const labels = {
        DECLARACAO: "Declaração",
        OFICIO: "Ofício",
        REQUERIMENTO: "Requerimento",
    };

    return labels[tipo] || tipo;
}

export default function MeusDocumentosPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [documentos, setDocumentos] = useState([]);
    const [filtroTipo, setFiltroTipo] = useState("");
    const [busca, setBusca] = useState("");

    useEffect(() => {
        async function loadDocumentos() {
            try {
                setLoading(true);
                setError("");

                const response = await apiRequest("/meus-documentos");
                setDocumentos(Array.isArray(response) ? response : []);
            } catch (err) {
                setError(err.message || "Erro ao carregar seus documentos.");
            } finally {
                setLoading(false);
            }
        }

        loadDocumentos();
    }, []);

    const documentosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return documentos.filter((item) => {
            const matchTipo = filtroTipo ? item.tipo === filtroTipo : true;

            const alvoBusca = [
                item.codigoDocumento,
                item.titulo,
                item.assunto,
                item.nomeSolicitante,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchBusca = termo ? alvoBusca.includes(termo) : true;

            return matchTipo && matchBusca;
        });
    }, [documentos, filtroTipo, busca]);

    function handleAbrirDocumento(documento) {
        const backendBaseUrl =
            import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ||
            "http://localhost:3000";

        const rawUrl = documento?.pdfUrl || documento?.docxUrl;

        if (!rawUrl) {
            window.alert("Documento não disponível para abertura.");
            return;
        }

        const fileUrl = rawUrl.startsWith("http")
            ? rawUrl
            : `${backendBaseUrl}${rawUrl}`;

        window.open(fileUrl, "_blank");
    }

    function handleValidarDocumento(documento) {
        if (!documento?.codigoDocumento) {
            window.alert("Código de validação não encontrado.");
            return;
        }

        window.open(`/validar-documento/${documento.codigoDocumento}`, "_blank");
    }

    return (
        <Layout
            title="Meus Documentos"
            subtitle="Consulte os documentos oficiais emitidos para você"
        >
            {/* <div className="page-header">
                <div>
                    <h2>Meus Documentos</h2>
                    <p>
                        Acompanhe declarações, ofícios e requerimentos já emitidos
                        para seu usuário.
                    </p>
                </div>
            </div> */}

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
                        <h3 style={{ marginBottom: 4 }}>Resumo</h3>
                        <p style={{ margin: 0 }}>
                            {loading
                                ? "Carregando informações..."
                                : `${documentos.length} documento(s) encontrado(s)`}
                        </p>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "12px",
                            minWidth: "320px",
                            flex: 1,
                            maxWidth: "720px",
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
                            <label>Buscar</label>
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Digite código, título, assunto..."
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">Carregando documentos...</div>
                ) : error ? (
                    <div className="alert alert-error">{error}</div>
                ) : !documentos.length ? (
                    <div className="empty-state">
                        Você ainda não possui documentos emitidos.
                    </div>
                ) : !documentosFiltrados.length ? (
                    <div className="empty-state">
                        Nenhum documento encontrado com os filtros informados.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Tipo</th>
                                    <th>Título</th>
                                    <th>Assunto</th>
                                    <th>Data</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documentosFiltrados.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.codigoDocumento || "-"}</td>
                                        <td>{getTipoDocumentoLabel(item.tipo)}</td>
                                        <td>{item.titulo || "-"}</td>
                                        <td>{item.assunto || "-"}</td>
                                        <td>{formatDate(item.emitidoEm || item.createdAt)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    type="button"
                                                    className="btn-table-edit"
                                                    onClick={() => handleAbrirDocumento(item)}
                                                >
                                                    Abrir
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn-table-success"
                                                    onClick={() => handleValidarDocumento(item)}
                                                >
                                                    Validar
                                                </button>
                                            </div>
                                        </td>
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