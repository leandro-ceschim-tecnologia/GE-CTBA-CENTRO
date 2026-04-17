import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
    titulo: "",
    dataInicio: "",
    dataFim: "",
    tipo: "feriado",
    aplicaTodosCursos: true,
    cursoId: "",
};

function parseLocalDate(dateInput) {
    if (!dateInput) return null;

    if (dateInput instanceof Date) {
        return new Date(
            dateInput.getFullYear(),
            dateInput.getMonth(),
            dateInput.getDate()
        );
    }

    if (typeof dateInput === "string") {
        const onlyDateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (onlyDateMatch) {
            const [, year, month, day] = onlyDateMatch;
            return new Date(Number(year), Number(month) - 1, Number(day));
        }
    }

    const parsed = new Date(dateInput);

    return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
    );
}

function formatDateInput(dateValue) {
    if (!dateValue) return "";
    const date = parseLocalDate(dateValue);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateBR(dateValue) {
    if (!dateValue) return "-";
    const date = parseLocalDate(dateValue);
    return date.toLocaleDateString("pt-BR");
}

function formatPeriodo(dataInicio, dataFim) {
    const inicio = formatDateBR(dataInicio);
    const fim = formatDateBR(dataFim);
    return inicio === fim ? inicio : `${inicio} até ${fim}`;
}

function parseBooleanCsv(value) {
    const normalized = String(value ?? "")
        .trim()
        .toLowerCase();

    return normalized === "true" || normalized === "1" || normalized === "sim";
}

function parseCsvLine(line) {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === "," && !insideQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }

    result.push(current);
    return result.map((item) => item.trim());
}

function parseCsvText(text) {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        throw new Error("O arquivo CSV precisa ter cabeçalho e ao menos uma linha.");
    }

    const headers = parseCsvLine(lines[0]);

    const expectedHeaders = [
        "titulo",
        "dataInicio",
        "dataFim",
        "tipo",
        "aplicaTodosCursos",
        "cursoNome",
    ];

    const isValidHeader =
        headers.length === expectedHeaders.length &&
        headers.every((header, index) => header === expectedHeaders[index]);

    if (!isValidHeader) {
        throw new Error(
            "Cabeçalho inválido. Use: titulo,dataInicio,dataFim,tipo,aplicaTodosCursos,cursoNome"
        );
    }

    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);

        return {
            titulo: values[0] || "",
            dataInicio: values[1] || "",
            dataFim: values[2] || "",
            tipo: values[3] || "",
            aplicaTodosCursos: parseBooleanCsv(values[4]),
            cursoNome: values[5] || "",
        };
    });
}

export default function RecessosPage() {
    const { user } = useAuth();

    const [recessos, setRecessos] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importErrors, setImportErrors] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isAdmin = user?.role === "admin";

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [recessosData, cursosData] = await Promise.all([
                apiRequest("/recessos"),
                apiRequest("/cursos"),
            ]);

            setRecessos(recessosData);
            setCursos(cursosData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
            ...(name === "aplicaTodosCursos" && checked ? { cursoId: "" } : {}),
        }));
    }

    function handleEdit(recesso) {
        setEditingId(recesso.id);
        setError("");
        setSuccess("");
        setImportErrors([]);

        setForm({
            titulo: recesso.titulo || "",
            dataInicio: formatDateInput(recesso.dataInicio),
            dataFim: formatDateInput(recesso.dataFim),
            tipo: recesso.tipo || "feriado",
            aplicaTodosCursos: !!recesso.aplicaTodosCursos,
            cursoId: recesso.cursoId ? String(recesso.cursoId) : "",
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function handleCancelEdit() {
        setEditingId(null);
        setForm(initialForm);
        setError("");
        setSuccess("");
        setImportErrors([]);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            setSending(true);
            setError("");
            setSuccess("");
            setImportErrors([]);

            const payload = {
                titulo: form.titulo,
                dataInicio: form.dataInicio,
                dataFim: form.dataFim,
                tipo: form.tipo,
                aplicaTodosCursos: form.aplicaTodosCursos,
                cursoId: form.aplicaTodosCursos ? null : Number(form.cursoId),
            };

            if (editingId) {
                await apiRequest(`/recessos/${editingId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });

                setSuccess("Recesso atualizado com sucesso.");
            } else {
                await apiRequest("/recessos", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });

                setSuccess("Recesso cadastrado com sucesso.");
            }

            setForm(initialForm);
            setEditingId(null);
            await loadData();
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    async function handleImportCsv(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            setError("");
            setSuccess("");
            setImportErrors([]);

            const text = await file.text();
            const itens = parseCsvText(text);

            const result = await apiRequest("/recessos/importar", {
                method: "POST",
                body: JSON.stringify({ itens }),
            });

            setSuccess(result.message || "Importação concluída com sucesso.");
            setRecessos(result.recessos || []);
        } catch (err) {
            const apiErrors = err?.details?.erros || err?.erros;

            if (Array.isArray(apiErrors)) {
                setImportErrors(apiErrors);
                setError(
                    err.message ||
                    "Foram encontrados erros no arquivo CSV. Corrija e tente novamente."
                );
            } else {
                setError(err.message || "Erro ao importar arquivo CSV.");
            }
        } finally {
            event.target.value = "";
            setImporting(false);
        }
    }

    async function handleToggleStatus(recesso) {
        const acao = recesso.ativo ? "inativar" : "ativar";
        const confirmar = window.confirm(
            `Deseja realmente ${acao} o recesso "${recesso.titulo}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");
            setImportErrors([]);

            await apiRequest(`/recessos/${recesso.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    ativo: !recesso.ativo,
                }),
            });

            setSuccess(
                recesso.ativo
                    ? "Recesso inativado com sucesso."
                    : "Recesso ativado com sucesso."
            );

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <Layout title="Recessos" subtitle="Gestao de Feriados e Recessos na Unidade">
            {isAdmin && (
                <div className="card">
                    <h3>{editingId ? "Editar recesso" : "Novo recesso"}</h3>

                    <form onSubmit={handleSubmit} className="user-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Título</label>
                                <input
                                    type="text"
                                    name="titulo"
                                    value={form.titulo}
                                    onChange={handleChange}
                                    placeholder="Ex: Feriado de Tiradentes"
                                />
                            </div>

                            <div className="form-group">
                                <label>Tipo</label>
                                <select name="tipo" value={form.tipo} onChange={handleChange}>
                                    <option value="feriado">Feriado</option>
                                    <option value="recesso">Recesso</option>
                                    <option value="ata">Ata</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Data início</label>
                                <input
                                    type="date"
                                    name="dataInicio"
                                    value={form.dataInicio}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Data fim</label>
                                <input
                                    type="date"
                                    name="dataFim"
                                    value={form.dataFim}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    name="aplicaTodosCursos"
                                    checked={form.aplicaTodosCursos}
                                    onChange={handleChange}
                                />
                                <span>Aplica para todos os cursos</span>
                            </label>
                        </div>

                        {!form.aplicaTodosCursos ? (
                            <div className="form-group">
                                <label>Curso</label>
                                <select
                                    name="cursoId"
                                    value={form.cursoId}
                                    onChange={handleChange}
                                >
                                    <option value="">Selecione um curso</option>
                                    {cursos.map((curso) => (
                                        <option key={curso.id} value={curso.id}>
                                            {curso.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : null}

                        {error ? <p className="form-error">{error}</p> : null}
                        {success ? <p className="form-success">{success}</p> : null}

                        <div className="action-row">
                            <button type="submit" className="btn-primary" disabled={sending}>
                                {sending
                                    ? editingId
                                        ? "Salvando..."
                                        : "Cadastrando..."
                                    : editingId
                                        ? "Salvar alterações"
                                        : "Cadastrar recesso"}
                            </button>

                            {editingId ? (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleCancelEdit}
                                >
                                    Cancelar edição
                                </button>
                            ) : null}
                        </div>
                    </form>
                </div>
            )}

            {isAdmin && (
                <div className="card">
                    <h3>Importar recessos por CSV</h3>

                    <p style={{ marginBottom: "12px" }}>
                        Use um arquivo CSV com este cabeçalho:
                        <br />
                        <strong>
                            titulo,dataInicio,dataFim,tipo,aplicaTodosCursos,cursoNome
                        </strong>
                    </p>

                    <div className="action-row">
                        <label className="btn-secondary" style={{ cursor: "pointer" }}>
                            {importing ? "Importando..." : "Selecionar arquivo CSV"}
                            <input
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleImportCsv}
                                disabled={importing}
                                style={{ display: "none" }}
                            />
                        </label>
                    </div>

                    {importErrors.length ? (
                        <div style={{ marginTop: "16px" }}>
                            <h4>Erros encontrados no arquivo</h4>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Linha</th>
                                            <th>Título</th>
                                            <th>Erro</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importErrors.map((item, index) => (
                                            <tr key={`${item.linha}-${index}`}>
                                                <td>{item.linha}</td>
                                                <td>{item.titulo || "-"}</td>
                                                <td>{item.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            <div className="card">
                <h3>Recessos cadastrados</h3>

                {loading ? (
                    <p>Carregando recessos...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Período</th>
                                    <th>Tipo</th>
                                    <th>Escopo</th>
                                    <th>Status</th>
                                    {isAdmin ? <th>Ações</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {recessos.length ? (
                                    recessos.map((recesso) => (
                                        <tr key={recesso.id}>
                                            <td>{recesso.id}</td>
                                            <td>{recesso.titulo}</td>
                                            <td>{formatPeriodo(recesso.dataInicio, recesso.dataFim)}</td>
                                            <td>{recesso.tipo}</td>
                                            <td>
                                                {recesso.aplicaTodosCursos
                                                    ? "Todos os cursos"
                                                    : recesso.curso?.nome || "-"}
                                            </td>
                                            <td>{recesso.ativo ? "Ativo" : "Inativo"}</td>
                                            {isAdmin ? (
                                                <td>
                                                    <div className="table-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-table-edit"
                                                            onClick={() => handleEdit(recesso)}
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className={
                                                                recesso.ativo
                                                                    ? "btn-table-danger"
                                                                    : "btn-table-success"
                                                            }
                                                            onClick={() => handleToggleStatus(recesso)}
                                                        >
                                                            {recesso.ativo ? "Inativar" : "Ativar"}
                                                        </button>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? "7" : "6"}>
                                            Nenhum recesso encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}