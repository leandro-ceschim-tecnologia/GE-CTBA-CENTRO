import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const TIPO_OPTIONS = [
    { value: "CURSO_INTENSIVO", label: "Curso Intensivo" },
    { value: "PALESTRA", label: "Palestra" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "TREINAMENTO", label: "Treinamento" },
    { value: "MINICURSO", label: "Minicurso" },
    { value: "EVENTO", label: "Evento" },
    { value: "SEGUNDA_CHAMADA_RECUPERACAO", label: "2ª Chamada / Recuperação" },
    { value: "OUTRO", label: "Outro" },
];

const PUBLICO_OPTIONS = [
    { value: "ALUNO", label: "Aluno" },
    { value: "INSTRUTOR", label: "Instrutor" },
    { value: "COMERCIAL", label: "Comercial" },
    { value: "SECRETARIA", label: "Secretaria" },
    { value: "COORDENACAO", label: "Coordenação" },
    { value: "COORDSETOR", label: "Coordenação de Setor" },
    { value: "PEDAGOGICO", label: "Pedagógico" },
    { value: "ADMIN", label: "Admin" },
];

const PERIODOS = [
    { value: "MANHA", label: "Manhã" },
    { value: "TARDE", label: "Tarde" },
    { value: "NOITE", label: "Noite" },
];

const initialForm = {
    titulo: "",
    tipo: "EVENTO",
    descricao: "",
    observacoes: "",
    local: "",
    dataEvento: "",
    horaInicio: "",
    horaFim: "",
    inicioInscricoes: "",
    fimInscricoes: "",
    vagas: "",
    permiteInscricao: true,
    possuiCertificacao: false,
    cargaHoraria: "",
    temaCertificado: "",
    instrutorId: "",
    publicosAlvo: [],
    espacos: [],
};

function formatDateInput(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function createEmptyEspaco() {
    return {
        salaId: "",
        textoLivre: "",
        observacoes: "",
    };
}

function formatSalaLabel(sala) {
    if (!sala) return "-";
    const capacidade = sala.capacidade ? ` (${sala.capacidade})` : "";
    const bloco = sala.bloco ? ` - ${sala.bloco}` : "";
    return `${sala.nome}${capacidade}${bloco}`;
}

function timeToMinutes(value) {
    if (!value || typeof value !== "string") return null;
    const [hour, minute] = value.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return hour * 60 + minute;
}

function getPeriodosFromHorario(horaInicio, horaFim) {
    const inicio = timeToMinutes(horaInicio);
    const fim = timeToMinutes(horaFim);

    if (inicio === null && fim === null) {
        return ["NOITE"];
    }

    const inicioFinal = inicio ?? fim;
    const fimFinal = fim ?? inicio;

    const periodos = new Set();

    if (inicioFinal < 12 * 60 && fimFinal > 6 * 60) {
        periodos.add("MANHA");
    }

    if (inicioFinal < 18 * 60 && fimFinal > 12 * 60) {
        periodos.add("TARDE");
    }

    if (inicioFinal < 24 * 60 && fimFinal > 18 * 60) {
        periodos.add("NOITE");
    }

    if (!periodos.size) {
        if (inicioFinal < 12 * 60) return ["MANHA"];
        if (inicioFinal < 18 * 60) return ["TARDE"];
        return ["NOITE"];
    }

    return Array.from(periodos);
}

function getPeriodoLabel(value) {
    return PERIODOS.find((item) => item.value === value)?.label || value || "-";
}

export default function OfertaFormPage() {
    const navigate = useNavigate();
    const params = useParams();
    const ofertaId = params.id;
    const isEditing = Boolean(ofertaId);

    const [form, setForm] = useState(initialForm);
    const [salas, setSalas] = useState([]);
    const [instrutores, setInstrutores] = useState([]);

    const [loading, setLoading] = useState(isEditing);
    const [loadingAux, setLoadingAux] = useState(true);
    const [sending, setSending] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [ocupacaoInfo, setOcupacaoInfo] = useState(null);
    const [loadingOcupacao, setLoadingOcupacao] = useState(false);
    const [ocupacaoError, setOcupacaoError] = useState("");

    useEffect(() => {
        loadAuxData();
    }, []);

    useEffect(() => {
        if (isEditing) {
            loadOferta();
        }
    }, [isEditing, ofertaId]);

    useEffect(() => {
        const hasSalaSelecionada = form.espacos.some((item) => item.salaId);
        if (!form.dataEvento || !hasSalaSelecionada) {
            setOcupacaoInfo(null);
            setOcupacaoError("");
            return;
        }

        const timer = setTimeout(() => {
            checkOcupacao();
        }, 350);

        return () => clearTimeout(timer);
    }, [form.dataEvento, form.horaInicio, form.horaFim, form.espacos]);

    async function loadAuxData() {
        try {
            setLoadingAux(true);
            setError("");

            const [salasData, usersData] = await Promise.all([
                apiRequest("/salas").catch(() => []),
                apiRequest("/users").catch(() => []),
            ]);

            setSalas(
                Array.isArray(salasData)
                    ? salasData.filter((item) => item?.ativo !== false)
                    : []
            );

            const listaInstrutores = Array.isArray(usersData)
                ? usersData.filter(
                    (item) =>
                        item?.ativo !== false &&
                        [
                            "instrutor",
                            "pedagogico",
                            "coordenacao",
                            "coordsetor",
                            "admin",
                        ].includes(item.role)
                )
                : [];

            setInstrutores(listaInstrutores);
        } catch (err) {
            setError(err.message || "Erro ao carregar dados auxiliares.");
        } finally {
            setLoadingAux(false);
        }
    }

    async function loadOferta() {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(`/ofertas/${ofertaId}`);

            setForm({
                titulo: data?.titulo || "",
                tipo: data?.tipo || "EVENTO",
                descricao: data?.descricao || "",
                observacoes: data?.observacoes || "",
                local: data?.local || "",
                dataEvento: formatDateInput(data?.dataEvento),
                horaInicio: data?.horaInicio || "",
                horaFim: data?.horaFim || "",
                inicioInscricoes: formatDateInput(data?.inicioInscricoes),
                fimInscricoes: formatDateInput(data?.fimInscricoes),
                vagas:
                    data?.vagas === null || data?.vagas === undefined
                        ? ""
                        : String(data.vagas),
                permiteInscricao: Boolean(data?.permiteInscricao),
                possuiCertificacao: Boolean(data?.possuiCertificacao),
                cargaHoraria:
                    data?.cargaHoraria === null || data?.cargaHoraria === undefined
                        ? ""
                        : String(data.cargaHoraria),
                temaCertificado: data?.temaCertificado || "",
                instrutorId: data?.instrutorId ? String(data.instrutorId) : "",
                publicosAlvo: Array.isArray(data?.publicosAlvo)
                    ? data.publicosAlvo.map((item) => item.role)
                    : [],
                espacos:
                    Array.isArray(data?.espacos) && data.espacos.length
                        ? data.espacos.map((item) => ({
                            salaId: item?.salaId ? String(item.salaId) : "",
                            textoLivre: item?.textoLivre || "",
                            observacoes: item?.observacoes || "",
                        }))
                        : [],
            });
        } catch (err) {
            setError(err.message || "Erro ao carregar oferta.");
        } finally {
            setLoading(false);
        }
    }

    async function checkOcupacao() {
        try {
            setLoadingOcupacao(true);
            setOcupacaoError("");

            const data = await apiRequest(`/ocupacao-salas?data=${form.dataEvento}`);
            setOcupacaoInfo(data || null);
        } catch (err) {
            setOcupacaoInfo(null);
            setOcupacaoError(err.message || "Não foi possível validar a ocupação das salas.");
        } finally {
            setLoadingOcupacao(false);
        }
    }

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function handlePublicoChange(value) {
        setForm((prev) => {
            const exists = prev.publicosAlvo.includes(value);

            return {
                ...prev,
                publicosAlvo: exists
                    ? prev.publicosAlvo.filter((item) => item !== value)
                    : [...prev.publicosAlvo, value],
            };
        });
    }

    function handleEspacoChange(index, field, value) {
        setForm((prev) => ({
            ...prev,
            espacos: prev.espacos.map((item, itemIndex) =>
                itemIndex === index
                    ? {
                        ...item,
                        [field]: value,
                    }
                    : item
            ),
        }));
    }

    function handleAddEspaco() {
        setForm((prev) => ({
            ...prev,
            espacos: [...prev.espacos, createEmptyEspaco()],
        }));
    }

    function handleRemoveEspaco(index) {
        setForm((prev) => ({
            ...prev,
            espacos: prev.espacos.filter((_, itemIndex) => itemIndex !== index),
        }));
    }

    function buildPayload() {
        return {
            titulo: form.titulo,
            tipo: form.tipo,
            descricao: form.descricao || null,
            observacoes: form.observacoes || null,
            local: form.local || null,
            dataEvento: form.dataEvento,
            horaInicio: form.horaInicio || null,
            horaFim: form.horaFim || null,
            inicioInscricoes: form.inicioInscricoes || null,
            fimInscricoes: form.fimInscricoes || null,
            vagas: form.vagas === "" ? null : Number(form.vagas),
            permiteInscricao: form.permiteInscricao,
            possuiCertificacao: form.possuiCertificacao,
            cargaHoraria: form.cargaHoraria === "" ? null : Number(form.cargaHoraria),
            temaCertificado: form.temaCertificado || null,
            instrutorId: form.instrutorId === "" ? null : Number(form.instrutorId),
            publicosAlvo: form.publicosAlvo,
            espacos: form.espacos
                .map((item) => ({
                    salaId:
                        item.salaId === "" || item.salaId === null
                            ? null
                            : Number(item.salaId),
                    textoLivre: item.textoLivre?.trim() || null,
                    observacoes: item.observacoes?.trim() || null,
                }))
                .filter((item) => item.salaId || item.textoLivre),
        };
    }

    const periodosOferta = useMemo(() => {
        return getPeriodosFromHorario(form.horaInicio, form.horaFim);
    }, [form.horaInicio, form.horaFim]);

    const conflitosSalas = useMemo(() => {
        if (!ocupacaoInfo?.matrix?.length) return [];

        const selectedSalaIds = form.espacos
            .map((item) => (item.salaId ? String(item.salaId) : null))
            .filter(Boolean);

        if (!selectedSalaIds.length) return [];

        const conflitos = [];

        selectedSalaIds.forEach((salaId) => {
            const row = ocupacaoInfo.matrix.find(
                (entry) => String(entry?.sala?.id) === String(salaId)
            );

            if (!row) return;

            periodosOferta.forEach((periodo) => {
                const ocupacoes = row.periodos?.[periodo] || [];
                const ocupacoesReais = isEditing
                    ? ocupacoes.filter(
                        (item) => !(item.origem === "OFERTA" && String(item.id) === String(ofertaId))
                    )
                    : ocupacoes;

                if (ocupacoesReais.length) {
                    conflitos.push({
                        sala: row.sala,
                        periodo,
                        ocupacoes: ocupacoesReais,
                    });
                }
            });
        });

        return conflitos;
    }, [ocupacaoInfo, form.espacos, periodosOferta, isEditing, ofertaId]);

    const hasConflito = conflitosSalas.length > 0;

    const resumoEspacos = useMemo(() => {
        if (!form.espacos.length) return "Nenhum espaço adicionado.";

        return form.espacos
            .map((item) => {
                if (item.salaId) {
                    const sala = salas.find((s) => String(s.id) === String(item.salaId));
                    return sala ? formatSalaLabel(sala) : "Sala selecionada";
                }

                if (item.textoLivre?.trim()) {
                    return item.textoLivre.trim();
                }

                return null;
            })
            .filter(Boolean)
            .join(" | ");
    }, [form.espacos, salas]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (hasConflito) {
            setError(
                "Existem conflitos de ocupação para uma ou mais salas selecionadas. Ajuste os espaços antes de salvar a oferta."
            );
            return;
        }

        try {
            setSending(true);
            setError("");
            setSuccess("");

            const payload = buildPayload();

            if (isEditing) {
                await apiRequest(`/ofertas/${ofertaId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });

                setSuccess("Oferta atualizada com sucesso.");
            } else {
                await apiRequest("/ofertas", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                setSuccess("Oferta cadastrada com sucesso.");
            }

            setTimeout(() => {
                navigate("/ofertas");
            }, 800);
        } catch (err) {
            setError(err.message || "Erro ao salvar oferta.");
        } finally {
            setSending(false);
        }
    }

    return (
        <Layout
            title={isEditing ? "Editar Oferta Acadêmica" : "Nova Oferta Acadêmica"}
            subtitle="Cadastre eventos, workshops, palestras e demais ofertas da unidade"
        >
            <style>{`
                .oferta-espaco-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 16px;
                    background: #fff;
                }

                .oferta-conflito-card {
                    border: 1px solid #fca5a5;
                    background: #fef2f2;
                    border-radius: 14px;
                    padding: 12px;
                    margin-bottom: 10px;
                }

                .oferta-conflito-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #991b1b;
                    margin-bottom: 6px;
                }

                .oferta-conflito-text {
                    font-size: 13px;
                    color: #7f1d1d;
                    line-height: 1.45;
                }
            `}</style>

            <div className="page-card">
                <div className="page-card-header">
                    <div>
                        <h3>{isEditing ? "Editar oferta" : "Cadastrar oferta"}</h3>
                        <p>
                            Defina os dados principais, público-alvo, certificação e espaços
                            utilizados.
                        </p>
                    </div>
                </div>

                {loading || loadingAux ? (
                    <div className="empty-state">Carregando formulário...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="user-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Título</label>
                                <input
                                    type="text"
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    placeholder="Ex: Workshop de Atualização em Radiologia"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo</label>
                                <select
                                    name="tipo"
                                    value={form.tipo}
                                    onChange={handleChange}
                                >
                                    {TIPO_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Data do evento</label>
                                <input
                                    type="date"
                                    name="dataEvento"
                                    value={form.dataEvento}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Hora início</label>
                                <input
                                    type="time"
                                    name="horaInicio"
                                    value={form.horaInicio}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Hora fim</label>
                                <input
                                    type="time"
                                    name="horaFim"
                                    value={form.horaFim}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Instrutor / responsável</label>
                                <select
                                    name="instrutorId"
                                    value={form.instrutorId}
                                    onChange={handleChange}
                                >
                                    <option value="">Não informar</option>
                                    {instrutores.map((instrutor) => (
                                        <option key={instrutor.id} value={instrutor.id}>
                                            {instrutor.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Início das inscrições</label>
                                <input
                                    type="date"
                                    name="inicioInscricoes"
                                    value={form.inicioInscricoes}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Fim das inscrições</label>
                                <input
                                    type="date"
                                    name="fimInscricoes"
                                    value={form.fimInscricoes}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Vagas</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="vagas"
                                    value={form.vagas}
                                    onChange={handleChange}
                                    placeholder="Ex: 40"
                                />
                            </div>

                            <div className="form-group">
                                <label>Local resumo</label>
                                <input
                                    type="text"
                                    name="local"
                                    value={form.local}
                                    onChange={handleChange}
                                    placeholder="Ex: Sala 04 | Auditório"
                                />
                                <small className="form-help">
                                    Opcional. Se deixar em branco, o sistema monta automaticamente
                                    com base nos espaços adicionados.
                                </small>
                            </div>

                            <div className="form-group">
                                <label>Carga horária</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="cargaHoraria"
                                    value={form.cargaHoraria}
                                    onChange={handleChange}
                                    placeholder="Ex: 4"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tema do certificado</label>
                                <input
                                    type="text"
                                    name="temaCertificado"
                                    value={form.temaCertificado}
                                    onChange={handleChange}
                                    placeholder="Ex: Atualização em Anatomia"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Descrição</label>
                            <textarea
                                name="descricao"
                                rows="4"
                                value={form.descricao}
                                onChange={handleChange}
                                placeholder="Descreva a proposta da oferta."
                            />
                        </div>

                        <div className="form-group">
                            <label>Observações internas</label>
                            <textarea
                                name="observacoes"
                                rows="3"
                                value={form.observacoes}
                                onChange={handleChange}
                                placeholder="Informações complementares para uso interno."
                            />
                        </div>

                        <div className="form-group">
                            <label>Público-alvo</label>
                            <div className="checkbox-grid">
                                {PUBLICO_OPTIONS.map((item) => (
                                    <label key={item.value} className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={form.publicosAlvo.includes(item.value)}
                                            onChange={() => handlePublicoChange(item.value)}
                                        />
                                        <span>{item.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Configurações adicionais</label>
                            <div className="checkbox-grid">
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        name="permiteInscricao"
                                        checked={form.permiteInscricao}
                                        onChange={handleChange}
                                    />
                                    <span>Permitir inscrição</span>
                                </label>

                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        name="possuiCertificacao"
                                        checked={form.possuiCertificacao}
                                        onChange={handleChange}
                                    />
                                    <span>Possui certificação</span>
                                </label>
                            </div>
                        </div>

                        <div className="page-card" style={{ marginTop: 24 }}>
                            <div className="page-card-header">
                                <div>
                                    <h3>Espaços da oferta</h3>
                                    <p>
                                        Adicione uma ou mais salas vinculadas ou texto livre para
                                        decisão pedagógica.
                                    </p>
                                </div>

                                <div className="actions-wrap">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleAddEspaco}
                                    >
                                        Adicionar espaço
                                    </button>
                                </div>
                            </div>

                            {!form.espacos.length ? (
                                <div className="empty-state">
                                    Nenhum espaço adicionado.
                                </div>
                            ) : (
                                <div className="stack-md">
                                    {form.espacos.map((espaco, index) => (
                                        <div key={index} className="oferta-espaco-card">
                                            <div className="form-grid">
                                                <div className="form-group">
                                                    <label>Sala cadastrada</label>
                                                    <select
                                                        value={espaco.salaId}
                                                        onChange={(e) =>
                                                            handleEspacoChange(index, "salaId", e.target.value)
                                                        }
                                                    >
                                                        <option value="">Selecione uma sala</option>
                                                        {salas.map((sala) => (
                                                            <option key={sala.id} value={sala.id}>
                                                                {formatSalaLabel(sala)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label>Texto livre</label>
                                                    <input
                                                        type="text"
                                                        value={espaco.textoLivre}
                                                        onChange={(e) =>
                                                            handleEspacoChange(index, "textoLivre", e.target.value)
                                                        }
                                                        placeholder="Ex: Auditório + Sala 05 de apoio"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Observações do espaço</label>
                                                    <input
                                                        type="text"
                                                        value={espaco.observacoes}
                                                        onChange={(e) =>
                                                            handleEspacoChange(index, "observacoes", e.target.value)
                                                        }
                                                        placeholder="Ex: Distribuição por demanda"
                                                    />
                                                </div>
                                            </div>

                                            <div className="action-row">
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleRemoveEspaco(index)}
                                                >
                                                    Remover espaço
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Prévia do resumo automático</label>
                                <div className="table-secondary-text">{resumoEspacos}</div>
                            </div>

                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label>Períodos considerados para validação</label>
                                <div className="table-secondary-text">
                                    {periodosOferta.map(getPeriodoLabel).join(", ")}
                                </div>
                            </div>

                            {loadingOcupacao ? (
                                <div className="alert alert-warning" style={{ marginTop: 16 }}>
                                    Verificando ocupação das salas...
                                </div>
                            ) : null}

                            {ocupacaoError ? (
                                <div className="alert alert-warning" style={{ marginTop: 16 }}>
                                    {ocupacaoError}
                                </div>
                            ) : null}

                            {hasConflito ? (
                                <div style={{ marginTop: 16 }}>
                                    <div className="alert alert-error">
                                        Foram encontrados conflitos de ocupação para a data e horários informados.
                                    </div>

                                    {conflitosSalas.map((conflito, index) => (
                                        <div key={index} className="oferta-conflito-card">
                                            <div className="oferta-conflito-title">
                                                {conflito?.sala?.nome || "Sala"} • {getPeriodoLabel(conflito.periodo)}
                                            </div>

                                            <div className="oferta-conflito-text">
                                                {conflito.ocupacoes.map((item, itemIndex) => (
                                                    <div key={itemIndex}>
                                                        <strong>{item.origemLabel}:</strong> {item.titulo}
                                                        {item.subtitulo ? ` • ${item.subtitulo}` : ""}
                                                        {item.horaInicio || item.horaFim
                                                            ? ` • ${item.horaInicio || "--:--"} às ${item.horaFim || "--:--"}`
                                                            : ""}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : form.dataEvento && form.espacos.some((item) => item.salaId) && !loadingOcupacao ? (
                                <div className="alert alert-success" style={{ marginTop: 16 }}>
                                    Nenhum conflito de ocupação encontrado para as salas selecionadas.
                                </div>
                            ) : null}
                        </div>

                        {error ? <div className="alert alert-error">{error}</div> : null}
                        {success ? <div className="alert alert-success">{success}</div> : null}

                        <div className="action-row" style={{ marginTop: 24 }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={sending || hasConflito}
                            >
                                {sending
                                    ? isEditing
                                        ? "Salvando..."
                                        : "Cadastrando..."
                                    : isEditing
                                        ? "Salvar alterações"
                                        : "Cadastrar oferta"}
                            </button>

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate("/ofertas")}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Layout>
    );
}