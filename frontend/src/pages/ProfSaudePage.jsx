import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfSaudePage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Saúde"
            subtitle="Informações institucionais da área"
            icon="🩺"
            description="A área de Saúde reúne cursos profissionalizantes voltados ao cuidado, atendimento, apoio técnico e serviços ligados ao bem-estar e à assistência."
            courses={[
                {
                    name: "APH - Atendimento Pré-hospitalar",
                    description: "Curso voltado à atuação inicial em situações de emergência e primeiros atendimentos.",
                    mode: "Presencial",
                },
                {
                    name: "Auxiliar de Pet Shop",
                    description: "Curso para apoio às rotinas de atendimento, organização e cuidados em pet shops.",
                    mode: "Presencial",
                },
            ]}
        />
    );
}