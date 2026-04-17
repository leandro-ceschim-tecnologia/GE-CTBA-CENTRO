import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const PUBLICO_OPTIONS = [
    { value: "ALUNO", label: "Aluno" },
    { value: "INSTRUTOR", label: "Instrutor" },
    { value: "COORDENACAO", label: "Coordenação" },
    { value: "COORDSETOR", label: "Coordenação de Setor" },
    { value: "PEDAGOGICO", label: "Pedagógico" },
    { value: "ADMIN", label: "Admin" },
    { value: "COMERCIAL", label: "Comercial" },
    { value: "SECRETARIA", label: "Secretaria" },
];

const PUBLICO_LABELS = {
    ALUNO: "Aluno",
    INSTRUTOR: "Instrutor",
    COORDENACAO: "Coordenação",
    COORDSETOR: "Coordenação de Setor",
    PEDAGOGICO: "Pedagógico",
    ADMIN: "Admin",
    COMERCIAL: "Comercial",
    SECRETARIA: "Secretaria",
};

const PRIORIDADE_OPTIONS = [
    { value: "ALTA", label: "Alta" },
    { value: "MEDIA", label: "Média" },
    { value: "BAIXA", label: "Baixa" },
];

const STATUS_OPTIONS = [
    { value: "RASCUNHO", label: "Rascunho" },
    { value: "PUBLICADO", label: "Publicado" },
    { value: "INATIVO", label: "Inativo" },
];

const ALCANCE_ALUNO_OPTIONS = [
    { value: "TODOS", label: "Todos os alunos" },
    { value: "CURSO", label: "Alunos de um curso" },
    { value: "TURMA", label: "Alunos de uma turma específica" },
    { value: "ESPECIFICO", label: "Aluno específico" },
];

const ALCANCE_GERAL_OPTIONS = [
    { value: "TODOS", label: "Todos deste público" },
    { value: "ESPECIFICO", label: "Usuário específico" },
];

function formatDateTimeBR(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function getStatusClass(statusEfetivo) {
    switch (statusEfetivo) {
        case "PUBLICADO":
            return "status-ativo";
        case "INATIVO":
            return "status-inativo";
        case "EXPIRADO":
            return "status-expirado";
        case "RASCUNHO":
        default:
            return "status-rascunho";
    }
}

function getRoleLabel(role) {
    return PUBLICO_LABELS[role] || role;
}

function normalizeRole(role) {
    return String(role || "").trim().toUpperCase();
}

function uniqNumbers(values = []) {
    return [...new Set(values.map(Number).filter(Boolean))];
}

export default function InformativosPage() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [informativos, setInformativos] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("TODOS");

    const [form, setForm] = useState({
        titulo: "",
        descricao: "",
        prioridade: "MEDIA",
        status: "RASCUNHO",
        dataPublicacao: "",
        dataExpiracao: "",
        publicos: [],
        alcances: {
            ALUNO: "TODOS",
            INSTRUTOR: "TODOS",
            COORDENACAO: "TODOS",
            COORDSETOR: "TODOS",
            PEDAGOGICO: "TODOS",
            ADMIN: "TODOS",
            COMERCIAL: "TODOS",
            SECRETARIA: "TODOS",
        },
        segmentacao: {
            ALUNO: {
                cursoIds: [],
                turmaIds: [],
                destinatarioIds: [],
            },
            INSTRUTOR: {
                destinatarioIds: [],
            },
            COORDENACAO: {
                destinatarioIds: [],
            },
            COORDSETOR: {
                destinatarioIds: [],
            },
            PEDAGOGICO: {
                destinatarioIds: [],
            },
            ADMIN: {
                destinatarioIds: [],
            },
            COMERCIAL: {
                destinatarioIds: [],
            },
            SECRETARIA: {
                destinatarioIds: [],
            },
        },
    });

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const results = await Promise.allSettled([
                apiRequest("/informativos"),
                apiRequest("/cursos"),
                apiRequest("/turmas"),
                apiRequest("/informativos/destinatarios"),
            ]);

            const [informativosRes, cursosRes, turmasRes, usuariosRes] = results;

            if (informativosRes.status === "fulfilled") {
                setInformativos(Array.isArray(informativosRes.value) ? informativosRes.value : []);
            } else {
                console.error("Erro informativos:", informativosRes.reason);
                setError("Não foi possível carregar os informativos.");
            }

            if (cursosRes.status === "fulfilled") {
                setCursos(Array.isArray(cursosRes.value) ? cursosRes.value : []);
            }

            if (turmasRes.status === "fulfilled") {
                setTurmas(Array.isArray(turmasRes.value) ? turmasRes.value : []);
            }

            if (usuariosRes.status === "fulfilled") {
                setUsuarios(Array.isArray(usuariosRes.value) ? usuariosRes.value : []);
            } else {
                console.warn("Usuários não carregados (provável 403)");
                setUsuarios([]);
            }
        } catch (err) {
            console.error(err);
            setError("Erro inesperado ao carregar a página.");
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

    function togglePublico(role) {
        setForm((prev) => {
            const exists = prev.publicos.includes(role);
            const nextPublicos = exists
                ? prev.publicos.filter((item) => item !== role)
                : [...prev.publicos, role];

            return {
                ...prev,
                publicos: nextPublicos,
            };
        });
    }

    function setAlcance(role, alcance) {
        setForm((prev) => {
            const next = {
                ...prev,
                alcances: {
                    ...prev.alcances,
                    [role]: alcance,
                },
                segmentacao: {
                    ...prev.segmentacao,
                    [role]:
                        role === "ALUNO"
                            ? {
                                cursoIds: [],
                                turmaIds: [],
                                destinatarioIds: [],
                            }
                            : {
                                destinatarioIds: [],
                            },
                },
            };

            return next;
        });
    }

    function updateSegmentacao(role, field, values) {
        setForm((prev) => ({
            ...prev,
            segmentacao: {
                ...prev.segmentacao,
                [role]: {
                    ...prev.segmentacao[role],
                    [field]: uniqNumbers(Array.isArray(values) ? values : [values]),
                },
            },
        }));
    }

    function getSelectedOptionsValues(selectElement) {
        return Array.from(selectElement.selectedOptions).map((option) => option.value);
    }

    const usuariosOrdenados = useMemo(() => {
        return [...usuarios].sort((a, b) =>
            String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
        );
    }, [usuarios]);

    const usuariosPorRole = useMemo(() => {
        const map = {
            ALUNO: [],
            INSTRUTOR: [],
            COORDENACAO: [],
            COORDSETOR: [],
            PEDAGOGICO: [],
            ADMIN: [],
            COMERCIAL: [],
            SECRETARIA: [],
        };

        for (const usuario of usuariosOrdenados) {
            const role = normalizeRole(usuario.role);
            if (map[role]) {
                map[role].push(usuario);
            }
        }

        return map;
    }, [usuariosOrdenados]);

    const cursoAlunoSelecionado = form.segmentacao.ALUNO.cursoIds[0] || null;

    const turmasFiltradasPorCurso = useMemo(() => {
        if (!cursoAlunoSelecionado) return [];

        return turmas
            .filter((turma) => Number(turma.cursoId) === Number(cursoAlunoSelecionado))
            .sort((a, b) =>
                String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR")
            );
    }, [turmas, cursoAlunoSelecionado]);

    const informativosFiltrados = useMemo(() => {
        return informativos.filter((item) => {
            const termo = search.trim().toLowerCase();

            const matchSearch =
                !termo ||
                item.titulo?.toLowerCase().includes(termo) ||
                item.descricao?.toLowerCase().includes(termo) ||
                item.segmentacaoResumo?.toLowerCase().includes(termo) ||
                item.createdBy?.nome?.toLowerCase().includes(termo);

            const matchStatus =
                statusFilter === "TODOS" || item.statusEfetivo === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [informativos, search, statusFilter]);

    function validateForm() {
        if (!form.titulo.trim()) {
            return "Informe o título.";
        }

        if (!form.descricao.trim()) {
            return "Informe a descrição.";
        }

        if (!form.publicos.length) {
            return "Selecione ao menos um público-alvo.";
        }

        if (
            form.dataPublicacao &&
            form.dataExpiracao &&
            form.dataExpiracao < form.dataPublicacao
        ) {
            return "A data de expiração não pode ser menor que a data de publicação.";
        }

        for (const role of form.publicos) {
            const alcance = form.alcances[role];
            const dados = form.segmentacao[role];

            if (role === "ALUNO") {
                if (alcance === "CURSO" && !dados.cursoIds.length) {
                    return "Selecione um curso para o público Aluno.";
                }

                if (alcance === "TURMA") {
                    if (!dados.cursoIds.length) {
                        return "Selecione o curso da turma para o público Aluno.";
                    }

                    if (!dados.turmaIds.length) {
                        return "Selecione ao menos uma turma para o público Aluno.";
                    }
                }

                if (alcance === "ESPECIFICO" && !dados.destinatarioIds.length) {
                    return "Selecione ao menos um aluno específico.";
                }
            } else {
                if (alcance === "ESPECIFICO" && !dados.destinatarioIds.length) {
                    return `Selecione ao menos um usuário específico para ${getRoleLabel(role)}.`;
                }
            }
        }

        return "";
    }

    function buildPayload() {
        const cursoIds = [];
        const turmaIds = [];
        const destinatarioIds = [];

        for (const role of form.publicos) {
            const alcance = form.alcances[role];
            const dados = form.segmentacao[role];

            if (role === "ALUNO") {
                if (alcance === "CURSO") {
                    cursoIds.push(...(dados.cursoIds || []));
                } else if (alcance === "TURMA") {
                    turmaIds.push(...(dados.turmaIds || []));
                } else if (alcance === "ESPECIFICO") {
                    destinatarioIds.push(...(dados.destinatarioIds || []));
                }
            } else if (alcance === "ESPECIFICO") {
                destinatarioIds.push(...(dados.destinatarioIds || []));
            }
        }

        return {
            titulo: form.titulo.trim(),
            descricao: form.descricao.trim(),
            prioridade: form.prioridade,
            status: form.status,
            dataPublicacao: form.dataPublicacao || undefined,
            dataExpiracao: form.dataExpiracao || undefined,
            publicos: form.publicos,
            cursoIds: uniqNumbers(cursoIds),
            turmaIds: uniqNumbers(turmaIds),
            destinatarioIds: uniqNumbers(destinatarioIds),
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            setSuccess("");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = buildPayload();

            await apiRequest("/informativos", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setSuccess("Informativo cadastrado com sucesso.");

            setForm({
                titulo: "",
                descricao: "",
                prioridade: "MEDIA",
                status: "RASCUNHO",
                dataPublicacao: "",
                dataExpiracao: "",
                publicos: [],
                alcances: {
                    ALUNO: "TODOS",
                    INSTRUTOR: "TODOS",
                    COORDENACAO: "TODOS",
                    COORDSETOR: "TODOS",
                    PEDAGOGICO: "TODOS",
                    ADMIN: "TODOS",
                    COMERCIAL: "TODOS",
                    SECRETARIA: "TODOS",
                },
                segmentacao: {
                    ALUNO: {
                        cursoIds: [],
                        turmaIds: [],
                        destinatarioIds: [],
                    },
                    INSTRUTOR: { destinatarioIds: [] },
                    COORDENACAO: { destinatarioIds: [] },
                    COORDSETOR: { destinatarioIds: [] },
                    PEDAGOGICO: { destinatarioIds: [] },
                    ADMIN: { destinatarioIds: [] },
                    COMERCIAL: { destinatarioIds: [] },
                    SECRETARIA: { destinatarioIds: [] },
                },
            });

            await loadData();
        } catch (err) {
            console.error(err);
            setError(err?.message || "Não foi possível salvar o informativo.");
            setSuccess("");
        } finally {
            setSaving(false);
        }
    }

    async function handleChangeStatus(id, status) {
        try {
            setError("");
            setSuccess("");

            await apiRequest(`/informativos/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });

            setSuccess("Status do informativo atualizado com sucesso.");
            await loadData();
        } catch (err) {
            console.error(err);
            setError("Não foi possível atualizar o status do informativo.");
        }
    }

    function renderAlcanceCard(role) {
        const alcance = form.alcances[role];
        const dados = form.segmentacao[role];

        if (role === "ALUNO") {
            return (
                <div className="informativos-segment-card">
                    <div className="informativos-segment-card-header">
                        <h4>Alcance para alunos</h4>
                        <p>
                            Defina se o informativo será exibido para todos os alunos,
                            para um curso, para uma turma específica ou para um aluno específico.
                        </p>
                    </div>

                    <div className="form-group col-12">
                        <label htmlFor="alcanceAluno">Alcance</label>
                        <select
                            id="alcanceAluno"
                            value={alcance}
                            onChange={(e) => setAlcance("ALUNO", e.target.value)}
                        >
                            {ALCANCE_ALUNO_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(alcance === "CURSO" || alcance === "TURMA") && (
                        <div className="form-group col-12">
                            <label htmlFor="alunoCursoId">
                                {alcance === "CURSO" ? "Curso" : "Curso da turma"}
                            </label>
                            <select
                                id="alunoCursoId"
                                value={dados.cursoIds[0] ? String(dados.cursoIds[0]) : ""}
                                onChange={(e) => {
                                    const value = e.target.value ? [Number(e.target.value)] : [];

                                    setForm((prev) => ({
                                        ...prev,
                                        segmentacao: {
                                            ...prev.segmentacao,
                                            ALUNO: {
                                                ...prev.segmentacao.ALUNO,
                                                cursoIds: value,
                                                turmaIds: [],
                                            },
                                        },
                                    }));
                                }}
                            >
                                <option value="">Selecione</option>
                                {cursos.map((curso) => (
                                    <option key={curso.id} value={curso.id}>
                                        {curso.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {alcance === "TURMA" && (
                        <div className="form-group col-12">
                            <label htmlFor="alunoTurmaIds">Turma</label>
                            <select
                                id="alunoTurmaIds"
                                multiple
                                value={dados.turmaIds.map(String)}
                                onChange={(e) =>
                                    updateSegmentacao(
                                        "ALUNO",
                                        "turmaIds",
                                        getSelectedOptionsValues(e.target)
                                    )
                                }
                                disabled={!dados.cursoIds.length}
                            >
                                {turmasFiltradasPorCurso.map((turma) => (
                                    <option key={turma.id} value={turma.id}>
                                        {turma.nome}
                                    </option>
                                ))}
                            </select>

                            {!dados.cursoIds.length && (
                                <small className="informativos-form-help">
                                    Selecione um curso para carregar as turmas.
                                </small>
                            )}
                        </div>
                    )}

                    {alcance === "ESPECIFICO" && (
                        <div className="form-group col-12">
                            <label htmlFor="alunoDestinatarioIds">Aluno específico</label>
                            <select
                                id="alunoDestinatarioIds"
                                multiple
                                value={dados.destinatarioIds.map(String)}
                                onChange={(e) =>
                                    updateSegmentacao(
                                        "ALUNO",
                                        "destinatarioIds",
                                        getSelectedOptionsValues(e.target)
                                    )
                                }
                                disabled={!usuariosPorRole.ALUNO.length}
                            >
                                {usuariosPorRole.ALUNO.map((usuario) => (
                                    <option key={usuario.id} value={usuario.id}>
                                        {usuario.nome}
                                    </option>
                                ))}
                            </select>

                            {!usuariosPorRole.ALUNO.length && (
                                <small className="informativos-form-help">
                                    Nenhum aluno disponível para seleção.
                                </small>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="informativos-segment-card">
                <div className="informativos-segment-card-header">
                    <h4>Alcance para {getRoleLabel(role).toLowerCase()}</h4>
                    <p>
                        Escolha se o informativo será exibido para todos deste público
                        ou para usuários específicos.
                    </p>
                </div>

                <div className="form-group col-12">
                    <label htmlFor={`alcance-${role}`}>Alcance</label>
                    <select
                        id={`alcance-${role}`}
                        value={alcance}
                        onChange={(e) => setAlcance(role, e.target.value)}
                    >
                        {ALCANCE_GERAL_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                {alcance === "ESPECIFICO" && (
                    <div className="form-group col-12">
                        <label htmlFor={`destinatarios-${role}`}>
                            {getRoleLabel(role)} específico
                        </label>
                        <select
                            id={`destinatarios-${role}`}
                            multiple
                            value={(dados.destinatarioIds || []).map(String)}
                            onChange={(e) =>
                                updateSegmentacao(
                                    role,
                                    "destinatarioIds",
                                    getSelectedOptionsValues(e.target)
                                )
                            }
                            disabled={!usuariosPorRole[role]?.length}
                        >
                            {(usuariosPorRole[role] || []).map((usuario) => (
                                <option key={usuario.id} value={usuario.id}>
                                    {usuario.nome}
                                </option>
                            ))}
                        </select>

                        {!usuariosPorRole[role]?.length && (
                            <small className="informativos-form-help">
                                Nenhum usuário disponível para esse público.
                            </small>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <Layout
            title="Informativos"
            subtitle="Cadastre, segmente e acompanhe os comunicados do sistema"
        >
            <div className="informativos-page">
                <div className="page-section">
                    <div className="page-header-actions">
                        <div>
                            <h2 className="page-section-title">Novo informativo</h2>
                            <p className="page-section-subtitle">
                                Crie comunicados com segmentação por público, alcance e usuários.
                            </p>
                        </div>
                    </div>

                    {error ? <div className="alert alert-error">{error}</div> : null}
                    {success ? <div className="alert alert-success">{success}</div> : null}

                    <form className="form-grid informativos-form" onSubmit={handleSubmit}>
                        <div className="form-group col-6">
                            <label htmlFor="titulo">Título</label>
                            <input
                                id="titulo"
                                name="titulo"
                                type="text"
                                value={form.titulo}
                                onChange={handleChange}
                                placeholder="Digite o título do informativo"
                            />
                        </div>

                        <div className="form-group col-3">
                            <label htmlFor="prioridade">Prioridade</label>
                            <select
                                id="prioridade"
                                name="prioridade"
                                value={form.prioridade}
                                onChange={handleChange}
                            >
                                {PRIORIDADE_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group col-3">
                            <label htmlFor="status">Status inicial</label>
                            <select
                                id="status"
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                            >
                                {STATUS_OPTIONS.map((item) => (
                                    <option key={item.value} value={item.value}>
                                        {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group col-12">
                            <label htmlFor="descricao">Descrição</label>
                            <textarea
                                id="descricao"
                                name="descricao"
                                rows={5}
                                value={form.descricao}
                                onChange={handleChange}
                                placeholder="Digite a descrição do informativo"
                            />
                        </div>

                        <div className="form-group col-3">
                            <label htmlFor="dataPublicacao">Data de publicação</label>
                            <input
                                id="dataPublicacao"
                                name="dataPublicacao"
                                type="date"
                                value={form.dataPublicacao}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group col-3">
                            <label htmlFor="dataExpiracao">Data de expiração</label>
                            <input
                                id="dataExpiracao"
                                name="dataExpiracao"
                                type="date"
                                value={form.dataExpiracao}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group col-12">
                            <label>Públicos-alvo</label>
                            <div className="informativos-checkbox-grid">
                                {PUBLICO_OPTIONS.map((item) => {
                                    const checked = form.publicos.includes(item.value);

                                    return (
                                        <label
                                            key={item.value}
                                            className={`informativos-checkbox-card ${checked ? "is-active" : ""}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => togglePublico(item.value)}
                                            />
                                            <span>{item.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {form.publicos.length > 0 && (
                            <div className="form-group col-12">
                                <div className="informativos-segment-wrapper">
                                    {form.publicos.map((role) => (
                                        <div key={role}>{renderAlcanceCard(role)}</div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="form-actions col-12">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? "Salvando..." : "Salvar informativo"}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="page-section">
                    <div className="page-header-actions">
                        <div>
                            <h2 className="page-section-title">Informativos cadastrados</h2>
                            <p className="page-section-subtitle">
                                Gerencie os comunicados e altere o status quando necessário.
                            </p>
                        </div>
                    </div>

                    <div className="filters-row">
                        <div className="form-group">
                            <label htmlFor="search">Buscar</label>
                            <input
                                id="search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Título, descrição, segmentação, autor..."
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="statusFilter">Status efetivo</label>
                            <select
                                id="statusFilter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="TODOS">Todos</option>
                                <option value="RASCUNHO">Rascunho</option>
                                <option value="PUBLICADO">Publicado</option>
                                <option value="INATIVO">Inativo</option>
                                <option value="EXPIRADO">Expirado</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">Carregando informativos...</div>
                    ) : informativosFiltrados.length === 0 ? (
                        <div className="empty-state">Nenhum informativo encontrado.</div>
                    ) : (
                        <div className="informativos-list">
                            {informativosFiltrados.map((item) => (
                                <div key={item.id} className="informativos-card">
                                    <div className="informativos-card-header">
                                        <div>
                                            <h3>{item.titulo}</h3>

                                            <div className="informativos-meta">
                                                <span
                                                    className={`informativos-status-badge ${getStatusClass(
                                                        item.statusEfetivo
                                                    )}`}
                                                >
                                                    {item.statusEfetivo}
                                                </span>

                                                <span className="informativos-meta-pill">
                                                    Prioridade: {item.prioridade}
                                                </span>

                                                <span className="informativos-meta-pill">
                                                    Status salvo: {item.status}
                                                </span>
                                            </div>
                                        </div>

                                        {(user?.role === "admin" ||
                                            user?.role === "pedagogico" ||
                                            user?.role === "coordenacao") && (
                                                <div className="informativos-card-actions">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() =>
                                                            handleChangeStatus(item.id, "RASCUNHO")
                                                        }
                                                    >
                                                        Rascunho
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        onClick={() =>
                                                            handleChangeStatus(item.id, "PUBLICADO")
                                                        }
                                                    >
                                                        Publicar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() =>
                                                            handleChangeStatus(item.id, "INATIVO")
                                                        }
                                                    >
                                                        Inativar
                                                    </button>
                                                </div>
                                            )}
                                    </div>

                                    <div className="informativos-card-body">
                                        <p>{item.descricao}</p>
                                    </div>

                                    <div className="informativos-card-footer">
                                        <div>
                                            <strong>Segmentação:</strong>{" "}
                                            {item.segmentacaoResumo || "Sem segmentação específica"}
                                        </div>

                                        <div>
                                            <strong>Autor:</strong> {item.createdBy?.nome || "-"}
                                        </div>

                                        <div>
                                            <strong>Publicação:</strong>{" "}
                                            {item.dataPublicacao
                                                ? formatDateTimeBR(item.dataPublicacao)
                                                : "Sem data definida"}
                                        </div>

                                        <div>
                                            <strong>Expiração:</strong>{" "}
                                            {item.dataExpiracao
                                                ? formatDateTimeBR(item.dataExpiracao)
                                                : "Sem data definida"}
                                        </div>

                                        <div>
                                            <strong>Criado em:</strong>{" "}
                                            {formatDateTimeBR(item.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}