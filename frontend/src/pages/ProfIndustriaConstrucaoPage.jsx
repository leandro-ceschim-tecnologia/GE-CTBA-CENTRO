import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfIndustriaConstrucaoPage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Indústria e Construção"
            subtitle="Informações institucionais da área"
            icon="🏗️"
            description="A área de Indústria e Construção reúne cursos profissionalizantes focados em instalações, manutenção, segurança e operação técnica."
            courses={[
                {
                    name: "Bombeiro Civil",
                    description: "Curso voltado à prevenção, combate inicial a incêndios e atuação em situações de emergência.",
                    mode: "Presencial",
                },
                {
                    name: "Eletricista Predial + NR10",
                    description: "Curso de instalações elétricas prediais com base em segurança em eletricidade.",
                    mode: "Presencial",
                },
                {
                    name: "Instalador de Energia Solar",
                    description: "Curso de instalação e manutenção de sistemas solares fotovoltaicos.",
                    mode: "Presencial",
                },
                {
                    name: "NR10",
                    description: "Curso básico de segurança em instalações e serviços com eletricidade.",
                    mode: "Presencial",
                },
                {
                    name: "Refrigeração e Climatização",
                    description: "Curso voltado à instalação e manutenção de sistemas de climatização.",
                    mode: "Presencial",
                },
            ]}
        />
    );
}