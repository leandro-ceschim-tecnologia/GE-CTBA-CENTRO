import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfBelezaPage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Grau Beleza"
            subtitle="Informações institucionais da área"
            icon="💄"
            description="A área Grau Beleza reúne cursos voltados ao cuidado pessoal, estética, imagem e serviços de beleza."
            courses={[
                {
                    name: "Barbeiro Profissional",
                    description: "Curso com foco em técnicas de corte, acabamento, barba e atendimento profissional.",
                    mode: "Presencial",
                },
            ]}
        />
    );
}