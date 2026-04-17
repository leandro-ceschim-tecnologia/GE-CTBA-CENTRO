import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const DIA_OPTIONS = [
    { value: "SEGUNDA", label: "Segunda-feira" },
    { value: "TERCA", label: "Terça-feira" },
    { value: "QUARTA", label: "Quarta-feira" },
    { value: "QUINTA", label: "Quinta-feira" },
    { value: "SEXTA", label: "Sexta-feira" },
    { value: "SABADO", label: "Sábado" },
];

const PERIODO_OPTIONS = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
];

function getDiaLabel(value) {
    return DIA_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function getPeriodoLabel(value) {
    return PERIODO_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function getDiaOrder(value) {
    return DIA_OPTIONS.findIndex((item) => item.value === value);
}

function getPeriodoOrder(value) {
    return PERIODO_OPTIONS.findIndex((item) => item.value === value);
}

function formatSalaResumo(sala) {
    if (!sala) return "-";
    return sala.nome || "-";
}

export default function MeuEnsalamentoPage() {
    const [ensalamentos, setEnsalamentos] = useState([]);
    const [turma, setTurma] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadMeuEnsalamento();
    }, []);

    async function loadMeuEnsalamento() {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest("/ensalamento/meu");

            setEnsalamentos(Array.isArray(data?.ensalamentos) ? data.ensalamentos : []);
            setTurma(data?.turma || null);
        } catch (err) {
            setError(err.message || "Erro ao carregar ensalamento.");
        } finally {
            setLoading(false);
        }
    }

    const ensalamentosOrdenados = useMemo(() => {
        return [...ensalamentos].sort((a, b) => {
            const diaDiff = getDiaOrder(a.diaSemana) - getDiaOrder(b.diaSemana);
            if (diaDiff !== 0) return diaDiff;

            const periodoDiff = getPeriodoOrder(a.periodo) - getPeriodoOrder(b.periodo);
            if (periodoDiff !== 0) return periodoDiff;

            return String(a?.sala?.nome || "").localeCompare(String(b?.sala?.nome || ""));
        });
    }, [ensalamentos]);

    const agrupadoPorDia = useMemo(() => {
        return DIA_OPTIONS.map((dia) => ({
            ...dia,
            itens: ensalamentosOrdenados.filter((item) => item.diaSemana === dia.value),
        })).filter((grupo) => grupo.itens.length > 0);
    }, [ensalamentosOrdenados]);

    return (
        <Layout
            title="Meu Ensalamento"
            subtitle="Consulte as salas da sua turma por dia e período"
        >
            <style>{`
                .meu-ensalamento-header-card {
                    background: linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%);
                }

                .meu-ensalamento-resumo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 14px;
                    margin-top: 16px;
                }

                .meu-ensalamento-resumo-item {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 16px;
                }

                .meu-ensalamento-resumo-label {
                    font-size: 12px;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .meu-ensalamento-resumo-value {
                    font-size: 16px;
                    color: #0f172a;
                    font-weight: 700;
                    line-height: 1.35;
                }

                .meu-ensalamento-days-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 16px;
                }

                .meu-ensalamento-day-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    background: #fff;
                    overflow: hidden;
                }

                .meu-ensalamento-day-header {
                    padding: 14px 16px;
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }

                .meu-ensalamento-day-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #0f172a;
                }

                .meu-ensalamento-day-content {
                    padding: 14px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .meu-ensalamento-slot {
                    border: 1px solid #dbeafe;
                    background: #f8fbff;
                    border-radius: 16px;
                    padding: 14px;
                }

                .meu-ensalamento-slot-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 8px;
                }

                .meu-ensalamento-slot-periodo {
                    font-size: 12px;
                    font-weight: 800;
                    color: #0f8a36;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }

                .meu-ensalamento-slot-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 999px;
                    background: #dbeafe;
                    color: #0f8a36;
                    font-size: 11px;
                    font-weight: 700;
                }

                .meu-ensalamento-slot-sala {
                    font-size: 18px;
                    font-weight: 800;
                    color: #0f172a;
                    line-height: 1.25;
                }

                .meu-ensalamento-slot-meta {
                    font-size: 13px;
                    color: #475569;
                    margin-top: 6px;
                    line-height: 1.4;
                }

                .meu-ensalamento-slot-obs {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px dashed #cbd5e1;
                    font-size: 13px;
                    color: #334155;
                    line-height: 1.45;
                }

                .meu-ensalamento-mini-table td,
                .meu-ensalamento-mini-table th {
                    white-space: nowrap;
                }
            `}</style>

            <div className="page-card meu-ensalamento-header-card">
                <div className="page-card-header">
                    <div>
                        <h3>Minha turma</h3>
                        <p>
                            {turma
                                ? `${turma.nome}${turma?.curso?.nome ? ` - ${turma.curso.nome}` : ""}`
                                : "Turma não identificada"}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">Carregando ensalamento...</div>
                ) : error ? (
                    <div className="alert alert-error">{error}</div>
                ) : !turma ? (
                    <div className="empty-state">
                        Você não está vinculado a uma turma no momento.
                    </div>
                ) : (
                    <div className="meu-ensalamento-resumo-grid">
                        <div className="meu-ensalamento-resumo-item">
                            <div className="meu-ensalamento-resumo-label">Turma</div>
                            <div className="meu-ensalamento-resumo-value">
                                {turma.nome || "-"}
                            </div>
                        </div>

                        <div className="meu-ensalamento-resumo-item">
                            <div className="meu-ensalamento-resumo-label">Curso</div>
                            <div className="meu-ensalamento-resumo-value">
                                {turma?.curso?.nome || "-"}
                            </div>
                        </div>

                        <div className="meu-ensalamento-resumo-item">
                            <div className="meu-ensalamento-resumo-label">Total de alocações</div>
                            <div className="meu-ensalamento-resumo-value">
                                {ensalamentosOrdenados.length}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="page-card">
                <div className="page-card-header">
                    <div>
                        <h3>Resumo das salas</h3>
                        <p>Visualização rápida por dia, período e sala.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">Carregando resumo...</div>
                ) : error ? (
                    <div className="alert alert-error">{error}</div>
                ) : !turma ? (
                    <div className="empty-state">
                        Você não está vinculado a uma turma no momento.
                    </div>
                ) : !ensalamentosOrdenados.length ? (
                    <div className="empty-state">
                        Nenhum ensalamento cadastrado para a sua turma.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table meu-ensalamento-mini-table">
                            <thead>
                                <tr>
                                    <th>Dia</th>
                                    <th>Período</th>
                                    <th>Sala</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ensalamentosOrdenados.map((item) => (
                                    <tr key={item.id}>
                                        <td>{getDiaLabel(item.diaSemana)}</td>
                                        <td>{getPeriodoLabel(item.periodo)}</td>
                                        <td>{formatSalaResumo(item.sala)}</td>
                                        <td>{item.observacoes || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="page-card">
                <div className="page-card-header">
                    <div>
                        <h3>Visualização por dia</h3>
                        <p>Organização mais simples para consulta no dia a dia.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">Carregando visualização...</div>
                ) : error ? (
                    <div className="alert alert-error">{error}</div>
                ) : !turma ? (
                    <div className="empty-state">
                        Você não está vinculado a uma turma no momento.
                    </div>
                ) : !agrupadoPorDia.length ? (
                    <div className="empty-state">
                        Nenhum ensalamento cadastrado para a sua turma.
                    </div>
                ) : (
                    <div className="meu-ensalamento-days-grid">
                        {agrupadoPorDia.map((grupo) => (
                            <div key={grupo.value} className="meu-ensalamento-day-card">
                                <div className="meu-ensalamento-day-header">
                                    <div className="meu-ensalamento-day-title">
                                        {grupo.label}
                                    </div>
                                </div>

                                <div className="meu-ensalamento-day-content">
                                    {grupo.itens.map((item) => (
                                        <div key={item.id} className="meu-ensalamento-slot">
                                            <div className="meu-ensalamento-slot-top">
                                                <div className="meu-ensalamento-slot-periodo">
                                                    {getPeriodoLabel(item.periodo)}
                                                </div>
                                                <div className="meu-ensalamento-slot-badge">
                                                    Sala definida
                                                </div>
                                            </div>

                                            <div className="meu-ensalamento-slot-sala">
                                                {item?.sala?.nome || "-"}
                                            </div>

                                            <div className="meu-ensalamento-slot-meta">
                                                {item?.sala?.capacidade
                                                    ? `Capacidade: ${item.sala.capacidade}`
                                                    : "Capacidade não informada"}
                                                {item?.sala?.bloco ? ` • ${item.sala.bloco}` : ""}
                                            </div>

                                            {item.observacoes ? (
                                                <div className="meu-ensalamento-slot-obs">
                                                    <strong>Observações:</strong> {item.observacoes}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
}