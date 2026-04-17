import CourseInfoPage from "../components/CourseInfoPage";

export default function EletrotecnicaPage() {
    return (
        <CourseInfoPage
            title="Curso Técnico em Eletrotécnica"
            subtitle="Informações institucionais do curso"
            icon="⚡"
            description="O curso capacita o aluno para instalar, operar e manter sistemas elétricos de baixa e alta tensão, incluindo aplicações ligadas à eficiência energética e energias renováveis."
            areas={[
                "Sistemas elétricos",
                "Instalações elétricas",
                "Manutenção de equipamentos",
                "Projetos e apoio técnico",
            ]}
            highlights={[
                "Abrange baixa e alta tensão",
                "Inclui noções de eficiência energética",
                "Contato com tecnologias atuais do setor",
            ]}
            profile={[
                "Raciocínio lógico",
                "Responsabilidade com normas e segurança",
                "Interesse por elétrica e tecnologia",
                "Disciplina técnica",
            ]}
        />
    );
}