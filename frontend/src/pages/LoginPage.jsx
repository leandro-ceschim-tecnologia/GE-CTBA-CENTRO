import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoOng from "../assets/logograu.png";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        senha: "",
        lembrar: false,
    });

    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSending(true);

        try {
            await login(form.email, form.senha);
            navigate("/");
        } catch (err) {
            setError(err.message || "Não foi possível entrar.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-wrapper">
                <div className="login-brand">
                    <img
                        src={logoOng}
                        alt="Logo da ONG"
                        className="login-logo"
                    />
                </div>

                <div className="login-card">
                    <h1 className="login-title">Bem-vindo!</h1>
                    <div className="login-divider" />

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Endereço de e-mail</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                                placeholder=""
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="senha">Senha</label>
                            <input
                                id="senha"
                                type="password"
                                name="senha"
                                value={form.senha}
                                onChange={handleChange}
                                autoComplete="current-password"
                                placeholder=""
                            />
                        </div>

                        <div className="login-options">
                            <label className="remember-me">
                                <input
                                    type="checkbox"
                                    name="lembrar"
                                    checked={form.lembrar}
                                    onChange={handleChange}
                                />
                                <span>Lembre-me</span>
                            </label>

                            <button
                                type="button"
                                className="forgot-password"
                                onClick={() => {
                                    // depois você pode trocar por navigate("/esqueci-senha")
                                }}
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>

                        {error ? <p className="form-error">{error}</p> : null}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={sending}
                        >
                            {sending ? "Entrando..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}