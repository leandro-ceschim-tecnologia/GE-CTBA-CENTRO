import CourseInfoPage from "../components/CourseInfoPage";

export default function EnfermagemPage() {
    return (
        <CourseInfoPage
            title="Curso Técnico em Enfermagem"
            subtitle="Informações institucionais do curso"
            icon="🩺"
            description="O curso capacita profissionais para atuar na promoção, prevenção, recuperação e reabilitação dos processos de saúde, colaborando com o atendimento de pacientes e da comunidade."
            areas={[
                "Clínicas e hospitais",
                "Atendimento assistencial",
                "Ações de promoção à saúde",
                "Apoio em diferentes faixas etárias",
            ]}
            highlights={[
                "Foco em cuidado e assistência",
                "Atuação em diferentes contextos de saúde",
                "Formação voltada à prática profissional",
            ]}
            profile={[
                "Empatia",
                "Responsabilidade",
                "Boa postura profissional",
                "Interesse pela área da saúde",
            ]}
        />
    );
}