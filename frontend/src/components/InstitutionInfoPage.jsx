import Layout from "./Layout";

export default function InstitutionInfoPage({
    title,
    subtitle,
    icon,
    description,
    bullets = [],
    stats = [],
}) {
    return (
        <Layout title={title} subtitle={subtitle}>
            <div className="manual-container">
                <div className="manual-alert">
                    <span>ℹ️</span>
                    <span>
                        Esta página apresenta informações institucionais do Grau Educacional.
                    </span>
                </div>

                <div className="manual-meta">
                    Conteúdo institucional
                </div>

                <section className="manual-section">
                    <h2>{icon} Visão geral</h2>
                    <p>{description}</p>
                </section>

                {bullets.length > 0 && (
                    <section className="manual-section">
                        <h2>📌 Informações principais</h2>
                        <ul>
                            {bullets.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {stats.length > 0 && (
                    <section className="manual-section">
                        <h2>📊 Nossos números</h2>
                        <div className="prof-grid">
                            {stats.map((item, index) => (
                                <div key={index} className="prof-card">
                                    <h3>{item.value}</h3>
                                    <p>{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </Layout>
    );
}