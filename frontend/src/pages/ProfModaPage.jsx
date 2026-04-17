import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfModaPage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Moda"
            subtitle="Informações institucionais da área"
            icon="🧵"
            description="A área de Moda reúne cursos ligados à criação, ajustes, costura e produção de peças do vestuário."
            courses={[
                {
                    name: "Corte e Costura",
                    description: "Curso voltado à construção, ajustes e desenvolvimento de peças de vestuário.",
                    mode: "Presencial",
                },
            ]}
        />
    );
}