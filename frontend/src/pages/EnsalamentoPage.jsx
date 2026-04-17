import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const DIA_OPTIONS = [
    { value: "SEGUNDA", label: "Segunda-feira", shortLabel: "Segunda-feira" },
    { value: "TERCA", label: "Terça-feira", shortLabel: "Terça-feira" },
    { value: "QUARTA", label: "Quarta-feira", shortLabel: "Quarta-feira" },
    { value: "QUINTA", label: "Quinta-feira", shortLabel: "Quinta-feira" },
    { value: "SEXTA", label: "Sexta-feira", shortLabel: "Sexta-feira" },
    { value: "SABADO", label: "Sábado", shortLabel: "Sábado" },
];

const PERIODO_OPTIONS = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
];

const initialForm = {
    salaId: "",
    turmaId: "",
    diaSemana: "SEGUNDA",
    periodo: "NOITE",
    textoLivre: "",
    observacoes: "",
    ativo: true,
};

const initialLoteForm = {
    turmaId: "",
    periodo: "NOITE",
    textoLivre: "",
    observacoes: "",
    ativo: true,
};

function getDiaLabel(value) {
    return DIA_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function getPeriodoLabel(value) {
    return PERIODO_OPTIONS.find((item) => item.value === value)?.label || value || "-";
}

function formatSalaLabel(sala) {
    if (!sala) return "-";
    const capacidade = sala.capacidade ? ` (${sala.capacidade})` : "";
    const bloco = sala.bloco ? ` - ${sala.bloco}` : "";
    return `${sala.nome}${capacidade}${bloco}`;
}

function formatTurmaLabel(turma) {
    if (!turma) return "-";
    const cursoNome = turma.curso?.nome ? ` - ${turma.curso.nome}` : "";
    return `${turma.nome}${cursoNome}`;
}

function getItemPrincipal(item) {
    if (!item) return "-";
    if (item?.turma?.nome) return item.turma.nome;
    if (item?.textoLivre) return item.textoLivre;
    return "-";
}

function getItemTipo(item) {
    if (!item) return "vazio";
    if (item?.turma?.nome) return "turma";
    if (item?.textoLivre) return "livre";
    return "vazio";
}

function getCellClassName(item) {
    const tipo = getItemTipo(item);

    if (tipo === "turma") return "ensalamento-cell ensalamento-cell--turma";
    if (tipo === "livre") return "ensalamento-cell ensalamento-cell--livre";
    return "ensalamento-cell ensalamento-cell--vazio";
}

function getPrintCellText(item) {
    if (!item) return "";
    if (item?.turma?.nome) return item.turma.nome;
    if (item?.textoLivre) return item.textoLivre;
    return "";
}

export default function EnsalamentoPage() {
    const { user } = useAuth();

    const [ensalamentos, setEnsalamentos] = useState([]);
    const [salas, setSalas] = useState([]);
    const [turmas, setTurmas] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    const [loteForm, setLoteForm] = useState(initialLoteForm);
    const [loteSelecoes, setLoteSelecoes] = useState({});

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sendingLote, setSendingLote] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loteResult, setLoteResult] = useState(null);

    const [filtroSalaId, setFiltroSalaId] = useState("");
    const [filtroDiaSemana, setFiltroDiaSemana] = useState("");
    const [filtroPeriodo, setFiltroPeriodo] = useState("");
    const [busca, setBusca] = useState("");

    const canManage = [
        "admin",
        "pedagogico",
        "coordenacao",
        "coordsetor",
        "secretaria",
    ].includes(user?.role);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [ensalamentosData, salasData, turmasData] = await Promise.all([
                apiRequest("/ensalamento").catch(() => []),
                apiRequest("/salas").catch(() => []),
                apiRequest("/turmas").catch(() => []),
            ]);

            setEnsalamentos(Array.isArray(ensalamentosData) ? ensalamentosData : []);
            setSalas(Array.isArray(salasData) ? salasData : []);
            setTurmas(Array.isArray(turmasData) ? turmasData : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar dados de ensalamento.");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function handleLoteChange(event) {
        const { name, value, type, checked } = event.target;

        setLoteForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function resetForm() {
        setForm(initialForm);
        setEditingId(null);
    }

    function resetLote() {
        setLoteForm(initialLoteForm);
        setLoteSelecoes({});
        setLoteResult(null);
    }

    function handleEdit(item) {
        setEditingId(item.id);
        setError("");
        setSuccess("");

        setForm({
            salaId: item?.salaId ? String(item.salaId) : "",
            turmaId: item?.turmaId ? String(item.turmaId) : "",
            diaSemana: item?.diaSemana || "SEGUNDA",
            periodo: item?.periodo || "NOITE",
            textoLivre: item?.textoLivre || "",
            observacoes: item?.observacoes || "",
            ativo: item?.ativo !== false,
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCancelEdit() {
        resetForm();
        setError("");
        setSuccess("");
    }

    function validateForm() {
        if (!form.salaId) {
            return "Selecione uma sala.";
        }

        if (!form.turmaId && !form.textoLivre.trim()) {
            return "Informe uma turma ou um texto livre.";
        }

        return "";
    }

    function buildPayload() {
        return {
            salaId: Number(form.salaId),
            turmaId: form.turmaId ? Number(form.turmaId) : null,
            diaSemana: form.diaSemana,
            periodo: form.periodo,
            textoLivre: form.textoLivre.trim() || null,
            observacoes: form.observacoes.trim() || null,
            ativo: Boolean(form.ativo),
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSending(true);
            setError("");
            setSuccess("");

            const payload = buildPayload();

            if (editingId) {
                await apiRequest(`/ensalamento/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });

                setSuccess("Item de ensalamento atualizado com sucesso.");
            } else {
                await apiRequest("/ensalamento", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                setSuccess("Item de ensalamento cadastrado com sucesso.");
            }

            resetForm();
            await loadData();
        } catch (err) {
            setError(err.message || "Erro ao salvar ensalamento.");
        } finally {
            setSending(false);
        }
    }

    async function handleDelete(item) {
        const confirmar = window.confirm(
            `Deseja realmente excluir o ensalamento da sala "${item?.sala?.nome || "-"}" em ${getDiaLabel(item.diaSemana)} / ${getPeriodoLabel(item.periodo)}?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            await apiRequest(`/ensalamento/${item.id}`, {
                method: "DELETE",
            });

            setSuccess("Item de ensalamento excluído com sucesso.");

            if (editingId === item.id) {
                resetForm();
            }

            await loadData();
        } catch (err) {
            setError(err.message || "Erro ao excluir ensalamento.");
        }
    }

    function toggleLoteSelecao(salaId, diaSemana) {
        const key = `${salaId}_${diaSemana}`;

        setLoteSelecoes((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    }

    function handleMarcarTodosDias(diaSemana) {
        const novasSelecoes = { ...loteSelecoes };

        salasOrdenadas.forEach((sala) => {
            novasSelecoes[`${sala.id}_${diaSemana}`] = true;
        });

        setLoteSelecoes(novasSelecoes);
    }

    function handleDesmarcarTodosDias(diaSemana) {
        const novasSelecoes = { ...loteSelecoes };

        salasOrdenadas.forEach((sala) => {
            novasSelecoes[`${sala.id}_${diaSemana}`] = false;
        });

        setLoteSelecoes(novasSelecoes);
    }

    function handleMarcarSalaInteira(salaId) {
        const novasSelecoes = { ...loteSelecoes };

        DIA_OPTIONS.forEach((dia) => {
            novasSelecoes[`${salaId}_${dia.value}`] = true;
        });

        setLoteSelecoes(novasSelecoes);
    }

    function handleDesmarcarSalaInteira(salaId) {
        const novasSelecoes = { ...loteSelecoes };

        DIA_OPTIONS.forEach((dia) => {
            novasSelecoes[`${salaId}_${dia.value}`] = false;
        });

        setLoteSelecoes(novasSelecoes);
    }

    function handleLimparSelecoesLote() {
        setLoteSelecoes({});
    }

    const totalSelecionadosLote = useMemo(() => {
        return Object.values(loteSelecoes).filter(Boolean).length;
    }, [loteSelecoes]);

    async function handleSubmitLote() {
        if (!totalSelecionadosLote) {
            setError("Selecione ao menos uma combinação de sala e dia.");
            return;
        }

        if (!loteForm.turmaId && !loteForm.textoLivre.trim()) {
            setError("No cadastro em lote, informe uma turma ou um texto livre.");
            return;
        }

        try {
            setSendingLote(true);
            setError("");
            setSuccess("");
            setLoteResult(null);

            const itens = Object.entries(loteSelecoes)
                .filter(([, checked]) => checked)
                .map(([key]) => {
                    const [salaId, diaSemana] = key.split("_");

                    return {
                        salaId: Number(salaId),
                        turmaId: loteForm.turmaId ? Number(loteForm.turmaId) : null,
                        diaSemana,
                        periodo: loteForm.periodo,
                        textoLivre: loteForm.textoLivre.trim() || null,
                        observacoes: loteForm.observacoes.trim() || null,
                        ativo: Boolean(loteForm.ativo),
                    };
                });

            const result = await apiRequest("/ensalamento/lote", {
                method: "POST",
                body: JSON.stringify({ itens }),
            });

            setLoteResult(result || null);

            const criados = result?.successCount ?? 0;
            const conflitos = result?.errorCount ?? 0;

            setSuccess(
                `Cadastro em lote concluído. ${criados} item(ns) criado(s) e ${conflitos} conflito(s)/erro(s).`
            );

            if (criados > 0) {
                handleLimparSelecoesLote();
                await loadData();
            }
        } catch (err) {
            setError(err.message || "Erro ao cadastrar ensalamento em lote.");
        } finally {
            setSendingLote(false);
        }
    }

    const ensalamentosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        return ensalamentos.filter((item) => {
            const matchSala =
                !filtroSalaId || String(item.salaId) === String(filtroSalaId);

            const matchDia =
                !filtroDiaSemana || item.diaSemana === filtroDiaSemana;

            const matchPeriodo =
                !filtroPeriodo || item.periodo === filtroPeriodo;

            const textoBusca = [
                item?.sala?.nome,
                item?.turma?.nome,
                item?.turma?.curso?.nome,
                item?.textoLivre,
                item?.observacoes,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchBusca = !termo || textoBusca.includes(termo);

            return matchSala && matchDia && matchPeriodo && matchBusca;
        });
    }, [ensalamentos, filtroSalaId, filtroDiaSemana, filtroPeriodo, busca]);

    const salasOrdenadas = useMemo(() => {
        return [...salas]
            .filter((sala) => sala?.ativo !== false)
            .sort((a, b) => {
                const ordemA = a?.ordem ?? 0;
                const ordemB = b?.ordem ?? 0;

                if (ordemA !== ordemB) return ordemA - ordemB;
                return String(a?.nome || "").localeCompare(String(b?.nome || ""));
            });
    }, [salas]);

    const matrizEnsalamento = useMemo(() => {
        return salasOrdenadas.map((sala) => {
            const celulas = {};

            DIA_OPTIONS.forEach((dia) => {
                PERIODO_OPTIONS.forEach((periodo) => {
                    const key = `${dia.value}_${periodo.value}`;
                    celulas[key] =
                        ensalamentos.find(
                            (item) =>
                                String(item.salaId) === String(sala.id) &&
                                item.diaSemana === dia.value &&
                                item.periodo === periodo.value
                        ) || null;
                });
            });

            return {
                sala,
                celulas,
            };
        });
    }, [salasOrdenadas, ensalamentos]);

    const matrizImpressao = useMemo(() => {
        return salasOrdenadas.map((sala) => {
            const periodos = PERIODO_OPTIONS.map((periodo) => {
                const dias = DIA_OPTIONS.map((dia) => {
                    const item =
                        ensalamentos.find(
                            (ensalamento) =>
                                String(ensalamento.salaId) === String(sala.id) &&
                                ensalamento.diaSemana === dia.value &&
                                ensalamento.periodo === periodo.value
                        ) || null;

                    return {
                        dia: dia.value,
                        periodo: periodo.value,
                        item,
                    };
                });

                return {
                    periodo: periodo.value,
                    dias,
                };
            });

            return {
                sala,
                periodos,
            };
        });
    }, [salasOrdenadas, ensalamentos]);

    return (
        <Layout
            title="Ensalamento"
            subtitle="Organize a ocupação fixa das salas por dia e período"
        >
            <style>{`
                .ensalamento-grid-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    min-width: 1100px;
                }

                .ensalamento-grid-table th,
                .ensalamento-grid-table td {
                    border: 1px solid #e5e7eb;
                    vertical-align: top;
                    padding: 10px;
                    background: #fff;
                }

                .ensalamento-grid-table thead th {
                    background: #f8fafc;
                    font-weight: 700;
                    text-align: center;
                }

                .ensalamento-sala-col {
                    min-width: 180px;
                    background: #f8fafc !important;
                }

                .ensalamento-day-col {
                    min-width: 180px;
                }

                .ensalamento-day-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .ensalamento-cell {
                    border-radius: 12px;
                    padding: 10px;
                    min-height: 84px;
                    border: 1px solid #e5e7eb;
                }

                .ensalamento-cell--turma {
                    background: #ecfdf5;
                    border-color: #86efac;
                }

                .ensalamento-cell--livre {
                    background: #eff6ff;
                    border-color: #93c5fd;
                }

                .ensalamento-cell--vazio {
                    background: #f8fafc;
                    border-style: dashed;
                    color: #94a3b8;
                }

                .ensalamento-periodo {
                    font-size: 12px;
                    font-weight: 700;
                    margin-bottom: 6px;
                    color: #475569;
                    text-transform: uppercase;
                }

                .ensalamento-principal {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    line-height: 1.3;
                }

                .ensalamento-secundario {
                    font-size: 12px;
                    color: #475569;
                    margin-top: 6px;
                    line-height: 1.35;
                }

                .ensalamento-badge-inline {
                    display: inline-flex;
                    align-items: center;
                    padding: 2px 8px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 700;
                    margin-top: 6px;
                }

                .ensalamento-badge-inline--turma {
                    background: #dcfce7;
                    color: #166534;
                }

                .ensalamento-badge-inline--livre {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .ensalamento-badge-inline--vazio {
                    background: #e2e8f0;
                    color: #475569;
                }

                .ensalamento-legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 16px;
                }

                .ensalamento-legend-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    color: #334155;
                }

                .ensalamento-legend-box {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    border: 1px solid #cbd5e1;
                }

                .ensalamento-legend-box--turma {
                    background: #ecfdf5;
                    border-color: #86efac;
                }

                .ensalamento-legend-box--livre {
                    background: #eff6ff;
                    border-color: #93c5fd;
                }

                .ensalamento-legend-box--vazio {
                    background: #f8fafc;
                    border-style: dashed;
                }

                .ensalamento-lote-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    min-width: 900px;
                }

                .ensalamento-lote-table th,
                .ensalamento-lote-table td {
                    border: 1px solid #e5e7eb;
                    padding: 8px;
                    text-align: center;
                    background: #fff;
                }

                .ensalamento-lote-table thead th {
                    background: #f8fafc;
                    font-weight: 700;
                }

                .ensalamento-lote-sala {
                    text-align: left !important;
                    min-width: 180px;
                    background: #f8fafc !important;
                }

                .ensalamento-lote-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-top: 12px;
                }

                .ensalamento-lote-mini-actions {
                    display: flex;
                    gap: 6px;
                    flex-wrap: wrap;
                    margin-top: 6px;
                }

                .ensalamento-lote-mini-btn {
                    border: none;
                    background: #e2e8f0;
                    color: #334155;
                    padding: 4px 8px;
                    border-radius: 8px;
                    font-size: 12px;
                    cursor: pointer;
                }

                .ensalamento-lote-mini-btn:hover {
                    background: #cbd5e1;
                }

                .ensalamento-lote-result-error {
                    border: 1px solid #fecaca;
                    background: #fef2f2;
                    border-radius: 12px;
                    padding: 10px;
                    margin-top: 10px;
                }

                .only-print {
                    display: none;
                }

                .print-title {
                    text-align: center;
                    font-size: 22px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    font-family: "Times New Roman", serif;
                    color: #000;
                }

                .ensalamento-print-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    font-size: 10px;
                    background: #fff;
                }

                .ensalamento-print-table th,
                .ensalamento-print-table td {
                    border: 1px solid #000;
                    padding: 3px 5px;
                    text-align: center;
                    vertical-align: middle;
                    line-height: 1.15;
                    color: #000;
                }

                .ensalamento-print-table thead th {
                    background: #d9ead3 !important;
                    font-weight: 700;
                }

                .print-col-sala {
                    width: 90px;
                }

                .print-col-periodo {
                    width: 70px;
                }

                .print-sala-cell {
                    font-weight: 700;
                    background: #eef7ea !important;
                    text-align: left !important;
                }

                .print-periodo-cell {
                    font-weight: 700;
                    background: #f8f8f8 !important;
                }

                .print-card {
                    padding: 0 !important;
                    border: none !important;
                    box-shadow: none !important;
                    background: transparent !important;
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }

                    .only-print,
                    .only-print * {
                        visibility: visible;
                    }

                    .only-print {
                        display: block !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: #fff;
                    }

                    .no-print {
                        display: none !important;
                    }

                    .page-card,
                    .table-wrapper,
                    .print-card {
                        box-shadow: none !important;
                        border: none !important;
                        background: transparent !important;
                    }

                    @page {
                        size: landscape;
                        margin: 8mm;
                    }
                }
            `}</style>

            {error ? <div className="alert alert-error">{error}</div> : null}
            {success ? <div className="alert alert-success">{success}</div> : null}

            {canManage ? (
                <>
                    <div className="page-card no-print">
                        <div className="page-card-header">
                            <div>
                                <h3>Cadastro em lote</h3>
                                <p>
                                    Defina turma ou texto livre no topo, selecione o período e marque
                                    múltiplas combinações de sala e dia da semana.
                                </p>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Turma</label>
                                <select
                                    name="turmaId"
                                    value={loteForm.turmaId}
                                    onChange={handleLoteChange}
                                >
                                    <option value="">Não vincular turma</option>
                                    {turmas
                                        .filter((turma) => turma?.ativo !== false)
                                        .map((turma) => (
                                            <option key={turma.id} value={turma.id}>
                                                {formatTurmaLabel(turma)}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Período</label>
                                <select
                                    name="periodo"
                                    value={loteForm.periodo}
                                    onChange={handleLoteChange}
                                >
                                    {PERIODO_OPTIONS.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Texto livre</label>
                                <input
                                    type="text"
                                    name="textoLivre"
                                    value={loteForm.textoLivre}
                                    onChange={handleLoteChange}
                                    placeholder="Ex: Café Pedagógico / Auditório"
                                />
                            </div>

                            <div className="form-group">
                                <label>Ativo</label>
                                <select
                                    name="ativo"
                                    value={loteForm.ativo ? "true" : "false"}
                                    onChange={(e) =>
                                        setLoteForm((prev) => ({
                                            ...prev,
                                            ativo: e.target.value === "true",
                                        }))
                                    }
                                >
                                    <option value="true">Sim</option>
                                    <option value="false">Não</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Observações</label>
                            <textarea
                                name="observacoes"
                                rows="3"
                                value={loteForm.observacoes}
                                onChange={handleLoteChange}
                                placeholder="Ex: Uso regular / Reservado para atividade institucional"
                            />
                        </div>

                        <div className="table-wrapper">
                            <table className="ensalamento-lote-table">
                                <thead>
                                    <tr>
                                        <th className="ensalamento-lote-sala">Sala</th>
                                        {DIA_OPTIONS.map((dia) => (
                                            <th key={dia.value}>
                                                <div>{dia.label}</div>
                                                <div className="ensalamento-lote-mini-actions">
                                                    <button
                                                        type="button"
                                                        className="ensalamento-lote-mini-btn"
                                                        onClick={() => handleMarcarTodosDias(dia.value)}
                                                    >
                                                        Marcar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="ensalamento-lote-mini-btn"
                                                        onClick={() => handleDesmarcarTodosDias(dia.value)}
                                                    >
                                                        Limpar
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {salasOrdenadas.map((sala) => (
                                        <tr key={sala.id}>
                                            <td className="ensalamento-lote-sala">
                                                <div className="table-primary-text">{sala.nome}</div>
                                                <div className="table-secondary-text">
                                                    {sala.capacidade ? `Cap. ${sala.capacidade}` : "Sem capacidade"}
                                                    {sala.bloco ? ` • ${sala.bloco}` : ""}
                                                </div>

                                                <div className="ensalamento-lote-mini-actions">
                                                    <button
                                                        type="button"
                                                        className="ensalamento-lote-mini-btn"
                                                        onClick={() => handleMarcarSalaInteira(sala.id)}
                                                    >
                                                        Marcar linha
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="ensalamento-lote-mini-btn"
                                                        onClick={() => handleDesmarcarSalaInteira(sala.id)}
                                                    >
                                                        Limpar linha
                                                    </button>
                                                </div>
                                            </td>

                                            {DIA_OPTIONS.map((dia) => {
                                                const key = `${sala.id}_${dia.value}`;

                                                return (
                                                    <td key={key}>
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(loteSelecoes[key])}
                                                            onChange={() =>
                                                                toggleLoteSelecao(sala.id, dia.value)
                                                            }
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="ensalamento-lote-actions">
                            <span className="badge neutral">
                                {totalSelecionadosLote} seleção(ões)
                            </span>

                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSubmitLote}
                                disabled={sendingLote}
                            >
                                {sendingLote ? "Cadastrando..." : "Cadastrar ensalamento em lote"}
                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleLimparSelecoesLote}
                            >
                                Limpar seleções
                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={resetLote}
                            >
                                Resetar lote
                            </button>
                        </div>

                        {loteResult?.errors?.length ? (
                            <div style={{ marginTop: 16 }}>
                                <div className="alert alert-warning">
                                    Alguns itens não puderam ser criados.
                                </div>

                                {loteResult.errors.map((item, index) => (
                                    <div key={index} className="ensalamento-lote-result-error">
                                        <strong>
                                            Sala {item.salaId} • {getDiaLabel(item.diaSemana)} • {getPeriodoLabel(item.periodo)}
                                        </strong>
                                        <div>{item.message}</div>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div className="page-card no-print">
                        <div className="page-card-header">
                            <div>
                                <h3>{editingId ? "Editar ensalamento" : "Novo ensalamento"}</h3>
                                <p>
                                    Vincule a sala a uma turma ou defina um texto livre para uso institucional.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="user-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Sala</label>
                                    <select
                                        name="salaId"
                                        value={form.salaId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecione uma sala</option>
                                        {salasOrdenadas.map((sala) => (
                                            <option key={sala.id} value={sala.id}>
                                                {formatSalaLabel(sala)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Dia da semana</label>
                                    <select
                                        name="diaSemana"
                                        value={form.diaSemana}
                                        onChange={handleChange}
                                    >
                                        {DIA_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Período</label>
                                    <select
                                        name="periodo"
                                        value={form.periodo}
                                        onChange={handleChange}
                                    >
                                        {PERIODO_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Turma</label>
                                    <select
                                        name="turmaId"
                                        value={form.turmaId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Não vincular turma</option>
                                        {turmas
                                            .filter((turma) => turma?.ativo !== false)
                                            .map((turma) => (
                                                <option key={turma.id} value={turma.id}>
                                                    {formatTurmaLabel(turma)}
                                                </option>
                                            ))}
                                    </select>
                                    <small className="form-help">
                                        Você pode escolher uma turma ou usar texto livre.
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Texto livre</label>
                                    <input
                                        type="text"
                                        name="textoLivre"
                                        value={form.textoLivre}
                                        onChange={handleChange}
                                        placeholder="Ex: Café Pedagógico / Não utilizar / Auditório"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Ativo</label>
                                    <select
                                        name="ativo"
                                        value={form.ativo ? "true" : "false"}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                ativo: e.target.value === "true",
                                            }))
                                        }
                                    >
                                        <option value="true">Sim</option>
                                        <option value="false">Não</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Observações</label>
                                <textarea
                                    name="observacoes"
                                    rows="3"
                                    value={form.observacoes}
                                    onChange={handleChange}
                                    placeholder="Ex: Uso compartilhado / Reservado para evento interno"
                                />
                            </div>

                            <div className="action-row">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={sending}
                                >
                                    {sending
                                        ? editingId
                                            ? "Salvando..."
                                            : "Cadastrando..."
                                        : editingId
                                            ? "Salvar alterações"
                                            : "Cadastrar ensalamento"}
                                </button>

                                {editingId ? (
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancelEdit}
                                    >
                                        Cancelar edição
                                    </button>
                                ) : null}
                            </div>
                        </form>
                    </div>
                </>
            ) : null}

            <div className="page-card no-print">
                <div className="page-card-header">
                    <div>
                        <h3>Quadro visual de ensalamento</h3>
                        <p>
                            Visualização geral da ocupação das salas por dia e por período.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => window.print()}
                    style={{ marginBottom: 16 }}
                >
                    Imprimir quadro
                </button>

                <div className="ensalamento-legend">
                    <div className="ensalamento-legend-item">
                        <span className="ensalamento-legend-box ensalamento-legend-box--turma" />
                        <span>Turma vinculada</span>
                    </div>

                    <div className="ensalamento-legend-item">
                        <span className="ensalamento-legend-box ensalamento-legend-box--livre" />
                        <span>Texto livre / uso institucional</span>
                    </div>

                    <div className="ensalamento-legend-item">
                        <span className="ensalamento-legend-box ensalamento-legend-box--vazio" />
                        <span>Sem ocupação</span>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">Carregando quadro de ensalamento...</div>
                ) : (
                    <div className="table-wrapper">
                        <table className="ensalamento-grid-table">
                            <thead>
                                <tr>
                                    <th className="ensalamento-sala-col">Sala</th>
                                    {DIA_OPTIONS.map((dia) => (
                                        <th key={dia.value} className="ensalamento-day-col">
                                            {dia.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {matrizEnsalamento.length ? (
                                    matrizEnsalamento.map(({ sala, celulas }) => (
                                        <tr key={sala.id}>
                                            <td className="ensalamento-sala-col">
                                                <div className="table-primary-text">{sala.nome}</div>
                                                <div className="table-secondary-text">
                                                    {sala.capacidade
                                                        ? `Cap. ${sala.capacidade}`
                                                        : "Capacidade não informada"}
                                                    {sala.bloco ? ` • ${sala.bloco}` : ""}
                                                </div>
                                            </td>

                                            {DIA_OPTIONS.map((dia) => (
                                                <td key={`${sala.id}_${dia.value}`} className="ensalamento-day-col">
                                                    <div className="ensalamento-day-stack">
                                                        {PERIODO_OPTIONS.map((periodo) => {
                                                            const item = celulas[`${dia.value}_${periodo.value}`];
                                                            const tipo = getItemTipo(item);

                                                            return (
                                                                <div
                                                                    key={`${sala.id}_${dia.value}_${periodo.value}`}
                                                                    className={getCellClassName(item)}
                                                                >
                                                                    <div className="ensalamento-periodo">
                                                                        {getPeriodoLabel(periodo.value)}
                                                                    </div>

                                                                    <div className="ensalamento-principal">
                                                                        {getItemPrincipal(item)}
                                                                    </div>

                                                                    <div
                                                                        className={
                                                                            tipo === "turma"
                                                                                ? "ensalamento-badge-inline ensalamento-badge-inline--turma"
                                                                                : tipo === "livre"
                                                                                    ? "ensalamento-badge-inline ensalamento-badge-inline--livre"
                                                                                    : "ensalamento-badge-inline ensalamento-badge-inline--vazio"
                                                                        }
                                                                    >
                                                                        {tipo === "turma"
                                                                            ? "Turma"
                                                                            : tipo === "livre"
                                                                                ? "Texto livre"
                                                                                : "Livre"}
                                                                    </div>

                                                                    {item?.turma?.curso?.nome ? (
                                                                        <div className="ensalamento-secundario">
                                                                            {item.turma.curso.nome}
                                                                        </div>
                                                                    ) : null}

                                                                    {item?.observacoes ? (
                                                                        <div className="ensalamento-secundario">
                                                                            {item.observacoes}
                                                                        </div>
                                                                    ) : null}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={1 + DIA_OPTIONS.length}>
                                            Nenhum ensalamento cadastrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="only-print">
                <div className="print-title">Ensalamento</div>

                <div className="print-card">
                    <table className="ensalamento-print-table">
                        <thead>
                            <tr>
                                <th className="print-col-sala">Sala</th>
                                <th className="print-col-periodo">Período</th>
                                {DIA_OPTIONS.map((dia) => (
                                    <th key={dia.value}>{dia.shortLabel}</th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {matrizImpressao.length ? (
                                matrizImpressao.map(({ sala, periodos }) =>
                                    periodos.map((periodoRow, index) => (
                                        <tr key={`${sala.id}_${periodoRow.periodo}`}>
                                            {index === 0 ? (
                                                <td
                                                    className="print-sala-cell"
                                                    rowSpan={PERIODO_OPTIONS.length}
                                                >
                                                    {sala.nome}
                                                </td>
                                            ) : null}

                                            <td className="print-periodo-cell">
                                                {getPeriodoLabel(periodoRow.periodo)}
                                            </td>

                                            {periodoRow.dias.map(({ dia, item }) => (
                                                <td key={`${sala.id}_${periodoRow.periodo}_${dia}`}>
                                                    {getPrintCellText(item)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )
                            ) : (
                                <tr>
                                    <td colSpan={2 + DIA_OPTIONS.length}>
                                        Nenhum ensalamento cadastrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="page-card no-print">
                <div className="page-card-header">
                    <div>
                        <h3>Lista detalhada de ensalamentos</h3>
                        <p>
                            Filtre, revise e edite os registros individualmente.
                        </p>
                    </div>
                </div>

                <div className="filters-grid">
                    <div className="form-group">
                        <label>Buscar</label>
                        <input
                            type="text"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Sala, turma, texto livre, observações"
                        />
                    </div>

                    <div className="form-group">
                        <label>Sala</label>
                        <select
                            value={filtroSalaId}
                            onChange={(e) => setFiltroSalaId(e.target.value)}
                        >
                            <option value="">Todas</option>
                            {salasOrdenadas.map((sala) => (
                                <option key={sala.id} value={sala.id}>
                                    {formatSalaLabel(sala)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Dia</label>
                        <select
                            value={filtroDiaSemana}
                            onChange={(e) => setFiltroDiaSemana(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {DIA_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Período</label>
                        <select
                            value={filtroPeriodo}
                            onChange={(e) => setFiltroPeriodo(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {PERIODO_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="empty-state">Carregando ensalamentos...</div>
                ) : !ensalamentosFiltrados.length ? (
                    <div className="empty-state">
                        Nenhum ensalamento encontrado para os filtros selecionados.
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Sala</th>
                                    <th>Dia</th>
                                    <th>Período</th>
                                    <th>Turma</th>
                                    <th>Texto livre</th>
                                    <th>Observações</th>
                                    <th>Status</th>
                                    {canManage ? <th>Ações</th> : null}
                                </tr>
                            </thead>

                            <tbody>
                                {ensalamentosFiltrados.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item?.sala?.nome || "-"}</td>
                                        <td>{getDiaLabel(item.diaSemana)}</td>
                                        <td>{getPeriodoLabel(item.periodo)}</td>
                                        <td>{item?.turma?.nome || "-"}</td>
                                        <td>{item?.textoLivre || "-"}</td>
                                        <td>{item?.observacoes || "-"}</td>
                                        <td>
                                            <span
                                                className={
                                                    item?.ativo !== false
                                                        ? "badge success"
                                                        : "badge neutral"
                                                }
                                            >
                                                {item?.ativo !== false ? "Ativo" : "Inativo"}
                                            </span>
                                        </td>

                                        {canManage ? (
                                            <td>
                                                <div className="actions-wrap">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleDelete(item)}
                                                    >
                                                        Excluir
                                                    </button>
                                                </div>
                                            </td>
                                        ) : null}
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