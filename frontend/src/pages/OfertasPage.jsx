import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const STATUS_LABELS = {
    RASCUNHO: "Rascunho",
    PUBLICADO: "Publicado",
    ENCERRADO: "Encerrado",
    CANCELADO: "Cancelado",
};

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

const STATUS_CLASS = {
    RASCUNHO: "badge neutral",
    PUBLICADO: "badge success",
    ENCERRADO: "badge warning",
    CANCELADO: "badge danger",
};

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
}

function formatPublicos(publicosAlvo) {
    if (!Array.isArray(publicosAlvo) || !publicosAlvo.length) return "-";

    return publicosAlvo
        .map((item) => {
            switch (item.role) {
                case "ALUNO":
                    return "Aluno";
                case "INSTRUTOR":
                    return "Instrutor";
                case "COMERCIAL":
                    return "Comercial";
                case "SECRETARIA":
                    return "Secretaria";
                case "COORDENACAO":
                    return "Coordenação";
                case "PEDAGOGICO":
                    return "Pedagógico";
                case "ADMIN":
                    return "Admin";
                default:
                    return item.role;
            }
        })
        .join(", ");
}

export default function OfertasPage() {
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [filtroStatus, setFiltroStatus] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [busca, setBusca] = useState("");

    async function loadOfertas() {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest("/ofertas");
            setOfertas(Array.isArray(response) ? response : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar ofertas.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOfertas();
    }, []);

    async function handleAlterarStatus(ofertaId, status) {
        try {
            setError("");
            setSuccess("");

            await apiRequest(`/ofertas/${ofertaId}/status`, {
                method: "PATCH",
                body: { status },
            });

            setSuccess("Status da oferta atualizado com sucesso.");
            await loadOfertas();
        } catch (err) {
            setError(err.message || "Erro ao atualizar status da oferta.");
        }
    }

    const ofertasFiltradas = useMemo(() => {
        return ofertas.filter((oferta) => {
            const matchStatus = !filtroStatus || oferta.status === filtroStatus;
            const matchTipo = !filtroTipo || oferta.tipo === filtroTipo;
            const termo = busca.trim().toLowerCase();

            const matchBusca =
                !termo ||
                oferta.titulo?.toLowerCase().includes(termo) ||
                oferta.local?.toLowerCase().includes(termo) ||
                oferta.descricao?.toLowerCase().includes(termo);

            return matchStatus && matchTipo && matchBusca;
        });
    }, [ofertas, filtroStatus, filtroTipo, busca]);

    return (
        <Layout
            title="Ofertas Acadêmicas"
            subtitle="Gerencie eventos, capacitações e acontecimentos da unidade"
        >
            <div className="page-card">
                <div className="page-card-header ofertas-header">
                    <div>
                        <h3>Ofertas cadastradas</h3>
                        <p>Cadastre, publique e acompanhe as ofertas acadêmicas da unidade.</p>
                    </div>

                    <a href="/ofertas/nova" className="btn btn-primary">
                        Nova oferta
                    </a>
                </div>

                <div className="filters-grid">
                    <div className="form-group">
                        <label>Buscar</label>
                        <input
                            type="text"
                            placeholder="Título, local ou descrição"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="RASCUNHO">Rascunho</option>
                            <option value="PUBLICADO">Publicado</option>
                            <option value="ENCERRADO">Encerrado</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tipo</label>
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {Object.entries(TIPO_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {error ? <div className="alert alert-error">{error}</div> : null}
                {success ? <div className="alert alert-success">{success}</div> : null}

                {loading ? (
                    <div className="empty-state">Carregando ofertas...</div>
                ) : !ofertasFiltradas.length ? (
                    <div className="empty-state">Nenhuma oferta encontrada.</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Tipo</th>
                                    <th>Data</th>
                                    <th>Instrutor</th>
                                    <th>Status</th>
                                    <th>Público-alvo</th>
                                    <th>Inscritos</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ofertasFiltradas.map((oferta) => (
                                    <tr key={oferta.id}>
                                        <td>
                                            <div className="table-primary-text">{oferta.titulo}</div>
                                            <div className="table-secondary-text">
                                                {oferta.local || "Sem local informado"}
                                            </div>
                                        </td>
                                        <td>{TIPO_LABELS[oferta.tipo] || oferta.tipo}</td>
                                        <td>{formatDate(oferta.dataEvento)}</td>
                                        <td>{oferta.instrutor?.nome || "-"}</td>
                                        <td>
                                            <span className={STATUS_CLASS[oferta.status] || "badge"}>
                                                {STATUS_LABELS[oferta.status] || oferta.status}
                                            </span>
                                        </td>
                                        <td>{formatPublicos(oferta.publicosAlvo)}</td>
                                        <td>{oferta?._count?.inscricoes ?? 0}</td>
                                        <td>
                                            <div className="actions-wrap">
                                                <a
                                                    href={`/ofertas/${oferta.id}/editar`}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Editar
                                                </a>

                                                <a
                                                    href={`/ofertas/${oferta.id}/inscritos`}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Inscritos
                                                </a>

                                                {oferta.status === "RASCUNHO" && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleAlterarStatus(oferta.id, "PUBLICADO")}
                                                    >
                                                        Publicar
                                                    </button>
                                                )}

                                                {oferta.status === "PUBLICADO" && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-warning btn-sm"
                                                            onClick={() => handleAlterarStatus(oferta.id, "ENCERRADO")}
                                                        >
                                                            Encerrar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleAlterarStatus(oferta.id, "CANCELADO")}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </>
                                                )}
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