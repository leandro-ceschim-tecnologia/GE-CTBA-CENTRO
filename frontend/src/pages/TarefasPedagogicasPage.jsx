import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const TIPO_OPTIONS = [
    { value: "LEVANTAMENTO_CH_ESTAGIO", label: "Levantamento de CH de Estágio" },
    { value: "CONTATO_INSTRUTOR", label: "Contato com instrutor" },
    { value: "AJUSTE_CRONOGRAMA", label: "Ajuste de cronograma" },
    { value: "DOCUMENTACAO_ESTAGIO", label: "Documentação de estágio" },
    { value: "LANCAMENTO_SISTEMA", label: "Lançamento em sistema" },
    { value: "CONFERENCIA_DIARIOS", label: "Conferência de diários" },
    { value: "RESPONDER_WHATS_AD", label: "Responder WhatsApp e AD" },
    { value: "CONTATO_ALUNO", label: "Contato com aluno" },
    { value: "EMISSAO_DOCUMENTO", label: "Emissão de documento" },
    { value: "LIGACOES_PARA_LFR", label: "Ligações para LFR" },
    { value: "LIGACOES_PARA_LFI", label: "Ligações para LFI" },
    { value: "LIGACOES_PARA_NC_LAC", label: "Ligações para NC e LAC" },
    { value: "LIGACOES_FALTOSOS", label: "Ligações para faltosos T e P" },
    { value: "REQUERIMENTOS_SECRETARIA", label: "Entregar requerimentos sem custo para a secretaria" },
    { value: "SEPARAR_MATERIAL", label: "Separar pastas e cestas para aulas" },
    { value: "OUTRO", label: "Outro" },
];

const TURNO_OPTIONS = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
    { value: "INTEGRAL", label: "Integral" },
    { value: "SABADO", label: "Sábado" },
];

const STATUS_OPTIONS = [
    { value: "PENDENTE", label: "Pendente" },
    { value: "EM_EXECUCAO", label: "Em execução" },
    { value: "CONCLUIDA", label: "Concluída" },
    { value: "CANCELADA", label: "Cancelada" },
];

function formatDateBR(value) {
    if (!value) return "-";
    const [yyyy, mm, dd] = String(value).split("-");
    if (!yyyy || !mm || !dd) return value;
    return `${dd}/${mm}/${yyyy}`;
}

function getTodayLocalISO() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function parseLoteDates(texto = "") {
    return texto
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean)
        .map((linha) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(linha)) {
                return linha;
            }

            if (/^\d{2}\/\d{2}\/\d{4}$/.test(linha)) {
                const [dd, mm, yyyy] = linha.split("/");
                return `${yyyy}-${mm}-${dd}`;
            }

            return null;
        })
        .filter(Boolean);
}

function isAtrasada(tarefa) {
    if (!tarefa?.prazo) return false;
    if (tarefa.status === "CONCLUIDA" || tarefa.status === "CANCELADA") return false;
    return tarefa.prazo < getTodayLocalISO();
}

function getStatusClass(tarefa) {
    if (isAtrasada(tarefa)) return "tp-status-atrasada";
    if (tarefa.status === "PENDENTE") return "tp-status-pendente";
    if (tarefa.status === "EM_EXECUCAO") return "tp-status-execucao";
    if (tarefa.status === "CONCLUIDA") return "tp-status-concluida";
    if (tarefa.status === "CANCELADA") return "tp-status-cancelada";
    return "";
}

function getCardClass(tarefa) {
    if (isAtrasada(tarefa)) return "tp-task-card tp-task-card-atrasada";
    if (tarefa.status === "PENDENTE") return "tp-task-card tp-task-card-pendente";
    if (tarefa.status === "EM_EXECUCAO") return "tp-task-card tp-task-card-execucao";
    if (tarefa.status === "CONCLUIDA") return "tp-task-card tp-task-card-concluida";
    if (tarefa.status === "CANCELADA") return "tp-task-card tp-task-card-cancelada";
    return "tp-task-card";
}

export default function TarefasPedagogicasPage() {
    const { user } = useAuth();

    const [tarefas, setTarefas] = useState([]);
    const [resumo, setResumo] = useState({});
    const [pedagogicos, setPedagogicos] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [filtroResponsavel, setFiltroResponsavel] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("");

    const [modal, setModal] = useState({
        open: false,
        type: "",
        title: "",
        message: "",
        tarefa: null,
        onConfirm: null,
    });

    const [form, setForm] = useState({
        titulo: "",
        tipo: "",
        prazo: "",
        turno: "",
        responsavelId: "",
        descricao: "",
        observacoes: "",
        loteDatas: "",
    });

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [tarefasRes, resumoRes, pedagogicosRes] = await Promise.all([
                apiRequest("/tarefas-pedagogicas"),
                apiRequest("/tarefas-pedagogicas/resumo"),
                apiRequest("/tarefas-pedagogicas/pedagogicos"),
            ]);

            setTarefas(Array.isArray(tarefasRes) ? tarefasRes : []);
            setResumo(resumoRes || {});
            setPedagogicos(Array.isArray(pedagogicosRes) ? pedagogicosRes : []);
        } catch (err) {
            console.error(err);
            setError("Não foi possível carregar as tarefas pedagógicas.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function resetForm() {
        setForm({
            titulo: "",
            tipo: "",
            prazo: "",
            turno: "",
            responsavelId: "",
            descricao: "",
            observacoes: "",
            loteDatas: "",
        });
    }

    function closeModal() {
        setModal({
            open: false,
            type: "",
            title: "",
            message: "",
            tarefa: null,
            onConfirm: null,
        });
    }

    async function submitCreate(confirmarAutoAgendamento = false) {
        const datasLote = parseLoteDates(form.loteDatas);

        if (datasLote.length > 0) {
            const payloadLote = {
                titulo: form.titulo,
                tipo: form.tipo,
                datas: datasLote,
                turno: form.turno,
                responsavelId: Number(form.responsavelId),
                descricao: form.descricao,
                observacoes: form.observacoes,
            };

            const response = await apiRequest("/tarefas-pedagogicas/lote", {
                method: "POST",
                body: JSON.stringify(payloadLote),
            });

            return response;
        }

        const payload = {
            titulo: form.titulo,
            tipo: form.tipo,
            prazo: form.prazo,
            turno: form.turno,
            responsavelId: Number(form.responsavelId),
            descricao: form.descricao,
            observacoes: form.observacoes,
            confirmarAutoAgendamento,
        };

        const response = await apiRequest("/tarefas-pedagogicas", {
            method: "POST",
            body: JSON.stringify(payload),
        });

        return response;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const response = await submitCreate(false);

            if (!response?.success && response?.requiresConfirmation) {
                setModal({
                    open: true,
                    type: "confirm",
                    title: "Confirmação de agendamento",
                    message: response.message,
                    tarefa: null,
                    onConfirm: async () => {
                        try {
                            setSaving(true);
                            closeModal();
                            const confirmResponse = await submitCreate(true);

                            if (!confirmResponse?.success) {
                                setError(confirmResponse?.message || "Não foi possível criar a tarefa.");
                                return;
                            }

                            setSuccess(confirmResponse.message || "Tarefa criada com sucesso.");
                            resetForm();
                            await loadData();
                        } catch (err) {
                            console.error(err);
                            setError("Erro ao confirmar criação da tarefa.");
                        } finally {
                            setSaving(false);
                        }
                    },
                });
                return;
            }

            if (!response?.success) {
                setError(response?.message || "Não foi possível criar a tarefa.");
                return;
            }

            setSuccess(response.message || "Tarefa criada com sucesso.");
            resetForm();
            await loadData();
        } catch (err) {
            console.error(err);
            setError("Não foi possível criar a tarefa.");
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(id, status) {
        try {
            setError("");
            setSuccess("");

            const response = await apiRequest(`/tarefas-pedagogicas/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });

            setSuccess(response?.message || "Status atualizado com sucesso.");
            closeModal();
            await loadData();
        } catch (err) {
            console.error(err);
            setError("Não foi possível atualizar o status da tarefa.");
        }
    }

    async function handleDelete(id) {
        try {
            setError("");
            setSuccess("");

            const response = await apiRequest(`/tarefas-pedagogicas/${id}`, {
                method: "DELETE",
            });

            setSuccess(response?.message || "Tarefa excluída com sucesso.");
            closeModal();
            await loadData();
        } catch (err) {
            console.error(err);
            setError("Não foi possível excluir a tarefa.");
        }
    }

    const tarefasFiltradas = useMemo(() => {
        return tarefas.filter((item) => {
            const matchResponsavel =
                !filtroResponsavel || Number(item.responsavelId) === Number(filtroResponsavel);

            const matchStatus = !filtroStatus || item.status === filtroStatus;

            return matchResponsavel && matchStatus;
        });
    }, [tarefas, filtroResponsavel, filtroStatus]);

    const minhasTarefas = useMemo(() => {
        if (user?.role === "admin") return tarefasFiltradas;
        return tarefasFiltradas.filter(
            (item) => Number(item.responsavelId) === Number(user?.id)
        );
    }, [tarefasFiltradas, user]);

    const minhasPendentes = minhasTarefas.filter((item) => item.status === "PENDENTE").length;
    const minhasExecucao = minhasTarefas.filter((item) => item.status === "EM_EXECUCAO").length;
    const minhasAtrasadas = minhasTarefas.filter((item) => isAtrasada(item)).length;

    return (
        <Layout
            title="Tarefas Pedagógicas"
            subtitle="Gestão de atividades do setor pedagógico"
        >
            <style>{`
                .tp-grid {
                    display: grid;
                    grid-template-columns: repeat(12, 1fr);
                    gap: 18px;
                }

                .tp-col-12 { grid-column: span 12; }
                .tp-col-8 { grid-column: span 8; }
                .tp-col-6 { grid-column: span 6; }
                .tp-col-4 { grid-column: span 4; }
                .tp-col-3 { grid-column: span 3; }

                .tp-section {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 18px;
                    padding: 22px;
                    margin-bottom: 22px;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
                }

                .tp-section h2,
                .tp-section h3 {
                    margin-top: 0;
                    color: #0f172a;
                }

                .tp-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
                    gap: 14px;
                }

                .tp-summary-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 18px;
                }

                .tp-summary-card strong {
                    display: block;
                    font-size: 1.5rem;
                    color: #0f172a;
                    margin-bottom: 6px;
                }

                .tp-summary-card span {
                    color: #64748b;
                    font-size: 0.92rem;
                }

                .tp-form-grid {
                    display: grid;
                    grid-template-columns: repeat(12, 1fr);
                    gap: 16px;
                }

                .tp-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .tp-form-group label {
                    font-weight: 700;
                    color: #334155;
                    font-size: 0.92rem;
                }

                .tp-form-group input,
                .tp-form-group select,
                .tp-form-group textarea {
                    width: 100%;
                    border: 1px solid #dbe4ee;
                    border-radius: 14px;
                    padding: 12px 14px;
                    font-size: 0.95rem;
                    box-sizing: border-box;
                    outline: none;
                    background: #fff;
                }

                .tp-form-group input:focus,
                .tp-form-group select:focus,
                .tp-form-group textarea:focus {
                    border-color: #0b7a2f;
                    box-shadow: 0 0 0 4px rgba(11, 122, 47, 0.12);
                }

                .tp-form-group textarea {
                    resize: vertical;
                    min-height: 120px;
                }

                .tp-help {
                    color: #64748b;
                    font-size: 0.82rem;
                }

                .tp-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .tp-btn {
                    border: none;
                    border-radius: 12px;
                    padding: 10px 14px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .tp-btn-primary {
                    background: #0b7a2f;
                    color: #fff;
                }

                .tp-btn-primary:hover {
                    background: #096826;
                }

                .tp-btn-secondary {
                    background: #e2e8f0;
                    color: #0f172a;
                }

                .tp-btn-danger {
                    background: transparent;
                    color: #dc2626;
                    border: 1px solid #dc2626;
                }

                .tp-alert {
                    border-radius: 14px;
                    padding: 14px 16px;
                    margin-bottom: 16px;
                    font-weight: 600;
                }

                .tp-alert-error {
                    background: #fff1f2;
                    color: #be123c;
                    border: 1px solid #fecdd3;
                }

                .tp-alert-success {
                    background: #f0fdf4;
                    color: #166534;
                    border: 1px solid #bbf7d0;
                }

                .tp-rules-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 18px;
                }

                .tp-rules-box ul {
                    margin: 0;
                    padding-left: 18px;
                    color: #334155;
                    line-height: 1.6;
                }

                .tp-filters-grid {
                    display: grid;
                    grid-template-columns: repeat(12, 1fr);
                    gap: 16px;
                }

                .tp-task-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 14px;
                }

                .tp-task-card {
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    border-radius: 16px;
                    padding: 16px;
                    cursor: pointer;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                    text-align: left;
                }

                .tp-task-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
                }

                .tp-task-card-pendente {
                    border-color: #ef4444;
                    background: #fef2f2;
                }

                .tp-task-card-execucao {
                    border-color: #3b82f6;
                    background: #eff6ff;
                }

                .tp-task-card-concluida {
                    border-color: #22c55e;
                    background: #f0fdf4;
                }

                .tp-task-card-atrasada {
                    border-color: #dc2626;
                    background: #fee2e2;
                }

                .tp-task-card-cancelada {
                    border-color: #94a3b8;
                    background: #f8fafc;
                    opacity: 0.88;
                }

                .tp-task-type,
                .tp-task-meta {
                    display: block;
                    font-size: 0.84rem;
                    color: #475569;
                    margin-bottom: 6px;
                }

                .tp-task-title {
                    display: block;
                    font-size: 1rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 8px 0 10px;
                }

                .tp-table-wrapper {
                    overflow-x: auto;
                }

                .tp-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .tp-table th,
                .tp-table td {
                    padding: 12px 10px;
                    border-bottom: 1px solid #e5e7eb;
                    text-align: left;
                    vertical-align: top;
                }

                .tp-table th {
                    color: #475569;
                    font-size: 0.86rem;
                }

                .tp-row-atrasada td {
                    background: #fef2f2;
                }

                .tp-status-badge {
                    display: inline-flex;
                    align-items: center;
                    border-radius: 999px;
                    padding: 6px 10px;
                    font-size: 0.8rem;
                    font-weight: 800;
                }

                .tp-status-pendente {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .tp-status-execucao {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .tp-status-concluida {
                    background: #dcfce7;
                    color: #166534;
                }

                .tp-status-atrasada {
                    background: #fecaca;
                    color: #991b1b;
                }

                .tp-status-cancelada {
                    background: #e2e8f0;
                    color: #334155;
                }

                .tp-empty {
                    border: 1px dashed #cbd5e1;
                    background: #f8fafc;
                    border-radius: 14px;
                    padding: 26px;
                    text-align: center;
                    color: #64748b;
                }

                .tp-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.45);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }

                .tp-modal {
                    width: 100%;
                    max-width: 760px;
                    background: #fff;
                    border-radius: 18px;
                    padding: 24px;
                    position: relative;
                    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
                }

                .tp-modal-close {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    border: none;
                    background: transparent;
                    font-size: 28px;
                    cursor: pointer;
                    color: #475569;
                }

                .tp-modal-title {
                    margin-top: 0;
                    margin-bottom: 16px;
                    color: #0f172a;
                }

                .tp-modal-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    padding: 16px;
                    margin-bottom: 16px;
                }

                .tp-modal-box ul {
                    margin: 0;
                    padding-left: 18px;
                    line-height: 1.7;
                    color: #334155;
                }

                .tp-modal-text {
                    white-space: pre-wrap;
                    color: #334155;
                    margin: 0;
                }

                @media (max-width: 900px) {
                    .tp-col-8, .tp-col-6, .tp-col-4, .tp-col-3, .tp-col-12 {
                        grid-column: span 12;
                    }
                }
            `}</style>

            <div className="tp-section">
                <h2>Tarefas Pedagógicas</h2>
                <p>Crie, distribua e acompanhe tarefas entre os usuários do setor pedagógico.</p>

                <div className="tp-summary-grid">
                    <div className="tp-summary-card"><strong>{resumo.total || 0}</strong><span>Total</span></div>
                    <div className="tp-summary-card"><strong>{resumo.pendentes || 0}</strong><span>Pendentes</span></div>
                    <div className="tp-summary-card"><strong>{resumo.emExecucao || 0}</strong><span>Em execução</span></div>
                    <div className="tp-summary-card"><strong>{resumo.concluidas || 0}</strong><span>Concluídas</span></div>
                    <div className="tp-summary-card"><strong>{resumo.atrasadas || 0}</strong><span>Atrasadas</span></div>
                    <div className="tp-summary-card"><strong>{minhasPendentes}</strong><span>Minhas pendentes</span></div>
                    <div className="tp-summary-card"><strong>{minhasExecucao}</strong><span>Minhas em execução</span></div>
                    <div className="tp-summary-card"><strong>{minhasAtrasadas}</strong><span>Minhas atrasadas</span></div>
                </div>
            </div>

            <div className="tp-col-4">
                <div className="tp-section">
                    <h3>Regras específicas</h3>
                    <div className="tp-rules-box">
                        <ul>
                            <li>Qualquer usuário pedagógico pode atribuir tarefas para outro usuário pedagógico.</li>
                            <li><strong>Levantamento de CH de Estágio</strong> aceita no máximo <strong>10 tarefas por quinta-feira</strong>.</li>
                            <li>Quando o limite for atingido, o sistema sugere automaticamente a próxima quinta-feira disponível.</li>
                            <li>Tarefas com prazo vencido ficam destacadas como atrasadas.</li>
                            <li>Apenas admin pode excluir tarefas.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="tp-col-8">
                <div className="tp-section">
                    <h3>Nova tarefa</h3>

                    {error ? <div className="tp-alert tp-alert-error">{error}</div> : null}
                    {success ? <div className="tp-alert tp-alert-success">{success}</div> : null}

                    <form className="tp-form-grid" onSubmit={handleSubmit}>
                        <div className="tp-form-group tp-col-12">
                            <label htmlFor="titulo">Título</label>
                            <input
                                id="titulo"
                                name="titulo"
                                value={form.titulo}
                                onChange={handleChange}
                                placeholder="Digite o título da tarefa"
                            />
                        </div>

                        <div className="tp-form-group tp-col-6">
                            <label htmlFor="tipo">Tipo</label>
                            <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange}>
                                <option value="">Selecione</option>
                                {TIPO_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="tp-form-group tp-col-6">
                            <label htmlFor="responsavelId">Responsável</label>
                            <select
                                id="responsavelId"
                                name="responsavelId"
                                value={form.responsavelId}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                {pedagogicos.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="tp-form-group tp-col-4">
                            <label htmlFor="turno">Turno</label>
                            <select id="turno" name="turno" value={form.turno} onChange={handleChange}>
                                <option value="">Selecione</option>
                                {TURNO_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="tp-form-group tp-col-4">
                            <label htmlFor="prazo">Prazo principal</label>
                            <input
                                id="prazo"
                                name="prazo"
                                type="date"
                                min={getTodayLocalISO()}
                                value={form.prazo}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tp-form-group tp-col-12">
                            <label htmlFor="loteDatas">Datas em lote</label>
                            <textarea
                                id="loteDatas"
                                name="loteDatas"
                                value={form.loteDatas}
                                onChange={handleChange}
                                placeholder={`Uma data por linha no formato DD/MM/AAAA\nEx:\n10/04/2026\n17/04/2026\n24/04/2026`}
                            />
                            <span className="tp-help">
                                Use para criar várias tarefas de uma vez. Não se aplica a Levantamento de CH de Estágio.
                            </span>
                        </div>

                        <div className="tp-form-group tp-col-12">
                            <label htmlFor="descricao">Descrição</label>
                            <textarea
                                id="descricao"
                                name="descricao"
                                value={form.descricao}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tp-form-group tp-col-12">
                            <label htmlFor="observacoes">Observações</label>
                            <textarea
                                id="observacoes"
                                name="observacoes"
                                value={form.observacoes}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="tp-col-12 tp-actions">
                            <button type="submit" className="tp-btn tp-btn-primary" disabled={saving}>
                                {saving ? "Salvando..." : "Criar tarefa"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="tp-section">
                <h3>Filtros</h3>

                <div className="tp-filters-grid">
                    <div className="tp-form-group tp-col-6">
                        <label htmlFor="filtroResponsavel">Responsável</label>
                        <select
                            id="filtroResponsavel"
                            value={filtroResponsavel}
                            onChange={(e) => setFiltroResponsavel(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {pedagogicos.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="tp-form-group tp-col-6">
                        <label htmlFor="filtroStatus">Status</label>
                        <select
                            id="filtroStatus"
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value)}
                        >
                            <option value="">Todos</option>
                            {STATUS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="tp-actions" style={{ marginTop: 16 }}>
                    <button
                        type="button"
                        className="tp-btn tp-btn-secondary"
                        onClick={() => {
                            setFiltroResponsavel("");
                            setFiltroStatus("");
                        }}
                    >
                        Limpar filtros
                    </button>
                </div>
            </div>

            <div className="tp-section">
                <h3>{user?.role === "admin" ? "Cards das tarefas" : "Minhas tarefas"}</h3>

                {!minhasTarefas.length ? (
                    <div className="tp-empty">Nenhuma tarefa encontrada.</div>
                ) : (
                    <div className="tp-task-grid">
                        {minhasTarefas.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={getCardClass(item)}
                                onClick={() =>
                                    setModal({
                                        open: true,
                                        type: "details",
                                        title: item.titulo,
                                        message: "",
                                        tarefa: item,
                                        onConfirm: null,
                                    })
                                }
                            >
                                <span className="tp-task-type">{item.tipoLabel}</span>
                                <strong className="tp-task-title">{item.titulo}</strong>
                                <span className="tp-task-meta">Turno: {item.turnoLabel}</span>
                                <span className="tp-task-meta">Prazo: {formatDateBR(item.prazo)}</span>
                                <span className="tp-task-meta">Status: {item.statusLabel}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="tp-section">
                <h3>Todas as tarefas</h3>

                {loading ? (
                    <div className="tp-empty">Carregando tarefas...</div>
                ) : !tarefasFiltradas.length ? (
                    <div className="tp-empty">Nenhuma tarefa cadastrada.</div>
                ) : (
                    <div className="tp-table-wrapper">
                        <table className="tp-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Tipo</th>
                                    <th>Turno</th>
                                    <th>Prazo</th>
                                    <th>Responsável</th>
                                    <th>Status</th>
                                    <th>Criado por</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tarefasFiltradas.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={isAtrasada(item) ? "tp-row-atrasada" : ""}
                                    >
                                        <td>{item.titulo}</td>
                                        <td>{item.tipoLabel}</td>
                                        <td>{item.turnoLabel}</td>
                                        <td>{formatDateBR(item.prazo)}</td>
                                        <td>{item.responsavelNome}</td>
                                        <td>
                                            <span className={`tp-status-badge ${getStatusClass(item)}`}>
                                                {isAtrasada(item) ? "Atrasada" : item.statusLabel}
                                            </span>
                                        </td>
                                        <td>{item.criadoPorNome}</td>
                                        <td>
                                            <div className="tp-actions">
                                                <button
                                                    type="button"
                                                    className="tp-btn tp-btn-secondary"
                                                    onClick={() =>
                                                        setModal({
                                                            open: true,
                                                            type: "details",
                                                            title: item.titulo,
                                                            message: "",
                                                            tarefa: item,
                                                            onConfirm: null,
                                                        })
                                                    }
                                                >
                                                    Ver
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modal.open && modal.type === "confirm" ? (
                <div className="tp-modal-overlay">
                    <div className="tp-modal">
                        <button type="button" className="tp-modal-close" onClick={closeModal}>×</button>
                        <h3 className="tp-modal-title">{modal.title}</h3>
                        <p className="tp-modal-text">{modal.message}</p>

                        <div className="tp-actions" style={{ marginTop: 20, justifyContent: "flex-end" }}>
                            <button type="button" className="tp-btn tp-btn-secondary" onClick={closeModal}>
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="tp-btn tp-btn-primary"
                                onClick={modal.onConfirm}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {modal.open && modal.type === "details" && modal.tarefa ? (
                <div className="tp-modal-overlay">
                    <div className="tp-modal">
                        <button type="button" className="tp-modal-close" onClick={closeModal}>×</button>
                        <h3 className="tp-modal-title">{modal.tarefa.titulo}</h3>

                        <div className="tp-modal-box">
                            <ul>
                                <li><strong>Tipo:</strong> {modal.tarefa.tipoLabel}</li>
                                <li><strong>Turno:</strong> {modal.tarefa.turnoLabel}</li>
                                <li><strong>Prazo:</strong> {formatDateBR(modal.tarefa.prazo)}</li>
                                <li><strong>Status:</strong> {modal.tarefa.statusLabel}</li>
                                <li><strong>Responsável:</strong> {modal.tarefa.responsavelNome}</li>
                                <li><strong>Criado por:</strong> {modal.tarefa.criadoPorNome}</li>
                                <li><strong>Data de criação:</strong> {formatDateBR(modal.tarefa.dataCriacao)}</li>
                            </ul>
                        </div>

                        <div className="tp-modal-box">
                            <h4 style={{ marginTop: 0 }}>Descrição</h4>
                            <p className="tp-modal-text">{modal.tarefa.descricao || "Sem descrição."}</p>
                        </div>

                        {modal.tarefa.observacoes ? (
                            <div className="tp-modal-box">
                                <h4 style={{ marginTop: 0 }}>Observações</h4>
                                <p className="tp-modal-text">{modal.tarefa.observacoes}</p>
                            </div>
                        ) : null}

                        <div className="tp-actions" style={{ justifyContent: "space-between", marginTop: 20 }}>
                            <div className="tp-actions">
                                <button
                                    type="button"
                                    className="tp-btn tp-btn-secondary"
                                    onClick={() => handleStatusChange(modal.tarefa.id, "PENDENTE")}
                                >
                                    Pendente
                                </button>

                                <button
                                    type="button"
                                    className="tp-btn tp-btn-secondary"
                                    onClick={() => handleStatusChange(modal.tarefa.id, "EM_EXECUCAO")}
                                >
                                    Em execução
                                </button>

                                <button
                                    type="button"
                                    className="tp-btn tp-btn-primary"
                                    onClick={() => handleStatusChange(modal.tarefa.id, "CONCLUIDA")}
                                >
                                    Concluir
                                </button>

                                <button
                                    type="button"
                                    className="tp-btn tp-btn-danger"
                                    onClick={() => handleStatusChange(modal.tarefa.id, "CANCELADA")}
                                >
                                    Cancelar
                                </button>

                                {user?.role === "admin" ? (
                                    <button
                                        type="button"
                                        className="tp-btn tp-btn-danger"
                                        onClick={() => handleDelete(modal.tarefa.id)}
                                    >
                                        Excluir
                                    </button>
                                ) : null}
                            </div>

                            <button type="button" className="tp-btn tp-btn-secondary" onClick={closeModal}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </Layout>
    );
}