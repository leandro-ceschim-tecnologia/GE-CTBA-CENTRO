import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const STATUS_LABEL = {
    PENDENTE_CONTATO: "Pendente de contato",
    EM_TRATATIVA: "Em tratativa",
    TRATADO: "Tratado",
    LANCADO_SISTEMA: "Lançado no sistema",
    FINALIZADO: "Finalizado",
    CANCELADO: "Cancelado",
};

const REGRA_LABEL = {
    FALTA_INDIVIDUAL: "Falta individual",
    DUAS_FALTAS_CONSECUTIVAS: "2 faltas consecutivas",
    EVASAO_12_FALTAS: "12+ faltas",
};

const TIPO_CONTATO_OPTIONS = [
    { value: "LIGACAO", label: "Ligação" },
    { value: "WHATSAPP", label: "WhatsApp" },
    { value: "PRESENCIAL", label: "Presencial" },
    { value: "OUTRO", label: "Outro" },
];

function formatDateBR(value) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("pt-BR");
}

function formatDateTimeBR(value) {
    if (!value) return "-";
    return new Date(value).toLocaleString("pt-BR");
}

function getStatusClass(status) {
    if (status === "PENDENTE_CONTATO") return "badge-warning";
    if (status === "EM_TRATATIVA") return "badge-info";
    if (status === "TRATADO") return "badge-success";
    if (status === "LANCADO_SISTEMA") return "badge-neutral";
    if (status === "FINALIZADO") return "badge-success";
    if (status === "CANCELADO") return "badge-danger";
    return "badge-neutral";
}

export default function EvasaoPage() {
    const [ocorrencias, setOcorrencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [filters, setFilters] = useState({
        status: "",
        regraTipo: "",
        somenteAtivas: true,
    });

    const [selectedOcorrencia, setSelectedOcorrencia] = useState(null);
    const [tratativaForm, setTratativaForm] = useState({
        tipoContato: "LIGACAO",
        descricao: "",
        retornoAluno: "",
        observacoes: "",
    });
    const [savingTratativa, setSavingTratativa] = useState(false);
    const [savingLancado, setSavingLancado] = useState(false);
    const [savingFinalizar, setSavingFinalizar] = useState(false);
    const [savingCancelar, setSavingCancelar] = useState(false);

    const [historicoAluno, setHistoricoAluno] = useState(null);
    const [loadingHistorico, setLoadingHistorico] = useState(false);

    useEffect(() => {
        loadOcorrencias();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadOcorrencias() {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const params = new URLSearchParams();
            if (filters.status) params.set("status", filters.status);
            if (filters.regraTipo) params.set("regraTipo", filters.regraTipo);
            params.set("somenteAtivas", String(filters.somenteAtivas));

            const data = await apiRequest(`/evasao/ocorrencias?${params.toString()}`);
            setOcorrencias(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Erro ao carregar ocorrências.");
        } finally {
            setLoading(false);
        }
    }

    function handleFilterChange(event) {
        const { name, value, type, checked } = event.target;
        setFilters((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleAplicarFiltros() {
        await loadOcorrencias();
    }

    async function handleProcessarAluno(alunoId) {
        try {
            setProcessing(true);
            setError("");
            setSuccess("");

            await apiRequest("/evasao/processar/aluno", {
                method: "POST",
                body: JSON.stringify({ alunoId }),
            });

            setSuccess("Evasão do aluno processada com sucesso.");
            await loadOcorrencias();
        } catch (err) {
            setError(err.message || "Erro ao processar evasão do aluno.");
        } finally {
            setProcessing(false);
        }
    }

    async function handleAbrirHistoricoAluno(alunoId) {
        try {
            setLoadingHistorico(true);
            setError("");
            setHistoricoAluno(null);

            const data = await apiRequest(`/evasao/aluno/${alunoId}/historico`);
            setHistoricoAluno(data);
        } catch (err) {
            setError(err.message || "Erro ao carregar histórico do aluno.");
        } finally {
            setLoadingHistorico(false);
        }
    }

    function handleOpenTratativa(ocorrencia) {
        const ultimaTratativa =
            Array.isArray(ocorrencia?.tratativas) && ocorrencia.tratativas.length
                ? ocorrencia.tratativas[0]
                : null;

        setSelectedOcorrencia(ocorrencia);

        setTratativaForm({
            tipoContato: ultimaTratativa?.tipoContato || "LIGACAO",
            descricao: ultimaTratativa?.descricao || "",
            retornoAluno: ultimaTratativa?.retornoAluno || "",
            observacoes: ultimaTratativa?.observacoes || "",
        });
    }

    async function handleSalvarTratativa() {
        if (!selectedOcorrencia?.id) return;

        try {
            setSavingTratativa(true);
            setError("");
            setSuccess("");

            await apiRequest("/evasao/tratativa", {
                method: "POST",
                body: JSON.stringify({
                    ocorrenciaId: selectedOcorrencia.id,
                    tipoContato: tratativaForm.tipoContato,
                    descricao: tratativaForm.descricao,
                    retornoAluno: tratativaForm.retornoAluno || null,
                    observacoes: tratativaForm.observacoes || null,
                }),
            });

            setSuccess("Tratativa registrada com sucesso.");
            setSelectedOcorrencia(null);
            await loadOcorrencias();
        } catch (err) {
            setError(err.message || "Erro ao registrar tratativa.");
        } finally {
            setSavingTratativa(false);
        }
    }

    async function handleMarcarLancadoSistema(ocorrenciaId) {
        try {
            setSavingLancado(true);
            setError("");
            setSuccess("");

            await apiRequest("/evasao/lancado-sistema", {
                method: "POST",
                body: JSON.stringify({
                    ocorrenciaId,
                    observacoes: "Lançamento confirmado no sistema interno.",
                }),
            });

            setSuccess("Ocorrência marcada como lançada no sistema.");
            await loadOcorrencias();
        } catch (err) {
            setError(err.message || "Erro ao marcar lançamento no sistema.");
        } finally {
            setSavingLancado(false);
        }
    }

    async function handleFinalizarOcorrencia(ocorrenciaId) {
        const confirmar = window.confirm(
            "Deseja finalizar esta ocorrência?"
        );
        if (!confirmar) return;

        try {
            setSavingFinalizar(true);
            setError("");
            setSuccess("");

            await apiRequest("/evasao/finalizar", {
                method: "POST",
                body: JSON.stringify({
                    ocorrenciaId,
                }),
            });

            setSuccess("Ocorrência finalizada com sucesso.");
            await loadOcorrencias();
        } catch (err) {
            setError(err.message || "Erro ao finalizar ocorrência.");
        } finally {
            setSavingFinalizar(false);
        }
    }

    async function handleCancelarOcorrencia(ocorrenciaId) {
        const confirmar = window.confirm(
            "Deseja cancelar esta ocorrência?"
        );
        if (!confirmar) return;

        try {
            setSavingCancelar(true);
            setError("");
            setSuccess("");

            await apiRequest("/evasao/cancelar", {
                method: "POST",
                body: JSON.stringify({
                    ocorrenciaId,
                }),
            });

            setSuccess("Ocorrência cancelada com sucesso.");
            await loadOcorrencias();
        } catch (err) {
            setError(err.message || "Erro ao cancelar ocorrência.");
        } finally {
            setSavingCancelar(false);
        }
    }

    const cardsResumo = useMemo(() => {
        const pendentes = ocorrencias.filter(
            (item) => item.status === "PENDENTE_CONTATO"
        ).length;

        const tratados = ocorrencias.filter(
            (item) => item.status === "TRATADO"
        ).length;

        const lancados = ocorrencias.filter(
            (item) => item.status === "LANCADO_SISTEMA"
        ).length;

        const evasao12 = ocorrencias.filter(
            (item) => item.regraTipo === "EVASAO_12_FALTAS"
        ).length;

        return {
            total: ocorrencias.length,
            pendentes,
            tratados,
            lancados,
            evasao12,
        };
    }, [ocorrencias]);

    function buildTextoSistemaInterno(ocorrencia, tratativaForm) {
        if (!ocorrencia) return "";

        const ultimaTratativa =
            ocorrencia?.tratativas?.length ? ocorrencia.tratativas[0] : null;

        const tipoContatoValue =
            tratativaForm?.tipoContato || ultimaTratativa?.tipoContato || "";

        const tipoContatoLabel =
            TIPO_CONTATO_OPTIONS.find((item) => item.value === tipoContatoValue)?.label ||
            tipoContatoValue ||
            "contato";

        const descricao =
            tratativaForm?.descricao?.trim() ||
            ultimaTratativa?.descricao ||
            "";

        const retornoAluno =
            tratativaForm?.retornoAluno?.trim() ||
            ultimaTratativa?.retornoAluno ||
            "";

        const observacoes =
            tratativaForm?.observacoes?.trim() ||
            ultimaTratativa?.observacoes ||
            "";

        const dataContato =
            ultimaTratativa?.dataContato || new Date();

        const dataFormatada = new Date(dataContato).toLocaleDateString("pt-BR");
        const horaFormatada = new Date(dataContato).toLocaleTimeString("pt-BR");

        const nomeAluno = ocorrencia.aluno?.nome || "Aluno";
        const curso = ocorrencia.curso?.nome || "";
        const turma = ocorrencia.turma?.nome || "";
        const disciplina =
            ocorrencia.turmaDisciplina?.disciplina?.nome || "";

        const qtdFaltas = ocorrencia.qtdFaltas || 0;

        return [
            `Foi realizado contato com o(a) aluno(a) ${nomeAluno} em ${dataFormatada} às ${horaFormatada} por meio de ${tipoContatoLabel.toLowerCase()}, após o registro de ${qtdFaltas} faltas na disciplina ${disciplina} (Turma ${turma} - ${curso}).`,
            "",
            `O aluno informou que: ${retornoAluno || "não houve retorno informado."}`,
            "",
            `Como tratativa, foi realizado o seguinte: ${descricao || "não informado."}`,
            "",
            `Observações adicionais: ${observacoes || "sem observações."}`,
        ].join("\n");
    }

    async function handleCopiarTextoSistema() {
        try {
            const texto = buildTextoSistemaInterno(selectedOcorrencia, tratativaForm);

            if (!texto.trim()) {
                setError("Não há texto para copiar.");
                return;
            }

            await navigator.clipboard.writeText(texto);
            setSuccess("Texto copiado com sucesso.");
        } catch (err) {
            setError("Não foi possível copiar o texto.");
        }
    }

    function getUltimaTratativa(ocorrencia) {
        if (!ocorrencia?.tratativas?.length) return null;
        return ocorrencia.tratativas[0];
    }

    return (
        <Layout
            title="Controle de Evasão"
            subtitle="Acompanhe possíveis evasões, tratativas e lançamentos realizados"
        >
            <div className="card">
                <div className="form-grid evasao-filtros-grid">
                    <div className="form-group">
                        <label>Status</label>
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todos</option>
                            <option value="PENDENTE_CONTATO">Pendente de contato</option>
                            <option value="EM_TRATATIVA">Em tratativa</option>
                            <option value="TRATADO">Tratado</option>
                            <option value="LANCADO_SISTEMA">Lançado no sistema</option>
                            <option value="FINALIZADO">Finalizado</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Regra</label>
                        <select
                            name="regraTipo"
                            value={filters.regraTipo}
                            onChange={handleFilterChange}
                        >
                            <option value="">Todas</option>
                            <option value="FALTA_INDIVIDUAL">Falta individual</option>
                            <option value="DUAS_FALTAS_CONSECUTIVAS">2 faltas consecutivas</option>
                            <option value="EVASAO_12_FALTAS">12+ faltas</option>
                        </select>
                    </div>

                    <div className="form-group form-group-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                name="somenteAtivas"
                                checked={filters.somenteAtivas}
                                onChange={handleFilterChange}
                            />{" "}
                            Somente ocorrências ativas
                        </label>
                    </div>
                </div>

                <div className="action-row">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={handleAplicarFiltros}
                        disabled={loading}
                    >
                        {loading ? "Carregando..." : "Aplicar filtros"}
                    </button>
                </div>

                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : null}
            </div>

            <div className="card">
                <div className="frequencia-resumo-topo">
                    <div className="summary-card">
                        <strong>Total</strong>
                        <span>{cardsResumo.total}</span>
                    </div>
                    <div className="summary-card">
                        <strong>Pendentes</strong>
                        <span>{cardsResumo.pendentes}</span>
                    </div>
                    <div className="summary-card">
                        <strong>Tratados</strong>
                        <span>{cardsResumo.tratados}</span>
                    </div>
                    <div className="summary-card">
                        <strong>Lançados</strong>
                        <span>{cardsResumo.lancados}</span>
                    </div>
                    <div className="summary-card">
                        <strong>12+ faltas</strong>
                        <span>{cardsResumo.evasao12}</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Ocorrências</h3>

                {!ocorrencias.length ? (
                    <p>Nenhuma ocorrência encontrada.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Aluno</th>
                                    <th>Matrícula</th>
                                    <th>Curso</th>
                                    <th>Turma</th>
                                    <th>Disciplina</th>
                                    <th>Data referência</th>
                                    <th>Regra</th>
                                    <th>Qtd faltas</th>
                                    <th>Status</th>
                                    <th>Última tratativa</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ocorrencias.map((item) => {
                                    const ultimaTratativa = item.tratativas?.[0] || null;

                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="link-button"
                                                    onClick={() =>
                                                        handleAbrirHistoricoAluno(item.aluno?.id)
                                                    }
                                                >
                                                    {item.aluno?.nome || "-"}
                                                </button>
                                            </td>
                                            <td>{item.aluno?.matricula || "-"}</td>
                                            <td>{item.curso?.nome || "-"}</td>
                                            <td>{item.turma?.nome || "-"}</td>
                                            <td>
                                                {item.turmaDisciplina?.disciplina?.nome || "-"}
                                            </td>
                                            <td>{formatDateBR(item.dataReferencia)}</td>
                                            <td>
                                                {REGRA_LABEL[item.regraTipo] || item.regraTipo}
                                            </td>
                                            <td>{item.qtdFaltas || 0}</td>
                                            <td>
                                                <span className={`badge ${getStatusClass(item.status)}`}>
                                                    {STATUS_LABEL[item.status] || item.status}
                                                </span>
                                            </td>
                                            <td>
                                                {ultimaTratativa ? (
                                                    <div className="evasao-tratativa-mini">
                                                        <strong>
                                                            {ultimaTratativa.responsavel?.nome || "-"}
                                                        </strong>
                                                        <span>
                                                            {formatDateTimeBR(
                                                                ultimaTratativa.dataContato
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() =>
                                                            handleOpenTratativa(item)
                                                        }
                                                    >
                                                        Tratativa
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-success"
                                                        onClick={() =>
                                                            handleMarcarLancadoSistema(item.id)
                                                        }
                                                        disabled={savingLancado}
                                                    >
                                                        Sistema
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() =>
                                                            handleProcessarAluno(item.aluno?.id)
                                                        }
                                                        disabled={processing}
                                                    >
                                                        Reprocessar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-success"
                                                        onClick={() =>
                                                            handleFinalizarOcorrencia(item.id)
                                                        }
                                                        disabled={savingFinalizar}
                                                    >
                                                        Finalizar
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-danger"
                                                        onClick={() =>
                                                            handleCancelarOcorrencia(item.id)
                                                        }
                                                        disabled={savingCancelar}
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedOcorrencia ? (
                <div className="modal-backdrop">
                    <div className="modal-card modal-lg">
                        <div className="modal-header">
                            <h3>Tratativas do aluno</h3>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setSelectedOcorrencia(null)}
                            >
                                ×
                            </button>
                        </div>

                        {/* 🔹 Dados da ocorrência */}
                        <div className="frequencia-info-turma">
                            <p><strong>Aluno:</strong> {selectedOcorrencia.aluno?.nome}</p>
                            <p><strong>Matrícula:</strong> {selectedOcorrencia.aluno?.matricula}</p>
                            <p><strong>Regra:</strong> {REGRA_LABEL[selectedOcorrencia.regraTipo]}</p>
                            <p><strong>Qtd faltas:</strong> {selectedOcorrencia.qtdFaltas}</p>
                            <p><strong>Status:</strong> {STATUS_LABEL[selectedOcorrencia.status]}</p>
                        </div>

                        {/* 🔥 HISTÓRICO DE TRATATIVAS */}
                        <div className="card">
                            <h4>Histórico de tratativas</h4>

                            {!selectedOcorrencia.tratativas?.length ? (
                                <p>Nenhuma tratativa registrada.</p>
                            ) : (
                                <div className="timeline">
                                    {selectedOcorrencia.tratativas.map((item) => (
                                        <div key={item.id} className="timeline-item">
                                            <div className="timeline-dot"></div>

                                            <div className="timeline-content">
                                                <div className="timeline-header">
                                                    <strong>
                                                        {item.responsavel?.nome || "Sistema"}
                                                    </strong>
                                                    <span>
                                                        {new Date(item.dataContato).toLocaleString("pt-BR")}
                                                    </span>
                                                </div>

                                                <div className="timeline-body">
                                                    <p>
                                                        <strong>Tipo:</strong> {item.tipoContato}
                                                    </p>

                                                    <p>
                                                        <strong>Descrição:</strong> {item.descricao}
                                                    </p>

                                                    {item.retornoAluno && (
                                                        <p>
                                                            <strong>Retorno:</strong> {item.retornoAluno}
                                                        </p>
                                                    )}

                                                    {item.observacoes && (
                                                        <p>
                                                            <strong>Obs:</strong> {item.observacoes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 🔹 NOVA TRATATIVA */}
                        <div className="card">
                            <h4>Nova tratativa</h4>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Tipo de contato</label>
                                    <select
                                        value={tratativaForm.tipoContato}
                                        onChange={(e) =>
                                            setTratativaForm((prev) => ({
                                                ...prev,
                                                tipoContato: e.target.value,
                                            }))
                                        }
                                    >
                                        {TIPO_CONTATO_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group form-group-full">
                                    <label>Descrição</label>
                                    <textarea
                                        rows={3}
                                        value={tratativaForm.descricao}
                                        onChange={(e) =>
                                            setTratativaForm((prev) => ({
                                                ...prev,
                                                descricao: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="form-group form-group-full">
                                    <label>Retorno do aluno</label>
                                    <textarea
                                        rows={2}
                                        value={tratativaForm.retornoAluno}
                                        onChange={(e) =>
                                            setTratativaForm((prev) => ({
                                                ...prev,
                                                retornoAluno: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="form-group form-group-full">
                                    <label>Observações</label>
                                    <textarea
                                        rows={2}
                                        value={tratativaForm.observacoes}
                                        onChange={(e) =>
                                            setTratativaForm((prev) => ({
                                                ...prev,
                                                observacoes: e.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="card">
                                <h4>Texto para lançar no sistema interno</h4>

                                <div className="form-group">
                                    <textarea
                                        rows={10}
                                        readOnly
                                        value={buildTextoSistemaInterno(selectedOcorrencia, tratativaForm)}
                                    />
                                </div>

                                <div className="action-row">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={handleCopiarTextoSistema}
                                    >
                                        Copiar texto
                                    </button>
                                </div>
                            </div>

                            <div className="action-row">
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleSalvarTratativa}
                                    disabled={savingTratativa}
                                >
                                    {savingTratativa ? "Salvando..." : "Salvar tratativa"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {historicoAluno ? (
                <div className="modal-backdrop">
                    <div className="modal-card modal-xl">
                        <div className="modal-header">
                            <h3>Histórico de evasão do aluno</h3>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setHistoricoAluno(null)}
                            >
                                ×
                            </button>
                        </div>

                        {loadingHistorico ? (
                            <p>Carregando histórico...</p>
                        ) : (
                            <>
                                <div className="frequencia-historico-header">
                                    <p>
                                        <strong>Aluno:</strong>{" "}
                                        {historicoAluno.aluno?.nome || "-"}
                                    </p>
                                    <p>
                                        <strong>Matrícula:</strong>{" "}
                                        {historicoAluno.aluno?.matricula || "-"}
                                    </p>
                                </div>

                                <div className="frequencia-resumo-topo">
                                    <div className="summary-card">
                                        <strong>Total de faltas</strong>
                                        <span>
                                            {historicoAluno.resumo?.totalFaltas || 0}
                                        </span>
                                    </div>
                                    <div className="summary-card">
                                        <strong>Maior sequência</strong>
                                        <span>
                                            {historicoAluno.resumo?.maiorSequenciaFaltas || 0}
                                        </span>
                                    </div>
                                    <div className="summary-card">
                                        <strong>Ocorrências ativas</strong>
                                        <span>
                                            {historicoAluno.resumo?.ocorrenciasAtivas || 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Regra</th>
                                                <th>Curso</th>
                                                <th>Turma</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {!historicoAluno.ocorrencias?.length ? (
                                                <tr>
                                                    <td colSpan="5">
                                                        Nenhuma ocorrência encontrada.
                                                    </td>
                                                </tr>
                                            ) : (
                                                historicoAluno.ocorrencias.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{formatDateBR(item.dataReferencia)}</td>
                                                        <td>
                                                            {REGRA_LABEL[item.regraTipo] ||
                                                                item.regraTipo}
                                                        </td>
                                                        <td>{item.curso?.nome || "-"}</td>
                                                        <td>{item.turma?.nome || "-"}</td>
                                                        <td>
                                                            {STATUS_LABEL[item.status] ||
                                                                item.status}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </Layout>
    );
}