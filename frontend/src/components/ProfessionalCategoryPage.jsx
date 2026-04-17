import Layout from "./Layout";

export default function ProfessionalCategoryPage({
    title,
    subtitle,
    icon,
    description,
    courses = [],
}) {
    return (
        <Layout title={title} subtitle={subtitle}>
            <div className="manual-container">
                <div className="manual-alert">
                    <span>ℹ️</span>
                    <span>
                        Esta página apresenta informações institucionais sobre os cursos profissionalizantes da área.
                    </span>
                </div>

                <div className="manual-meta">
                    Conteúdo informativo
                </div>

                <section className="manual-section">
                    <h2>{icon} Visão geral da área</h2>
                    <p>{description}</p>
                </section>

                <section className="manual-section">
                    <h2>📚 Cursos da área</h2>

                    <div className="prof-grid">
                        {courses.map((course, index) => (
                            <div key={index} className="prof-card">
                                <h3>{course.name}</h3>
                                <p>{course.description}</p>
                                {course.mode && (
                                    <span className="prof-badge">{course.mode}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
}