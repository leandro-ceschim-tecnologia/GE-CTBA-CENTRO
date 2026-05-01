import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

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

function formatDateTime(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("pt-BR");
}

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR");
}

export default function OfertaInscritosPage() {
    const { id } = useParams();

    const [oferta, setOferta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadInscricoes() {
        try {
            setLoading(true);
            setError("");

            const response = await apiRequest(`/ofertas/${id}/inscricoes`);
            setOferta(response);
        } catch (err) {
            setError(err.message || "Erro ao carregar inscritos.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInscricoes();
    }, [id]);

    async function handleAtualizarInscricao(inscricaoId, payload, mensagem) {
        try {
            setProcessing(true);
            setError("");
            setSuccess("");

            await apiRequest(`/ofertas/${id}/inscricoes/${inscricaoId}`, {
                method: "PATCH",
                body: payload,
            });

            setSuccess(mensagem);
            await loadInscricoes();
        } catch (err) {
            setError(err.message || "Erro ao atualizar inscrição.");
        } finally {
            setProcessing(false);
        }
    }

    async function handleEmitirCertificado(inscricaoId) {
        try {
            setProcessing(true);
            setError("");
            setSuccess("");

            await apiRequest(`/ofertas/${id}/inscricoes/${inscricaoId}/certificado`, {
                method: "POST",
                body: {},
            });

            setSuccess("Certificado emitido com sucesso.");
            await loadInscricoes();
        } catch (err) {
            setError(err.message || "Erro ao emitir certificado.");
        } finally {
            setProcessing(false);
        }
    }

    async function handleRegenerarCertificado(inscricaoId) {
        try {
            setProcessing(true);
            setError("");
            setSuccess("");

            await apiRequest(
                `/ofertas/${id}/inscricoes/${inscricaoId}/certificado/regenerar`,
                {
                    method: "POST",
                    body: {},
                }
            );

            setSuccess("Certificado regenerado com sucesso.");
            await loadInscricoes();
        } catch (err) {
            setError(err.message || "Erro ao regenerar certificado.");
        } finally {
            setProcessing(false);
        }
    }

    async function handleEmitirPresentes() {
        try {
            setProcessing(true);
            setError("");
            setSuccess("");

            const result = await apiRequest(`/ofertas/${id}/certificados/emitir-presentes`, {
                method: "POST",
                body: { sobrescrever: false },
            });

            const emitidos = Array.isArray(result)
                ? result.filter((item) => item.status === "emitido").length
                : 0;

            const ignorados = Array.isArray(result)
                ? result.filter((item) => item.status === "ignorado").length
                : 0;

            const erros = Array.isArray(result)
                ? result.filter((item) => item.status === "erro").length
                : 0;

            setSuccess(
                `Emissão em lote concluída. Emitidos: ${emitidos}. Ignorados: ${ignorados}. Erros: ${erros}.`
            );
            await loadInscricoes();
        } catch (err) {
            setError(err.message || "Erro ao emitir certificados dos presentes.");
        } finally {
            setProcessing(false);
        }
    }

    async function handleRegenerarPresentes() {
        try {
            setProcessing(true);
            setError("");
            setSuccess("");

            const result = await apiRequest(
                `/ofertas/${id}/certificados/regenerar-presentes`,
                {
                    method: "POST",
                    body: {},
                }
            );

            const emitidos = Array.isArray(result)
                ? result.filter((item) => item.status === "emitido").length
                : 0;

            const erros = Array.isArray(result)
                ? result.filter((item) => item.status === "erro").length
                : 0;

            setSuccess(
                `Regeneração em lote concluída. Atualizados: ${emitidos}. Erros: ${erros}.`
            );
            await loadInscricoes();
        } catch (err) {
            setError(err.message || "Erro ao regenerar certificados dos presentes.");
        } finally {
            setProcessing(false);
        }
    }

    async function handleAbrirCertificado(inscricaoId) {
        try {
            setProcessing(true);
            setError("");
            setSuccess("");

            const result = await apiRequest(
                `/ofertas/${id}/inscricoes/${inscricaoId}/certificado`
            );

            if (result?.certificadoUrl) {
                window.open(`http://localhost:3000${result.certificadoUrl}`, "_blank");
            } else {
                throw new Error("Certificado não encontrado.");
            }
        } catch (err) {
            setError(err.message || "Erro ao abrir certificado.");
        } finally {
            setProcessing(false);
        }
    }

    function podeEmitirCertificado(inscricao) {
        return (
            Boolean(oferta?.possuiCertificacao) &&
            (inscricao.status === "PRESENTE" || inscricao.presenca === true)
        );
    }

    function getLinhaCertificado(inscricao) {
        if (!oferta?.possuiCertificacao) {
            return "Oferta sem certificação";
        }

        if (inscricao.certificadoEmitido && inscricao.certificadoUrl) {
            return `Emitido em ${formatDateTime(inscricao.certificadoEmitidoEm)}`;
        }

        if (!podeEmitirCertificado(inscricao)) {
            return "Disponível apenas para participantes presentes";
        }

        return "Pronto para emissão";
    }

    return (
        <Layout
            title="Inscritos da Oferta"
            subtitle="Gerencie presença, status e certificados dos participantes"
        >
            <div className="page-card">
                {loading ? (
                    <div className="empty-state">Carregando inscritos...</div>
                ) : !oferta ? (
                    <div className="empty-state">Oferta não encontrada.</div>
                ) : (
                    <>
                        <div className="page-card-header">
                            <div>
                                <h3>{oferta.titulo}</h3>
                                <p>
                                    {formatDate(oferta.dataEvento)}
                                    {oferta.horaInicio ? ` • ${oferta.horaInicio}` : ""}
                                    {oferta.horaFim ? ` às ${oferta.horaFim}` : ""}
                                    {oferta.local ? ` • ${oferta.local}` : ""}
                                </p>
                            </div>

                            <div className="actions-wrap">
                                {oferta.possuiCertificacao ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm"
                                            onClick={handleEmitirPresentes}
                                            disabled={processing}
                                        >
                                            Emitir certificados dos presentes
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleRegenerarPresentes}
                                            disabled={processing}
                                        >
                                            Regenerar certificados dos presentes
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {error ? <div className="alert alert-error">{error}</div> : null}
                        {success ? <div className="alert alert-success">{success}</div> : null}

                        {!oferta.inscricoes?.length ? (
                            <div className="empty-state">
                                Nenhum inscrito encontrado para esta oferta.
                            </div>
                        ) : (
                            <div className="table-wrapper">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Participante</th>
                                            <th>E-mail</th>
                                            <th>Status</th>
                                            <th>Data da inscrição</th>
                                            <th>Presença</th>
                                            <th>Certificado</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {oferta.inscricoes.map((inscricao) => (
                                            <tr key={inscricao.id}>
                                                <td>
                                                    <div className="table-primary-text">
                                                        {inscricao.user?.nome || "-"}
                                                    </div>
                                                    <div className="table-secondary-text">
                                                        {inscricao.user?.role || "-"}
                                                    </div>
                                                </td>

                                                <td>{inscricao.user?.email || "-"}</td>

                                                <td>
                                                    <span
                                                        className={
                                                            STATUS_CLASS[inscricao.status] || "badge"
                                                        }
                                                    >
                                                        {STATUS_LABELS[inscricao.status] ||
                                                            inscricao.status}
                                                    </span>
                                                </td>

                                                <td>{formatDateTime(inscricao.dataInscricao)}</td>

                                                <td>
                                                    {inscricao.presenca === true
                                                        ? "Sim"
                                                        : inscricao.presenca === false
                                                            ? "Não"
                                                            : "-"}
                                                </td>

                                                <td>
                                                    <div className="table-primary-text">
                                                        {inscricao.certificadoEmitido
                                                            ? "Emitido"
                                                            : "Não emitido"}
                                                    </div>
                                                    <div className="table-secondary-text">
                                                        {getLinhaCertificado(inscricao)}
                                                    </div>
                                                    {inscricao.codigoCertificado ? (
                                                        <div className="table-secondary-text">
                                                            Código: {inscricao.codigoCertificado}
                                                        </div>
                                                    ) : null}
                                                </td>

                                                <td>
                                                    <div className="actions-wrap">
                                                        <button
                                                            type="button"
                                                            className="btn btn-success btn-sm"
                                                            onClick={() =>
                                                                handleAtualizarInscricao(
                                                                    inscricao.id,
                                                                    { presenca: true },
                                                                    "Presença marcada com sucesso."
                                                                )
                                                            }
                                                            disabled={processing}
                                                        >
                                                            Presente
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-warning btn-sm"
                                                            onClick={() =>
                                                                handleAtualizarInscricao(
                                                                    inscricao.id,
                                                                    { presenca: false },
                                                                    "Ausência marcada com sucesso."
                                                                )
                                                            }
                                                            disabled={processing}
                                                        >
                                                            Ausente
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() =>
                                                                handleAtualizarInscricao(
                                                                    inscricao.id,
                                                                    { status: "CANCELADO" },
                                                                    "Inscrição cancelada com sucesso."
                                                                )
                                                            }
                                                            disabled={processing}
                                                        >
                                                            Cancelar inscrição
                                                        </button>

                                                        {oferta.possuiCertificacao ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() =>
                                                                        handleEmitirCertificado(
                                                                            inscricao.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processing ||
                                                                        !podeEmitirCertificado(
                                                                            inscricao
                                                                        )
                                                                    }
                                                                >
                                                                    Emitir certificado
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() =>
                                                                        handleRegenerarCertificado(
                                                                            inscricao.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processing ||
                                                                        !inscricao.certificadoEmitido
                                                                    }
                                                                >
                                                                    Regenerar certificado
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() =>
                                                                        handleAbrirCertificado(
                                                                            inscricao.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        processing ||
                                                                        !inscricao.certificadoEmitido ||
                                                                        !inscricao.certificadoUrl
                                                                    }
                                                                >
                                                                    Abrir certificado
                                                                </button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}