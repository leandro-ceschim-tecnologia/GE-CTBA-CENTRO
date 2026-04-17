import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const TIPO_LABELS = {
    CURSO_INTENSIVO: "Curso Intensivo",
    PALESTRA: "Palestra",
    WORKSHOP: "Workshop",
    TREINAMENTO: "Treinamento",
    MINICURSO: "Minicurso",
    EVENTO: "Evento",
    SEGUNDA_CHAMADA_RECUPERACAO: "2ª Chamada / Recuperação",
    OUTRO: "Outro",
};

const STATUS_LABELS = {
    INSCRITO: "Inscrito",
    CANCELADO: "Cancelado",
    PRESENTE: "Presente",
    AUSENTE: "Ausente",
    LISTA_ESPERA: "Lista de espera",
};

const STATUS_CLASS = {
    INSCRITO: "badge neutral",
    CANCELADO: "badge danger",
    PRESENTE: "badge success",
    AUSENTE: "badge warning",
    LISTA_ESPERA: "badge neutral",
};

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
}

function formatDateTime(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR");
}

export default function MinhasInscricoesPage() {
    const [inscricoes, setInscricoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadInscricoes() {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest("/ofertas/minhas-inscricoes/me");
            setInscricoes(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar minhas inscrições.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInscricoes();
    }, []);

    function handleAbrirCertificado(inscricao) {
        if (!inscricao?.certificadoUrl) return;
        window.open(`http://localhost:3000${inscricao.certificadoUrl}`, "_blank");
    }

    return (
        <Layout
            title="Minhas Inscrições"
            subtitle="Acompanhe suas inscrições em ofertas acadêmicas"
        >
            <div className="page-card">
                <div className="page-card-header">
                    <div>
                        <h3>Minhas inscrições</h3>
                        <p>Veja o status das suas inscrições, presença e certificação.</p>
                    </div>
                </div>

                {error ? <div className="alert alert-error">{error}</div> : null}

                {loading ? (
                    <div className="empty-state">Carregando inscrições...</div>
                ) : !inscricoes.length ? (
                    <div className="empty-state">Você ainda não possui inscrições.</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Oferta</th>
                                    <th>Tipo</th>
                                    <th>Data</th>
                                    <th>Status</th>
                                    <th>Presença</th>
                                    <th>Certificado</th>
                                    <th>Inscrito em</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inscricoes.map((inscricao) => (
                                    <tr key={inscricao.id}>
                                        <td>
                                            <div className="table-primary-text">
                                                {inscricao.oferta?.titulo || "-"}
                                            </div>
                                            <div className="table-secondary-text">
                                                {inscricao.oferta?.local || "Sem local informado"}
                                            </div>
                                        </td>
                                        <td>
                                            {TIPO_LABELS[inscricao.oferta?.tipo] ||
                                                inscricao.oferta?.tipo ||
                                                "-"}
                                        </td>
                                        <td>{formatDate(inscricao.oferta?.dataEvento)}</td>
                                        <td>
                                            <span className={STATUS_CLASS[inscricao.status] || "badge"}>
                                                {STATUS_LABELS[inscricao.status] || inscricao.status}
                                            </span>
                                        </td>
                                        <td>
                                            {inscricao.presenca === true
                                                ? "Sim"
                                                : inscricao.presenca === false
                                                    ? "Não"
                                                    : "-"}
                                        </td>
                                        <td>
                                            <div className="table-primary-text">
                                                {inscricao.certificadoEmitido ? "Emitido" : "Não"}
                                            </div>
                                            {inscricao.codigoCertificado ? (
                                                <div className="table-secondary-text">
                                                    Código: {inscricao.codigoCertificado}
                                                </div>
                                            ) : null}
                                        </td>
                                        <td>{formatDateTime(inscricao.dataInscricao)}</td>
                                        <td>
                                            {inscricao.certificadoEmitido && inscricao.certificadoUrl ? (
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => handleAbrirCertificado(inscricao)}
                                                >
                                                    Abrir certificado
                                                </button>
                                            ) : (
                                                <span className="table-secondary-text">
                                                    Indisponível
                                                </span>
                                            )}
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