import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

export default function PerfisPublicosPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        loadUsuarios();
    }, []);

    useEffect(() => {
        function handleEsc(event) {
            if (event.key === "Escape") {
                setSelectedUser(null);
            }
        }

        if (selectedUser) {
            window.addEventListener("keydown", handleEsc);
        }

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [selectedUser]);

    async function loadUsuarios() {
        setLoading(true);
        setErro("");

        try {
            const data = await apiRequest("/users/usuarios-publicos");
            setUsuarios(Array.isArray(data) ? data : []);
        } catch (error) {
            setErro(error.message || "Erro ao carregar perfis.");
        } finally {
            setLoading(false);
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

    function openUserModal(usuario) {
        setSelectedUser(usuario);
    }

    function closeUserModal() {
        setSelectedUser(null);
    }

    return (
        <Layout
            title="Perfis da Comunidade"
            subtitle="Conheça os usuários da plataforma"
        >
            <div className="perfis-publicos-page">
                {loading ? (
                    <div className="page-card">
                        <p>Carregando perfis...</p>
                    </div>
                ) : erro ? (
                    <div className="page-card">
                        <div className="alert error">{erro}</div>
                    </div>
                ) : usuarios.length === 0 ? (
                    <div className="page-card">
                        <p>Nenhum perfil disponível no momento.</p>
                    </div>
                ) : (
                    <div className="perfis-grid">
                        {usuarios.map((usuario) => (
                            <article
                                key={usuario.id}
                                className="perfil-publico-card perfil-publico-card-clickable"
                                onClick={() => openUserModal(usuario)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        openUserModal(usuario);
                                    }
                                }}
                                title="Clique para ver mais detalhes"
                            >
                                <div className="perfil-publico-topo">
                                    {usuario.fotoUrl ? (
                                        <img
                                            src={usuario.fotoUrl}
                                            alt={usuario.nome}
                                            className="perfil-publico-avatar"
                                        />
                                    ) : (
                                        <div className="perfil-publico-avatar perfil-publico-avatar-fallback">
                                            {getUserInitials(usuario.nome)}
                                        </div>
                                    )}
                                </div>

                                <div className="perfil-publico-conteudo">
                                    <h3>{usuario.nome}</h3>
                                    <span className="perfil-publico-role">
                                        {getRoleLabel(usuario.role)}
                                    </span>

                                    <p className="perfil-publico-bio">
                                        {usuario.bio?.trim()
                                            ? usuario.bio
                                            : "Este usuário ainda não adicionou uma descrição."}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            {selectedUser && (
                <div className="perfil-modal-overlay" onClick={closeUserModal}>
                    <div
                        className="perfil-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="perfil-modal-close"
                            onClick={closeUserModal}
                        >
                            ×
                        </button>

                        <div className="perfil-modal-header">
                            {selectedUser.fotoUrl ? (
                                <img
                                    src={selectedUser.fotoUrl}
                                    alt={selectedUser.nome}
                                    className="perfil-modal-avatar"
                                />
                            ) : (
                                <div className="perfil-modal-avatar perfil-publico-avatar-fallback">
                                    {getUserInitials(selectedUser.nome)}
                                </div>
                            )}

                            <div>
                                <h2>{selectedUser.nome}</h2>
                                <span className="perfil-publico-role">
                                    {getRoleLabel(selectedUser.role)}
                                </span>
                            </div>
                        </div>

                        <div className="perfil-modal-body">
                            <div className="perfil-modal-info">
                                <strong>Sobre:</strong>
                                <p>
                                    {selectedUser.bio?.trim()
                                        ? selectedUser.bio
                                        : "Este usuário ainda não adicionou uma descrição."}
                                </p>
                            </div>

                            {selectedUser.email && (
                                <div className="perfil-modal-info">
                                    <strong>E-mail:</strong>
                                    <p>{selectedUser.email}</p>
                                </div>
                            )}

                            {selectedUser.telefone && (
                                <div className="perfil-modal-info">
                                    <strong>Telefone:</strong>
                                    <p>{selectedUser.telefone}</p>
                                </div>
                            )}

                            {selectedUser.curso?.nome && (
                                <div className="perfil-modal-info">
                                    <strong>Curso:</strong>
                                    <p>{selectedUser.curso.nome}</p>
                                </div>
                            )}

                            {selectedUser.turma?.nome && (
                                <div className="perfil-modal-info">
                                    <strong>Turma:</strong>
                                    <p>{selectedUser.turma.nome}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}