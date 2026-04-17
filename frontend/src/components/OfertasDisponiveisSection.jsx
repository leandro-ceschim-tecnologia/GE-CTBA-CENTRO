import { useEffect, useState } from "react";
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

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
}

function getStatusLabel(oferta) {
    if (oferta.inscricaoDoUsuario) return "Já inscrito";

    switch (oferta.motivoBloqueio) {
        case "LOTADO":
            return "Lotado";
        case "ENCERRADA":
        case "INSCRICAO_ENCERRADA":
        case "EVENTO_REALIZADO":
        case "CANCELADA":
            return "Encerrado";
        case "INSCRICAO_NAO_INICIADA":
            return "Inscrição em breve";
        default:
            return "Inscrever-se";
    }
}

function isButtonDisabled(oferta) {
    if (oferta.inscricaoDoUsuario) return true;
    return !oferta.podeInscrever;
}

export default function OfertasDisponiveisSection() {
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadOfertas() {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest("/ofertas/disponiveis/me");
            setOfertas(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar ofertas disponíveis.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOfertas();
    }, []);

    async function handleInscrever(ofertaId) {
        try {
            setError("");
            setSuccess("");

            await apiRequest(`/ofertas/${ofertaId}/inscrever`, {
                method: "POST",
            });

            setSuccess("Inscrição realizada com sucesso.");
            await loadOfertas();
        } catch (err) {
            setError(err.message || "Erro ao realizar inscrição.");
        }
    }

    return (
        <div className="page-card">
            <div className="page-card-header">
                <div>
                    <h3>Ofertas disponíveis</h3>
                    <p>Eventos, palestras, workshops e capacitações da unidade para o seu perfil.</p>
                </div>
            </div>

            {error ? <div className="alert alert-error">{error}</div> : null}
            {success ? <div className="alert alert-success">{success}</div> : null}

            {loading ? (
                <div className="empty-state">Carregando ofertas...</div>
            ) : !ofertas.length ? (
                <div className="empty-state">Nenhuma oferta disponível no momento.</div>
            ) : (
                <div className="ofertas-grid">
                    {ofertas.map((oferta) => (
                        <div key={oferta.id} className="oferta-card">
                            <div className="oferta-card-top">
                                <span className="badge neutral">
                                    {TIPO_LABELS[oferta.tipo] || oferta.tipo}
                                </span>

                                {oferta.possuiCertificacao ? (
                                    <span className="badge success">Certificação</span>
                                ) : null}
                            </div>

                            <h4>{oferta.titulo}</h4>

                            <div className="oferta-meta">
                                <span>{formatDate(oferta.dataEvento)}</span>
                                {oferta.horaInicio ? <span>{oferta.horaInicio}</span> : null}
                                {oferta.horaFim ? <span>às {oferta.horaFim}</span> : null}
                            </div>

                            <div className="oferta-meta">
                                <span>{oferta.local || "Local a definir"}</span>
                            </div>

                            {oferta.descricao ? (
                                <p className="oferta-descricao">{oferta.descricao}</p>
                            ) : null}

                            <div className="oferta-footer">
                                <div className="oferta-vagas">
                                    {oferta.vagas === null || oferta.vagas === undefined
                                        ? "Sem limite de vagas"
                                        : `${oferta.totalInscritos}/${oferta.vagas} inscritos`}
                                </div>

                                <button
                                    type="button"
                                    className={`btn btn-sm ${isButtonDisabled(oferta) ? "btn-secondary" : "btn-primary"
                                        }`}
                                    disabled={isButtonDisabled(oferta)}
                                    onClick={() => handleInscrever(oferta.id)}
                                >
                                    {getStatusLabel(oferta)}
                                </button>

                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}