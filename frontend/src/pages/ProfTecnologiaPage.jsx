import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfTecnologiaPage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Tecnologia"
            subtitle="Informações institucionais da área"
            icon="🤖"
            description="A área de Tecnologia reúne cursos ligados a ferramentas digitais, inovação e recursos tecnológicos aplicados ao trabalho."
            courses={[
                {
                    name: "Inteligência Artificial",
                    description: "Curso focado em conceitos e aplicações práticas de IA, incluindo ferramentas populares.",
                    mode: "Interativo",
                },
                {
                    name: "Informática para Adultos",
                    description: "Curso voltado ao uso prático do computador, internet e programas essenciais.",
                    mode: "Interativo",
                },
            ]}
        />
    );
}