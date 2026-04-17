import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfGourmetPage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Grau Gourmet"
            subtitle="Informações institucionais da área"
            icon="🍳"
            description="A área Grau Gourmet reúne cursos voltados à culinária, produção de alimentos e preparação profissional para atuação gastronômica."
            courses={[
                {
                    name: "Confeitaria",
                    description: "Curso voltado à produção de bolos, doces, sobremesas e técnicas de confeitaria.",
                    mode: "Presencial",
                },
                {
                    name: "Fast Food",
                    description: "Curso com foco em produção rápida e preparo de itens populares do segmento.",
                    mode: "Presencial",
                },
            ]}
        />
    );
}