import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function CertificadosDisponiveisCard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [totalCertificados, setTotalCertificados] = useState(0);
    const [ultimosCertificados, setUltimosCertificados] = useState([]);

    useEffect(() => {
        async function loadCertificados() {
            try {
                setLoading(true);
                setError("");

                const inscricoes = await apiRequest("/ofertas/minhas-inscricoes/me");

                const emitidos = Array.isArray(inscricoes)
                    ? inscricoes.filter((item) => item.certificadoEmitido && item.certificadoUrl)
                    : [];

                setTotalCertificados(emitidos.length);
                setUltimosCertificados(emitidos.slice(0, 3));
            } catch (err) {
                setError(err.message || "Erro ao carregar certificados.");
            } finally {
                setLoading(false);
            }
        }

        loadCertificados();
    }, []);

    function handleAbrirCertificado(inscricao) {
        if (!inscricao?.certificadoUrl) return;
        window.open(`http://localhost:3000${inscricao.certificadoUrl}`, "_blank");
    }

    return (
        <div className="page-card">
            <div className="page-card-header">
                <div>
                    <h3>Certificados disponíveis</h3>
                    <p>Acompanhe os certificados já emitidos para você.</p>
                </div>
            </div>

            {loading ? (
                <div className="empty-state">Carregando certificados...</div>
            ) : error ? (
                <div className="alert alert-error">{error}</div>
            ) : totalCertificados === 0 ? (
                <div className="empty-state">
                    Você ainda não possui certificados emitidos.
                </div>
            ) : (
                <>
                    <div className="certificados-resumo">
                        <div className="certificados-total">
                            <strong>{totalCertificados}</strong>
                            <span>
                                {totalCertificados === 1
                                    ? " certificado disponível"
                                    : " certificados disponíveis"}
                            </span>
                        </div>
                    </div>

                    <div className="certificados-lista">
                        {ultimosCertificados.map((inscricao) => (
                            <div key={inscricao.id} className="certificado-item">
                                <div>
                                    <div className="table-primary-text">
                                        {inscricao.oferta?.titulo || "Oferta sem título"}
                                    </div>
                                    <div className="table-secondary-text">
                                        Código: {inscricao.codigoCertificado || "-"}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleAbrirCertificado(inscricao)}
                                >
                                    Abrir certificado
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <Link to="/minhas-inscricoes" className="btn btn-primary">
                            Ver minhas inscrições
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}