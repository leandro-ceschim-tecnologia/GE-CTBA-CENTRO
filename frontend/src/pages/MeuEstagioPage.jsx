import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

export default function MeuEstagioPage() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        loadMeuEstagio();
    }, []);

    async function loadMeuEstagio() {
        setLoading(true);
        setErro("");

        try {
            const data = await apiRequest("/estagios-enf/meu-estagio");
            setDados(data);
        } catch (error) {
            setErro(error.message || "Erro ao carregar seu estágio.");
        } finally {
            setLoading(false);
        }
    }

    const possuiEstagio = useMemo(() => {
        return !!dados?.aluno && Array.isArray(dados?.blocos) && dados.blocos.length > 0;
    }, [dados]);

    const campoAtual = dados?.campoAtual || null;

    function formatarData(data) {
        if (!data) return "-";
        return new Date(data).toLocaleDateString();
    }

    function getStatusLabel(status) {
        if (status === "atual") return "Atual";
        if (status === "concluido") return "Concluído";
        return "Próximo";
    }

    function getStatusBadgeClass(status) {
        if (status === "atual") return "warning";
        if (status === "concluido") return "success";
        return "neutral";
    }

    function getTimelineClass(status) {
        if (status === "atual") return "timeline-item atual";
        if (status === "concluido") return "timeline-item concluido";
        return "timeline-item futuro";
    }

    return (
        <Layout
            title="Meu Estágio"
            subtitle="Acompanhe seu campo atual e próximos rodízios"
        >
            <section className="page-card meu-estagio-page">
                {erro && <div className="alert alert-error">{erro}</div>}
                {loading && <p>Carregando...</p>}

                {!loading && !erro && (
                    <>
                        {!possuiEstagio ? (
                            <div className="empty-state">
                                Você ainda não possui estágio vinculado no sistema.
                            </div>
                        ) : (
                            <>
                                <div className="info-grid">
                                    <div className="info-card">
                                        <strong>Aluno</strong>
                                        <span>{dados.aluno?.nome || "-"}</span>
                                    </div>

                                    <div className="info-card">
                                        <strong>Matrícula</strong>
                                        <span>{dados.aluno?.matricula || "-"}</span>
                                    </div>

                                    <div className="info-card">
                                        <strong>Turma</strong>
                                        <span>
                                            {dados.blocoAtual?.turma?.nome ||
                                                dados.blocos?.[0]?.turma?.nome ||
                                                "-"}
                                        </span>
                                    </div>

                                    <div className="info-card">
                                        <strong>Curso</strong>
                                        <span>
                                            {dados.blocoAtual?.curso?.nome ||
                                                dados.blocos?.[0]?.curso?.nome ||
                                                "-"}
                                        </span>
                                    </div>

                                    <div className="info-card">
                                        <strong>Grupo atual</strong>
                                        <span>{dados.grupoAtual?.nome || "-"}</span>
                                    </div>

                                    <div className="info-card">
                                        <strong>Bloco atual</strong>
                                        <span>
                                            {dados.blocoAtual?.numeroBloco
                                                ? `Bloco ${dados.blocoAtual.numeroBloco}`
                                                : "-"}
                                        </span>
                                    </div>
                                </div>

                                <section className="page-card nested-card meu-estagio-card-atual">
                                    <div className="page-header">
                                        <div>
                                            <h3>Campo atual</h3>
                                            <p>Informações do seu estágio neste momento.</p>
                                        </div>
                                    </div>

                                    {campoAtual ? (
                                        <div className="info-grid">
                                            <div className="info-card">
                                                <strong>Campo</strong>
                                                <span>{campoAtual.campo?.nome || "-"}</span>
                                            </div>

                                            <div className="info-card">
                                                <strong>Período</strong>
                                                <span>
                                                    {formatarData(campoAtual.dataInicio)} até{" "}
                                                    {formatarData(campoAtual.dataFim)}
                                                </span>
                                            </div>

                                            <div className="info-card">
                                                <strong>Supervisor</strong>
                                                <span>{campoAtual.campo?.supervisor?.nome || "-"}</span>
                                            </div>

                                            <div className="info-card">
                                                <strong>Telefone</strong>
                                                <span>
                                                    {campoAtual.campo?.supervisor?.fone1 ||
                                                        campoAtual.campo?.supervisor?.fone2 ||
                                                        "-"}
                                                </span>
                                            </div>

                                            <div className="info-card">
                                                <strong>Cidade</strong>
                                                <span>{campoAtual.campo?.cidade || "-"}</span>
                                            </div>

                                            <div className="info-card">
                                                <strong>Endereço</strong>
                                                <span>{campoAtual.campo?.endereco || "-"}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            Nenhum campo ativo hoje. Consulte abaixo seus próximos períodos de estágio.
                                        </div>
                                    )}
                                </section>

                                <section className="page-card nested-card">
                                    <div className="page-header">
                                        <div>
                                            <h3>Minha programação de estágio</h3>
                                            <p>Veja todos os seus blocos e períodos de estágio.</p>
                                        </div>
                                    </div>

                                    {dados.blocos?.length ? (
                                        <div className="rodizio-list">
                                            {dados.blocos.map((bloco) => (
                                                <div
                                                    key={bloco.id}
                                                    className="rodizio-card meu-estagio-bloco-card"
                                                >
                                                    <div className="rodizio-card-header">
                                                        <strong>
                                                            Bloco {bloco.numeroBloco} ·{" "}
                                                            {bloco.grupo?.nome || "-"}
                                                        </strong>
                                                        <span>
                                                            {formatarData(bloco.dataInicio)} até{" "}
                                                            {formatarData(bloco.dataFim)}
                                                        </span>
                                                    </div>

                                                    <div className="timeline-wrapper">
                                                        {bloco.rodizios?.map((item, index) => (
                                                            <div
                                                                key={item.id}
                                                                className={getTimelineClass(item.status)}
                                                            >
                                                                <div className="timeline-marker">
                                                                    {index + 1}
                                                                </div>

                                                                <div className="timeline-content">
                                                                    <div className="timeline-top">
                                                                        <strong>
                                                                            {item.campo?.nome || "-"}
                                                                        </strong>
                                                                        <span
                                                                            className={`badge ${getStatusBadgeClass(
                                                                                item.status
                                                                            )}`}
                                                                        >
                                                                            {getStatusLabel(item.status)}
                                                                        </span>
                                                                    </div>

                                                                    <div className="timeline-meta">
                                                                        <span>
                                                                            {formatarData(item.dataInicio)} até{" "}
                                                                            {formatarData(item.dataFim)}
                                                                        </span>
                                                                        <span>
                                                                            Supervisor:{" "}
                                                                            {item.campo?.supervisor?.nome || "-"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="table-responsive">
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>Etapa</th>
                                                                    <th>Período</th>
                                                                    <th>Campo</th>
                                                                    <th>Supervisor</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {bloco.rodizios?.length ? (
                                                                    bloco.rodizios.map((item) => (
                                                                        <tr key={item.id}>
                                                                            <td>{item.ordem}</td>
                                                                            <td>
                                                                                {formatarData(item.dataInicio)} até{" "}
                                                                                {formatarData(item.dataFim)}
                                                                            </td>
                                                                            <td>{item.campo?.nome || "-"}</td>
                                                                            <td>
                                                                                {item.campo?.supervisor?.nome ||
                                                                                    "-"}
                                                                            </td>
                                                                            <td>
                                                                                <span
                                                                                    className={`badge ${getStatusBadgeClass(
                                                                                        item.status
                                                                                    )}`}
                                                                                >
                                                                                    {getStatusLabel(item.status)}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="5">
                                                                            Nenhum rodízio encontrado
                                                                            neste bloco.
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            Nenhum rodízio encontrado.
                                        </div>
                                    )}
                                </section>
                            </>
                        )}
                    </>
                )}
            </section>
        </Layout>
    );
}