import CourseInfoPage from "../components/CourseInfoPage";

export default function SegurancaTrabalhoPage() {
    return (
        <CourseInfoPage
            title="Curso Técnico em Segurança do Trabalho"
            subtitle="Informações institucionais do curso"
            icon="🦺"
            description="O curso prepara o aluno para colaborar com ações de prevenção, orientação e apoio à segurança no ambiente de trabalho, com foco em boas práticas e redução de riscos."
            areas={[
                "Prevenção de riscos",
                "Apoio a programas de segurança",
                "Orientação em ambientes de trabalho",
                "Promoção de cultura de segurança",
            ]}
            highlights={[
                "Formação voltada à prevenção",
                "Aplicação em diferentes segmentos",
                "Ênfase em segurança e responsabilidade",
            ]}
            profile={[
                "Atenção",
                "Comprometimento",
                "Boa comunicação",
                "Interesse por normas e prevenção",
            ]}
        />
    );
}