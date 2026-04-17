import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfAutomotivoPage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Automotivo"
            subtitle="Informações institucionais da área"
            icon="🚗"
            description="A área Automotiva reúne cursos voltados ao conhecimento técnico aplicado à manutenção, diagnóstico e serviços do setor automotivo."
            courses={[
                {
                    name: "Conteúdo automotivo em atualização",
                    description: "Esta área pode ser atualizada conforme a oferta institucional local de cursos profissionalizantes automotivos.",
                    mode: "Consulte a unidade",
                },
            ]}
        />
    );
}