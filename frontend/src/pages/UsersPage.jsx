import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const initialForm = {
    nome: "",
    email: "",
    senha: "",
    role: "instrutor",
    turmaId: "",
    cpf: "",
    matricula: "",
    fone1: "",
    fone2: "",
};

function getRoleLabel(role) {
    const labels = {
        admin: "Admin",
        direcao: "Direção",
        pedagogico: "Pedagógico",
        coordenacao: "Coordenação",
        coordsetor: "Coordenação de Setor",
        comercial: "Comercial",
        secretaria: "Secretaria",
        instrutor: "Instrutor",
        aluno: "Aluno",
    };

    return labels[role] || role;
}

function getTurmaLabel(turma) {
    if (!turma) return "-";
    const cursoNome = turma.curso?.nome ? ` - ${turma.curso.nome}` : "";
    return `${turma.nome}${cursoNome}`;
}

function formatCpfInput(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhoneInput(value) {
    const digits = value.replace(/\D/g, "").slice(0, 11);

    if (digits.length <= 10) {
        return digits
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d)/, "$1-$2");
    }

    return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
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
        "nome",
        "email",
        "senha",
        "role",
        "turmaNome",
        "cpf",
        "matricula",
        "fone1",
        "fone2",
    ];

    const isValidHeader =
        headers.length === expectedHeaders.length &&
        headers.every((header, index) => header === expectedHeaders[index]);

    if (!isValidHeader) {
        throw new Error(
            "Cabeçalho inválido. Use: nome,email,senha,role,turmaNome,cpf,matricula,fone1,fone2"
        );
    }

    return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);

        return {
            nome: values[0] || "",
            email: values[1] || "",
            senha: values[2] || "",
            role: values[3] || "",
            turmaNome: values[4] || "",
            cpf: values[5] || "",
            matricula: values[6] || "",
            fone1: values[7] || "",
            fone2: values[8] || "",
        };
    });
}

export default function UsersPage() {
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importErrors, setImportErrors] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isAdmin = user?.role === "admin";
    const isEditing = !!editingId;
    const roleSelecionado = form.role === "aluno";

    async function loadData() {
        try {
            setLoading(true);
            setError("");

            const [usersData, turmasData] = await Promise.all([
                apiRequest("/users"),
                apiRequest("/turmas"),
            ]);

            setUsers(usersData);
            setTurmas(turmasData.filter((turma) => turma.ativo));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (isAdmin) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => {
            const next = {
                ...prev,
                [name]: value,
            };

            if (name === "role" && value !== "aluno") {
                next.turmaId = "";
            }

            return next;
        });
    }

    function handleEdit(selectedUser) {
        setEditingId(selectedUser.id);
        setError("");
        setSuccess("");
        setImportErrors([]);

        setForm({
            nome: selectedUser.nome || "",
            email: selectedUser.email || "",
            senha: "",
            role: selectedUser.role || "instrutor",
            turmaId: selectedUser.turmaId ? String(selectedUser.turmaId) : "",
            cpf: selectedUser.cpf || "",
            matricula: selectedUser.matricula || "",
            fone1: selectedUser.fone1 || "",
            fone2: selectedUser.fone2 || "",
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
                nome: form.nome,
                email: form.email,
                role: form.role,
                cpf: form.cpf || null,
                matricula: form.matricula || null,
                fone1: form.fone1 || null,
                fone2: form.fone2 || null,
                turmaId: form.role === "aluno" && form.turmaId ? Number(form.turmaId) : null,
            };

            if (form.senha.trim()) {
                payload.senha = form.senha;
            }

            if (!isEditing && !payload.senha) {
                setError("A senha é obrigatória para cadastro.");
                return;
            }

            if (isEditing) {
                await apiRequest(`/users/${editingId}`, {
                    method: "PUT",
                    body: payload,
                });

                setSuccess("Usuário atualizado com sucesso.");
            } else {
                await apiRequest("/users", {
                    method: "POST",
                    body: payload,
                });

                setSuccess("Usuário criado com sucesso.");
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

            const result = await apiRequest("/users/importar", {
                method: "POST",
                body: { itens },
            });

            setSuccess(result.message || "Importação concluída com sucesso.");
            setUsers(result.users || []);
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

    async function handleToggleStatus(selectedUser) {
        const isSelf = selectedUser.id === user?.id;

        if (isSelf && selectedUser.ativo) {
            setError("Você não pode desativar o próprio usuário logado.");
            setSuccess("");
            setImportErrors([]);
            return;
        }

        const acao = selectedUser.ativo ? "desativar" : "ativar";
        const confirmar = window.confirm(
            `Deseja realmente ${acao} o usuário "${selectedUser.nome}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");
            setImportErrors([]);

            await apiRequest(`/users/${selectedUser.id}/status`, {
                method: "PATCH",
                body: {
                    ativo: !selectedUser.ativo,
                },
            });

            setSuccess(
                selectedUser.ativo
                    ? "Usuário desativado com sucesso."
                    : "Usuário ativado com sucesso."
            );

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleDelete(selectedUser) {
        const isSelf = selectedUser.id === user?.id;

        if (isSelf) {
            setError("Você não pode excluir o próprio usuário logado.");
            setSuccess("");
            setImportErrors([]);
            return;
        }

        const confirmar = window.confirm(
            `Deseja realmente excluir o usuário "${selectedUser.nome}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");
            setImportErrors([]);

            await apiRequest(`/users/${selectedUser.id}`, {
                method: "DELETE",
            });

            setSuccess("Usuário excluído com sucesso.");

            if (editingId === selectedUser.id) {
                handleCancelEdit();
            }

            await loadData();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <Layout title="Usuários" subtitle="Gestão completa de usuários do sistema">
            <div className="page-header">
                <h2>Usuários</h2>
                <p>Cadastre, edite, vincule aluno à turma, ative/desative ou exclua usuários.</p>
            </div>

            {!isAdmin ? (
                <div className="card">
                    <p>Você não tem permissão para acessar esta área.</p>
                </div>
            ) : (
                <>
                    <div className="card">
                        <h3>{isEditing ? "Editar usuário" : "Novo usuário"}</h3>

                        <form onSubmit={handleSubmit} className="user-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nome</label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={form.nome}
                                        onChange={handleChange}
                                        placeholder="Nome completo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>E-mail</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="email@exemplo.com"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>CPF</label>
                                    <input
                                        type="text"
                                        name="cpf"
                                        value={form.cpf}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                cpf: formatCpfInput(e.target.value),
                                            }))
                                        }
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                    <small style={{ color: "#666" }}>
                                        Necessário para emissão de certificados
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label>Matrícula</label>
                                    <input
                                        type="text"
                                        name="matricula"
                                        value={form.matricula}
                                        onChange={handleChange}
                                        placeholder="Digite a matrícula"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Fone 1</label>
                                    <input
                                        type="text"
                                        name="fone1"
                                        value={form.fone1}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                fone1: formatPhoneInput(e.target.value),
                                            }))
                                        }
                                        placeholder="(41) 99999-9999"
                                        maxLength={15}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Fone 2</label>
                                    <input
                                        type="text"
                                        name="fone2"
                                        value={form.fone2}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                fone2: formatPhoneInput(e.target.value),
                                            }))
                                        }
                                        placeholder="(41) 99999-9999"
                                        maxLength={15}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Senha {isEditing ? "(opcional)" : ""}</label>
                                    <input
                                        type="password"
                                        name="senha"
                                        value={form.senha}
                                        onChange={handleChange}
                                        placeholder={
                                            isEditing
                                                ? "Preencha só se quiser alterar"
                                                : "Digite a senha"
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Perfil</label>
                                    <select name="role" value={form.role} onChange={handleChange}>
                                        <option value="admin">Admin</option>
                                        <option value="direcao">Direção</option>
                                        <option value="pedagogico">Pedagógico</option>
                                        <option value="coordenacao">Coordenação</option>
                                        <option value="coordsetor">Coordenação de Setor</option>
                                        <option value="comercial">Comercial</option>
                                        <option value="secretaria">Secretaria</option>
                                        <option value="instrutor">Instrutor</option>
                                        <option value="aluno">Aluno</option>
                                    </select>
                                </div>

                                {roleSelecionado ? (
                                    <div className="form-group">
                                        <label>Turma do aluno</label>
                                        <select
                                            name="turmaId"
                                            value={form.turmaId}
                                            onChange={handleChange}
                                        >
                                            <option value="">Selecione uma turma</option>
                                            {turmas.map((turma) => (
                                                <option key={turma.id} value={turma.id}>
                                                    {turma.nome} - {turma.curso?.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}
                            </div>

                            {error ? <p className="form-error">{error}</p> : null}
                            {success ? <p className="form-success">{success}</p> : null}

                            <div className="action-row">
                                <button type="submit" className="btn-primary" disabled={sending}>
                                    {sending
                                        ? isEditing
                                            ? "Salvando..."
                                            : "Cadastrando..."
                                        : isEditing
                                            ? "Salvar alterações"
                                            : "Cadastrar usuário"}
                                </button>

                                {isEditing ? (
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

                    <div className="card">
                        <h3>Importar usuários por CSV</h3>

                        <p style={{ marginBottom: "12px" }}>
                            Use um arquivo CSV com este cabeçalho:
                            <br />
                            <strong>
                                nome,email,senha,role,turmaNome,cpf,matricula,fone1,fone2
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
                                                <th>Nome</th>
                                                <th>E-mail</th>
                                                <th>Erro</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importErrors.map((item, index) => (
                                                <tr key={`${item.linha}-${index}`}>

                                                    <td>{item.linha}</td>
                                                    <td>{item.nome || "-"}</td>
                                                    <td>{item.email || "-"}</td>
                                                    <td>{item.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="card">
                        <h3>Usuários cadastrados</h3>

                        {loading ? (
                            <p>Carregando usuários...</p>
                        ) : (
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nome</th>
                                            <th>E-mail</th>
                                            <th>CPF</th>
                                            <th>Matrícula</th>
                                            <th>Fone 1</th>
                                            <th>Fone 2</th>
                                            <th>Perfil</th>
                                            <th>Turma</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length ? (
                                            users.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{item.id}</td>
                                                    <td>{item.nome}</td>
                                                    <td>{item.email}</td>
                                                    <td>{item.cpf || "-"}</td>
                                                    <td>{item.matricula || "-"}</td>
                                                    <td>{item.fone1 || "-"}</td>
                                                    <td>{item.fone2 || "-"}</td>
                                                    <td>{getRoleLabel(item.role)}</td>
                                                    <td>
                                                        {item.role === "aluno"
                                                            ? getTurmaLabel(item.turma)
                                                            : "-"}
                                                    </td>
                                                    <td>{item.ativo ? "Ativo" : "Inativo"}</td>
                                                    <td>
                                                        <div className="table-actions">
                                                            <button
                                                                type="button"
                                                                className="btn-table-edit"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                Editar
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className={
                                                                    item.ativo
                                                                        ? "btn-table-danger"
                                                                        : "btn-table-success"
                                                                }
                                                                onClick={() => handleToggleStatus(item)}
                                                            >
                                                                {item.ativo ? "Desativar" : "Ativar"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="btn-table-danger"
                                                                onClick={() => handleDelete(item)}
                                                            >
                                                                Excluir
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="11">Nenhum usuário encontrado.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </Layout>
    );
}