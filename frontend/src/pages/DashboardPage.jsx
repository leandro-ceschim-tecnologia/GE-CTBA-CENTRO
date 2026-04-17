import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import OfertasDisponiveisSection from "../components/OfertasDisponiveisSection";
import CertificadosDisponiveisCard from "../components/CertificadosDisponiveisCard";
import InformativosAtivosSection from "../components/InformativosAtivosSection";
import DocumentosDisponiveisCard from "../pages/DocumentosDisponiveisCard";

export default function DashboardPage() {
    const { user } = useAuth();

    const mostrarRecursosUsuarioFinal = [
        "aluno",
        "instrutor",
        "comercial",
        "secretaria",
        "coordenacao",
        "pedagogico",
    ].includes(user?.role);

    const mostrarInformativos = [
        "aluno",
        "instrutor",
        "comercial",
        "secretaria",
        "coordenacao",
        "pedagogico",
        "admin",
    ].includes(user?.role);

    return (
        <Layout title="Home" subtitle="Bem-vindo ao novo portal do sistema">
            <div className="dashboard-grid">
                <div className="page-card">
                    <h1>EM PROCESSO DE CONSTRUÇÃO</h1>
                </div>
                <div>
                    <h3></h3>
                </div>
                {/* <div className="page-card">
                    <h3>Usuário logado</h3>
                    <p><strong>Nome:</strong> {user?.nome}</p>
                    <p><strong>E-mail:</strong> {user?.email}</p>
                    <p><strong>Perfil:</strong> {user?.role}</p>
                </div> */}
                <div>
                    <h1></h1>
                </div>

                {/* <div className="page-card">
                    <h3>Status da migração</h3>
                    <p>Frontend React funcionando</p>
                    <p>Backend Express funcionando</p>
                    <p>Autenticação JWT funcionando</p>
                </div> */}
            </div>

            {mostrarInformativos ? <InformativosAtivosSection /> : null}
            <div>
                <h1></h1>
            </div>

            <div className="dashboard-grid">
                {mostrarRecursosUsuarioFinal ? <OfertasDisponiveisSection /> : null}
                <div>
                    <h1></h1>
                </div>
                {mostrarRecursosUsuarioFinal ? <CertificadosDisponiveisCard /> : null}
                <div>
                    <h1></h1>
                </div>
                {mostrarRecursosUsuarioFinal ? <DocumentosDisponiveisCard /> : null}
                <div>
                    <h1></h1>
                </div>
            </div>
        </Layout>
    );
}