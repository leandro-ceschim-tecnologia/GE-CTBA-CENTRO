import Layout from "./Layout";

export default function CourseInfoPage({
    title,
    subtitle,
    icon,
    description,
    areas = [],
    highlights = [],
    profile = [],
}) {
    return (
        <Layout title={title} subtitle={subtitle}>
            <div className="manual-container">
                <div className="manual-alert">
                    <span>ℹ️</span>
                    <span>
                        Esta página apresenta informações institucionais sobre o curso.
                    </span>
                </div>

                <div className="manual-meta">
                    Conteúdo informativo
                </div>

                <section className="manual-section">
                    <h2>{icon} Visão geral</h2>
                    <p>{description}</p>
                </section>

                <section className="manual-section">
                    <h2>🎯 Áreas de atuação</h2>
                    <ul>
                        {areas.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </section>

                <section className="manual-section">
                    <h2>⭐ Destaques do curso</h2>
                    <ul>
                        {highlights.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </section>

                <section className="manual-section">
                    <h2>🧠 Perfil esperado do aluno</h2>
                    <ul>
                        {profile.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </Layout>
    );
}