import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../services/api";

function formatDateBR(value) {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function getPrioridadeClass(prioridade) {
    switch (prioridade) {
        case "ALTA":
            return "prioridade-alta";
        case "MEDIA":
            return "prioridade-media";
        case "BAIXA":
        default:
            return "prioridade-baixa";
    }
}

function getPrioridadeLabel(prioridade) {
    switch (prioridade) {
        case "ALTA":
            return "Alta prioridade";
        case "MEDIA":
            return "Média prioridade";
        case "BAIXA":
        default:
            return "Baixa prioridade";
    }
}

function precisaExpandir(texto = "", limite = 220) {
    return texto.length > limite;
}

function resumoTexto(texto = "", limite = 220) {
    if (!texto) return "";
    if (texto.length <= limite) return texto;
    return `${texto.slice(0, limite).trim()}...`;
}

export default function InformativosAtivosSection() {
    const [loading, setLoading] = useState(true);
    const [informativos, setInformativos] = useState([]);
    const [error, setError] = useState("");
    const [expandidos, setExpandidos] = useState({});

    async function loadInformativos() {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest("/informativos/me/ativos");
            setInformativos(Array.isArray(response) ? response : []);
        } catch (err) {
            console.error(err);
            setError("Não foi possível carregar os informativos.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInformativos();
    }, []);

    function toggleExpandir(id) {
        setExpandidos((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    }

    const informativosOrdenados = useMemo(() => {
        const prioridadePeso = {
            ALTA: 0,
            MEDIA: 1,
            BAIXA: 2,
        };

        return [...informativos].sort((a, b) => {
            const prioridadeA = prioridadePeso[a.prioridade] ?? 99;
            const prioridadeB = prioridadePeso[b.prioridade] ?? 99;

            if (prioridadeA !== prioridadeB) {
                return prioridadeA - prioridadeB;
            }

            const dataA = a.dataPublicacao ? new Date(a.dataPublicacao).getTime() : 0;
            const dataB = b.dataPublicacao ? new Date(b.dataPublicacao).getTime() : 0;

            return dataB - dataA;
        });
    }, [informativos]);

    return (
        <section className="dashboard-section informativos-section">
            {/* <div className="dashboard-section-header">
                <div className="page-card">
                    <h3>Informativos</h3>
                    <p>Comunicados ativos disponíveis para o seu perfil.</p>
                </div>

            </div> */}

            {loading ? (
                <div className="page-card">
                    <p>Carregando informativos...</p>
                </div>
            ) : error ? (
                <div className="page-card">
                    <p>{error}</p>
                </div>
            ) : informativosOrdenados.length === 0 ? (
                <div className="page-card">
                    <p>Nenhum informativo ativo no momento.</p>
                </div>
            ) : (
                <div className="informativos-home-grid">
                    {informativosOrdenados.map((item) => {
                        const expandido = Boolean(expandidos[item.id]);
                        const descricaoCompleta = item.descricao || "";
                        const descricaoExibida = expandido
                            ? descricaoCompleta
                            : resumoTexto(descricaoCompleta, 220);
                        const mostrarBotao = precisaExpandir(descricaoCompleta, 220);

                        return (
                            <div key={item.id} className="informativo-home-card">
                                <div className="informativo-home-top">
                                    <span
                                        className={`informativo-prioridade-badge ${getPrioridadeClass(
                                            item.prioridade
                                        )}`}
                                    >
                                        {getPrioridadeLabel(item.prioridade)}
                                    </span>
                                </div>

                                <h4>{item.titulo}</h4>

                                <div className="informativo-home-descricao-wrapper">
                                    <p className="informativo-home-descricao">
                                        {descricaoExibida}
                                    </p>

                                    {mostrarBotao ? (
                                        <button
                                            type="button"
                                            className="informativo-toggle-btn"
                                            onClick={() => toggleExpandir(item.id)}
                                        >
                                            {expandido ? "Ver menos" : "Ver mais"}
                                        </button>
                                    ) : null}
                                </div>

                                <div className="informativo-home-meta">
                                    {/* <div>
                                        <strong>Segmentação:</strong>{" "}
                                        {item.segmentacaoResumo || "Sem segmentação específica"}
                                    </div> */}

                                    <div>
                                        <strong>Publicado em:</strong>{" "}
                                        {item.dataPublicacao
                                            ? formatDateBR(item.dataPublicacao)
                                            : "Imediato"}
                                    </div>

                                    {/* <div>
                                        <strong>Expira em:</strong>{" "}
                                        {item.dataExpiracao
                                            ? formatDateBR(item.dataExpiracao)
                                            : "Sem expiração"}
                                    </div> */}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}