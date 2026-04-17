import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Topbar({
    title = "Dashboard",
    subtitle = "Ambiente administrativo",
    onToggleSidebar,
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login");
    }

    function handleOpenProfile() {
        navigate("/meu-perfil");
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
        <header className="topbar">
            <div className="topbar-left">
                <button
                    className="menu-toggle"
                    type="button"
                    onClick={onToggleSidebar}
                    aria-label="Abrir ou fechar menu"
                >
                    ☰
                </button>

                <div>
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>
            </div>

            <div className="topbar-user">
                <button
                    type="button"
                    className="user-profile-trigger"
                    onClick={handleOpenProfile}
                    title="Abrir meu perfil"
                >
                    {user?.fotoUrl ? (
                        <img
                            src={user.fotoUrl}
                            alt={user?.nome || "Usuário"}
                            className="user-avatar"
                        />
                    ) : (
                        <div className="user-avatar user-avatar-fallback">
                            {getUserInitials(user?.nome)}
                        </div>
                    )}

                    <div className="user-box">
                        <span className="user-name">
                            {user?.nome || "Usuário"}
                        </span>

                        <span className="user-role">
                            {getRoleLabel(user?.role)}
                        </span>
                    </div>
                </button>

                <button className="btn-logout" type="button" onClick={handleLogout}>
                    Sair
                </button>
            </div>
        </header>
    );
}