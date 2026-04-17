import CourseInfoPage from "../components/CourseInfoPage";

export default function AdministracaoPage() {
    return (
        <CourseInfoPage
            title="Curso Técnico em Administração"
            subtitle="Informações institucionais do curso"
            icon="📘"
            description="O curso prepara o aluno para atuar em rotinas administrativas, organização de processos, apoio à gestão e atividades ligadas ao funcionamento de empresas e instituições."
            areas={[
                "Setor administrativo",
                "Atendimento e suporte operacional",
                "Rotinas financeiras e comerciais",
                "Organização de documentos e processos",
            ]}
            highlights={[
                "Formação voltada para ambiente corporativo",
                "Desenvolvimento de visão organizacional",
                "Contato com práticas administrativas",
            ]}
            profile={[
                "Organização",
                "Boa comunicação",
                "Responsabilidade",
                "Interesse por gestão e processos",
            ]}
        />
    );
}