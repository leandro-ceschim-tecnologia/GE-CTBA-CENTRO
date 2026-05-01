import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function MeuPerfilPage() {
    const { updateUserData } = useAuth();

    const [form, setForm] = useState({
        nome: "",
        email: "",
        cpf: "",
        matricula: "",
        fone1: "",
        fone2: "",
        fotoUrl: "",
        bio: "",
        role: "",
        turmaNome: "",
    });

    const [passwordForm, setPasswordForm] = useState({
        senhaAtual: "",
        novaSenha: "",
        confirmarNovaSenha: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    useEffect(() => {
        loadPerfil();
    }, []);

    async function loadPerfil() {
        setLoading(true);
        setError("");

        try {
            const data = await apiRequest("/me");

            setForm({
                nome: data?.nome || "",
                email: data?.email || "",
                cpf: data?.cpf || "",
                matricula: data?.matricula || "",
                fone1: data?.fone1 || "",
                fone2: data?.fone2 || "",
                fotoUrl: data?.fotoUrl || "",
                bio: data?.bio || "",
                role: data?.role || "",
                turmaNome: data?.turma?.nome || "",
            });
        } catch (err) {
            setError(err.message || "Erro ao carregar perfil.");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    function handlePasswordChange(event) {
        const { name, value } = event.target;

        setPasswordForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const updated = await apiRequest("/me", {
                method: "PUT",
                body: {
                    nome: form.nome,
                    fone1: form.fone1,
                    fone2: form.fone2,
                    fotoUrl: form.fotoUrl,
                    bio: form.bio,
                },
            });

            setForm((prev) => ({
                ...prev,
                nome: updated?.nome || prev.nome,
                fone1: updated?.fone1 || "",
                fone2: updated?.fone2 || "",
                fotoUrl: updated?.fotoUrl || "",
                bio: updated?.bio || "",
            }));

            updateUserData?.({
                nome: updated?.nome ?? form.nome,
                fotoUrl: updated?.fotoUrl ?? form.fotoUrl,
                fone1: updated?.fone1 ?? form.fone1,
                fone2: updated?.fone2 ?? form.fone2,
                bio: updated?.bio ?? form.bio,
            });

            setSuccess("Perfil atualizado com sucesso.");
        } catch (err) {
            setError(err.message || "Erro ao atualizar perfil.");
        } finally {
            setSaving(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();
        setSavingPassword(true);
        setPasswordError("");
        setPasswordSuccess("");

        try {
            const result = await apiRequest("/me/password", {
                method: "PUT",
                body: passwordForm,
            });

            setPasswordSuccess(result?.message || "Senha alterada com sucesso.");
            setPasswordForm({
                senhaAtual: "",
                novaSenha: "",
                confirmarNovaSenha: "",
            });
        } catch (err) {
            setPasswordError(err.message || "Erro ao alterar senha.");
        } finally {
            setSavingPassword(false);
        }
    }

    function getRoleLabel(role) {
        const labels = {
            admin: "Administrador",
            direcao: "Direção",
            pedagogico: "Pedagógico",
            coordenacao: "Coordenação",
            coordsetor: "Coordenação de Setor",
            comercial: "Comercial",
            secretaria: "Secretaria",
            instrutor: "Instrutor",
            aluno: "Aluno",
            supervisor: "Supervisor",
        };

        return labels[role] || role;
    }

    function getUserInitials(nome) {
        if (!nome) return "U";

        const partes = String(nome).trim().split(" ").filter(Boolean);

        if (partes.length === 1) {
            return partes[0].slice(0, 2).toUpperCase();
        }

        return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    }

    return (
        <Layout title="Meu Perfil" subtitle="Visualize e atualize seus dados">
            <div className="perfil-page">
                {loading ? (
                    <div className="page-card">
                        <p>Carregando perfil...</p>
                    </div>
                ) : (
                    <>
                        <div className="page-card perfil-card">
                            <div className="perfil-topo">
                                {form.fotoUrl ? (
                                    <img
                                        src={form.fotoUrl}
                                        alt={form.nome}
                                        className="perfil-avatar-preview"
                                    />
                                ) : (
                                    <div className="perfil-avatar-preview perfil-avatar-fallback">
                                        {getUserInitials(form.nome)}
                                    </div>
                                )}

                                <div className="perfil-topo-info">
                                    <h2>{form.nome || "Usuário"}</h2>
                                    <p>{getRoleLabel(form.role)}</p>
                                    {form.turmaNome ? (
                                        <span className="perfil-badge">
                                            Turma: {form.turmaNome}
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="form-grid">
                                {error ? <div className="alert error">{error}</div> : null}
                                {success ? <div className="alert success">{success}</div> : null}

                                <div className="form-group">
                                    <label>Nome</label>
                                    <input
                                        name="nome"
                                        value={form.nome}
                                        disabled
                                    />
                                </div>

                                <div className="form-group">
                                    <label>E-mail</label>
                                    <input
                                        name="email"
                                        value={form.email}
                                        disabled
                                    />
                                </div>

                                <div className="form-group">
                                    <label>CPF</label>
                                    <input
                                        name="cpf"
                                        value={form.cpf}
                                        disabled
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Matrícula</label>
                                    <input
                                        name="matricula"
                                        value={form.matricula}
                                        disabled
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Telefone 1</label>
                                    <input
                                        name="fone1"
                                        value={form.fone1}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Telefone 2</label>
                                    <input
                                        name="fone2"
                                        value={form.fone2}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Perfil de acesso</label>
                                    <input
                                        value={getRoleLabel(form.role)}
                                        disabled
                                    />
                                </div>

                                <div className="form-group form-group-full">
                                    <label>Foto do perfil (URL)</label>
                                    <input
                                        name="fotoUrl"
                                        value={form.fotoUrl}
                                        onChange={handleChange}
                                        placeholder="https://exemplo.com/minha-foto.jpg"
                                    />
                                </div>

                                <div className="form-group form-group-full">
                                    <label>Sobre</label>
                                    <textarea
                                        name="bio"
                                        rows="4"
                                        value={form.bio}
                                        onChange={handleChange}
                                        placeholder="Escreva algo breve sobre você"
                                    />
                                </div>

                                <div className="form-actions form-group-full">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={saving}
                                    >
                                        {saving ? "Salvando..." : "Salvar alterações"}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="page-card perfil-card">
                            <h3>Alterar senha</h3>

                            <form onSubmit={handlePasswordSubmit} className="form-grid">
                                {passwordError ? (
                                    <div className="alert error">{passwordError}</div>
                                ) : null}

                                {passwordSuccess ? (
                                    <div className="alert success">{passwordSuccess}</div>
                                ) : null}

                                <div className="form-group">
                                    <label>Senha atual</label>
                                    <input
                                        type="password"
                                        name="senhaAtual"
                                        value={passwordForm.senhaAtual}
                                        onChange={handlePasswordChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Nova senha</label>
                                    <input
                                        type="password"
                                        name="novaSenha"
                                        value={passwordForm.novaSenha}
                                        onChange={handlePasswordChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Confirmar nova senha</label>
                                    <input
                                        type="password"
                                        name="confirmarNovaSenha"
                                        value={passwordForm.confirmarNovaSenha}
                                        onChange={handlePasswordChange}
                                    />
                                </div>

                                <div className="form-actions form-group-full">
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={savingPassword}
                                    >
                                        {savingPassword ? "Alterando..." : "Alterar senha"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}