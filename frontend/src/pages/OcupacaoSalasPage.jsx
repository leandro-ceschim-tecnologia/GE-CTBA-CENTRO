import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const PERIODOS = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
];

function getTodayInputValue() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getPeriodoLabel(value) {
    return PERIODOS.find((item) => item.value === value)?.label || value || "-";
}

function getOrigemBadgeClass(origem) {
    if (origem === "ENSALAMENTO") return "badge success";
    if (origem === "OFERTA") return "badge warning";
    return "badge neutral";
}

export default function OcupacaoSalasPage() {
    const [dataRef, setDataRef] = useState(getTodayInputValue());
    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadOcupacao(dataRef);
    }, []);

    async function loadOcupacao(dataSelecionada) {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(`/ocupacao-salas?data=${dataSelecionada}`);
            setPayload(data || null);
        } catch (err) {
            setError(err.message || "Erro ao carregar ocupação das salas.");
            setPayload(null);
        } finally {
            setLoading(false);
        }
    }

    function handleBuscar(event) {
        event.preventDefault();
        loadOcupacao(dataRef);
    }

    const listaConflitos = useMemo(() => {
        return Array.isArray(payload?.listaDetalhada)
            ? payload.listaDetalhada.filter((item) => item.conflito)
            : [];
    }, [payload]);

    return (
        <Layout
            title="Ocupação de Salas"
            subtitle="Acompanhe a ocupação da unidade por data, período e origem"
        >
            <style>{`
                .ocupacao-grid-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    min-width: 1100px;
                }

                .ocupacao-grid-table th,
                .ocupacao-grid-table td {
                    border: 1px solid #e5e7eb;
                    vertical-align: top;
                    padding: 10px;
                    background: #fff;
                }

                .ocupacao-grid-table thead th {
                    background: #f8fafc;
                    font-weight: 700;
                    text-align: center;
                }

                .ocupacao-sala-col {
                    min-width: 190px;
                    background: #f8fafc !important;
                }

                .ocupacao-periodo-col {
                    min-width: 280px;
                }

                .ocupacao-slot-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .ocupacao-slot {
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 10px;
                    background: #ffffff;
                }

                .ocupacao-slot--conflito {
                    background: #fef2f2;
                    border-color: #fca5a5;
                }

                .ocupacao-slot-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 10px;
                    margin-bottom: 6px;
                }

                .ocupacao-slot-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.3;
                }

                .ocupacao-slot-subtitle {
                    font-size: 12px;
                    color: #475569;
                    line-height: 1.35;
                }

                .ocupacao-slot-obs {
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px dashed #cbd5e1;
                    font-size: 12px;
                    color: #334155;
                    line-height: 1.4;
                }

                .ocupacao-empty-slot {
                    min-height: 60px;
                    border: 1px dashed #cbd5e1;
                    border-radius: 12px;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .ocupacao-resumo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 14px;
                }

                .ocupacao-resumo-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 16px;
                    background: #fff;
                }

                .ocupacao-resumo-label {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .ocupacao-resumo-value {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    line-height: 1;
                }
            `}</style>

            <div className="page-card">
                <div className="page-card-header">
                    <div>
                        <h3>Consulta por data</h3>
                        <p>
                            Veja a ocupação das salas considerando ensalamento fixo e ofertas acadêmicas.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleBuscar} className="user-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Data</label>
                            <input
                                type="date"
                                value={dataRef}
                                onChange={(e) => setDataRef(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="action-row">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Consultando..." : "Consultar ocupação"}
                        </button>
                    </div>
                </form>
            </div>

            {error ? <div className="alert alert-error">{error}</div> : null}

            {payload ? (
                <div className="page-card">
                    <div className="page-card-header">
                        <div>
                            <h3>Resumo da data</h3>
                            <p>
                                Data consultada: <strong>{payload.data}</strong> • Dia da semana:{" "}
                                <strong>{payload.diaSemana}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="ocupacao-resumo-grid">
                        <div className="ocupacao-resumo-card">
                            <div className="ocupacao-resumo-label">Salas</div>
                            <div className="ocupacao-resumo-value">
                                {payload?.resumo?.totalSalas ?? 0}
                            </div>
                        </div>

                        <div className="ocupacao-resumo-card">
                            <div className="ocupacao-resumo-label">Ensalamentos</div>
                            <div className="ocupacao-resumo-value">
                                {payload?.resumo?.totalEnsalamentos ?? 0}
                            </div>
                        </div>

                        <div className="ocupacao-resumo-card">
                            <div className="ocupacao-resumo-label">Ofertas</div>
                            <div className="ocupacao-resumo-value">
                                {payload?.resumo?.totalOfertas ?? 0}
                            </div>
                        </div>

                        <div className="ocupacao-resumo-card">
                            <div className="ocupacao-resumo-label">Conflitos</div>
                            <div
                                className="ocupacao-resumo-value"
                                style={{
                                    color:
                                        (payload?.resumo?.totalConflitos ?? 0) > 0
                                            ? "#b91c1c"
                                            : "#166534",
                                }}
                            >
                                {payload?.resumo?.totalConflitos ?? 0}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {payload ? (
                <div className="page-card">
                    <div className="page-card-header">
                        <div>
                            <h3>Quadro de ocupação por período</h3>
                            <p>
                                Cada célula mostra tudo o que ocupa a sala naquele período.
                            </p>
                        </div>
                    </div>

                    <div className="table-wrapper">
                        <table className="ocupacao-grid-table">
                            <thead>
                                <tr>
                                    <th className="ocupacao-sala-col">Sala</th>
                                    {PERIODOS.map((periodo) => (
                                        <th key={periodo.value} className="ocupacao-periodo-col">
                                            {periodo.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(payload.matrix || []).length ? (
                                    payload.matrix.map((row) => (
                                        <tr key={row.sala.id}>
                                            <td className="ocupacao-sala-col">
                                                <div className="table-primary-text">
                                                    {row.sala.nome}
                                                </div>
                                                <div className="table-secondary-text">
                                                    {row.sala.capacidade
                                                        ? `Cap. ${row.sala.capacidade}`
                                                        : "Capacidade não informada"}
                                                    {row.sala.bloco ? ` • ${row.sala.bloco}` : ""}
                                                </div>
                                            </td>

                                            {PERIODOS.map((periodo) => {
                                                const itens = row.periodos?.[periodo.value] || [];
                                                const temConflito = itens.length > 1;

                                                return (
                                                    <td key={`${row.sala.id}_${periodo.value}`}>
                                                        {!itens.length ? (
                                                            <div className="ocupacao-empty-slot">
                                                                Sala livre
                                                            </div>
                                                        ) : (
                                                            <div className="ocupacao-slot-stack">
                                                                {itens.map((item, index) => (
                                                                    <div
                                                                        key={`${item.origem}_${item.id}_${index}`}
                                                                        className={
                                                                            temConflito
                                                                                ? "ocupacao-slot ocupacao-slot--conflito"
                                                                                : "ocupacao-slot"
                                                                        }
                                                                    >
                                                                        <div className="ocupacao-slot-header">
                                                                            <span
                                                                                className={getOrigemBadgeClass(
                                                                                    item.origem
                                                                                )}
                                                                            >
                                                                                {item.origemLabel}
                                                                            </span>

                                                                            {temConflito ? (
                                                                                <span className="badge danger">
                                                                                    Conflito
                                                                                </span>
                                                                            ) : null}
                                                                        </div>

                                                                        <div className="ocupacao-slot-title">
                                                                            {item.titulo}
                                                                        </div>

                                                                        {item.subtitulo ? (
                                                                            <div className="ocupacao-slot-subtitle">
                                                                                {item.subtitulo}
                                                                            </div>
                                                                        ) : null}

                                                                        {item.horaInicio || item.horaFim ? (
                                                                            <div className="ocupacao-slot-subtitle">
                                                                                {item.horaInicio || "--:--"} às{" "}
                                                                                {item.horaFim || "--:--"}
                                                                            </div>
                                                                        ) : null}

                                                                        {item.observacoes ? (
                                                                            <div className="ocupacao-slot-obs">
                                                                                {item.observacoes}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4}>Nenhuma sala encontrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {payload ? (
                <div className="page-card">
                    <div className="page-card-header">
                        <div>
                            <h3>Conflitos identificados</h3>
                            <p>
                                Aqui aparecem apenas os períodos com mais de uma ocupação na mesma sala.
                            </p>
                        </div>
                    </div>

                    {!listaConflitos.length ? (
                        <div className="empty-state">
                            Nenhum conflito encontrado para a data selecionada.
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Sala</th>
                                        <th>Período</th>
                                        <th>Origem</th>
                                        <th>Título</th>
                                        <th>Complemento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {listaConflitos.map((item, index) => (
                                        <tr key={`${item.origem}_${item.id}_${index}`}>
                                            <td>{item?.sala?.nome || "-"}</td>
                                            <td>{getPeriodoLabel(item.periodo)}</td>
                                            <td>{item.origemLabel}</td>
                                            <td>{item.titulo}</td>
                                            <td>
                                                {item.subtitulo || item.observacoes || "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}

            {payload ? (
                <div className="page-card">
                    <div className="page-card-header">
                        <div>
                            <h3>Lista detalhada</h3>
                            <p>Relação completa da ocupação da data consultada.</p>
                        </div>
                    </div>

                    {!payload?.listaDetalhada?.length ? (
                        <div className="empty-state">
                            Nenhuma ocupação encontrada para a data selecionada.
                        </div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Sala</th>
                                        <th>Período</th>
                                        <th>Origem</th>
                                        <th>Título</th>
                                        <th>Complemento</th>
                                        <th>Conflito</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payload.listaDetalhada.map((item, index) => (
                                        <tr key={`${item.origem}_${item.id}_${index}`}>
                                            <td>{item?.sala?.nome || "-"}</td>
                                            <td>{getPeriodoLabel(item.periodo)}</td>
                                            <td>
                                                <span className={getOrigemBadgeClass(item.origem)}>
                                                    {item.origemLabel}
                                                </span>
                                            </td>
                                            <td>{item.titulo}</td>
                                            <td>
                                                {item.subtitulo || item.observacoes || "-"}
                                            </td>
                                            <td>
                                                {item.conflito ? (
                                                    <span className="badge danger">Sim</span>
                                                ) : (
                                                    <span className="badge success">Não</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : null}
        </Layout>
    );
}