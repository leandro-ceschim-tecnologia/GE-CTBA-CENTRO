import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

function getTipoDocumentoLabel(tipo) {
    const labels = {
        DECLARACAO: "Declaração",
        OFICIO: "Ofício",
        REQUERIMENTO: "Requerimento",
    };

    return labels[tipo] || tipo;
}

export default function DocumentosDisponiveisCard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [totalDocumentos, setTotalDocumentos] = useState(0);
    const [ultimosDocumentos, setUltimosDocumentos] = useState([]);

    useEffect(() => {
        async function loadDocumentos() {
            try {
                setLoading(true);
                setError("");

                const documentos = await apiRequest("/meus-documentos");

                const disponiveis = Array.isArray(documentos)
                    ? documentos.filter((item) => !item.cancelado && item.pdfUrl)
                    : [];

                setTotalDocumentos(disponiveis.length);
                setUltimosDocumentos(disponiveis.slice(0, 3));
            } catch (err) {
                setError(err.message || "Erro ao carregar documentos.");
            } finally {
                setLoading(false);
            }
        }

        loadDocumentos();
    }, []);

    function handleAbrirDocumento(documento) {
        if (!documento?.pdfUrl) return;

        const backendBaseUrl =
            import.meta.env.VITE_API_URL?.replace(/\/api$/, "") ||
            "http://localhost:3000";

        const fileUrl = documento.pdfUrl.startsWith("http")
            ? documento.pdfUrl
            : `${backendBaseUrl}${documento.pdfUrl}`;

        window.open(fileUrl, "_blank");
    }

    return (
        <div className="page-card">
            <div className="page-card-header">
                <div>
                    <h3>Documentos disponíveis</h3>
                    <p>Acompanhe os documentos já emitidos para você.</p>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Carregando documentos...</div>
            ) : error ? (
                <div className="alert alert-error">{error}</div>
            ) : totalDocumentos === 0 ? (
                <div className="empty-state">
                    Você ainda não possui documentos emitidos.
                </div>
            ) : (
                <>
                    <div className="certificados-resumo">
                        <div className="certificados-total">
                            <strong>{totalDocumentos}</strong>
                            <span>
                                {totalDocumentos === 1
                                    ? " documento disponível"
                                    : " documentos disponíveis"}
                            </span>
                        </div>
                    </div>

                    <div className="certificados-lista">
                        {ultimosDocumentos.map((documento) => (
                            <div key={documento.id} className="certificado-item">
                                <div>
                                    <div className="table-primary-text">
                                        {documento.titulo || "Documento sem título"}
                                    </div>
                                    <div className="table-secondary-text">
                                        {getTipoDocumentoLabel(documento.tipo)} · Código:{" "}
                                        {documento.codigoDocumento || "-"}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleAbrirDocumento(documento)}
                                >
                                    Abrir documento
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <Link to="/documentos" className="btn btn-primary">
                            Ver documentos
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}