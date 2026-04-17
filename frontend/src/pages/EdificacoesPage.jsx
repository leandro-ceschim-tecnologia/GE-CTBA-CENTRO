import CourseInfoPage from "../components/CourseInfoPage";

export default function EdificacoesPage() {
    return (
        <CourseInfoPage
            title="Curso Técnico em Edificações"
            subtitle="Informações institucionais do curso"
            icon="🏗️"
            description="O curso habilita o aluno para atuar com conhecimentos de planejamento, operação, manutenção e gerenciamento de soluções tecnológicas voltadas à infraestrutura."
            areas={[
                "Construção civil",
                "Acompanhamento de obras",
                "Leitura e apoio a projetos",
                "Planejamento e controle de atividades",
            ]}
            highlights={[
                "Foco em infraestrutura",
                "Base técnica para atuação em obras",
                "Visão prática sobre processos construtivos",
            ]}
            profile={[
                "Atenção a detalhes",
                "Raciocínio técnico",
                "Interesse por obras e projetos",
                "Organização",
            ]}
        />
    );
}