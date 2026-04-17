import CourseInfoPage from "../components/CourseInfoPage";

export default function RadiologiaPage() {
    return (
        <CourseInfoPage
            title="Curso Técnico em Radiologia"
            subtitle="Informações institucionais do curso"
            icon="🩻"
            description="O curso forma profissionais para atuar na realização de exames radiográficos convencionais, preparação de pacientes e apoio aos serviços de diagnóstico por imagem."
            areas={[
                "Radiografia convencional",
                "Diagnóstico por imagem",
                "Preparação de pacientes e ambiente",
                "Apoio em serviços especializados",
            ]}
            highlights={[
                "Contato com a área de imagem e diagnóstico",
                "Atuação técnica em ambientes de saúde",
                "Base para prática em diferentes exames",
            ]}
            profile={[
                "Atenção",
                "Responsabilidade",
                "Postura ética",
                "Interesse por saúde e tecnologia",
            ]}
        />
    );
}