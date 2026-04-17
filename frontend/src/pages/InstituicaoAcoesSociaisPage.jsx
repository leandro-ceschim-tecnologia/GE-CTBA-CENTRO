import InstitutionInfoPage from "../components/InstitutionInfoPage";

export default function InstituicaoAcoesSociaisPage() {
    return (
        <InstitutionInfoPage
            title="Instituição - Ações Sociais"
            subtitle="Informações institucionais do Grau Educacional"
            icon="🤝"
            description="O Grau Educacional também apresenta números de impacto social em ações ligadas a bolsas, empregabilidade, doações e encaminhamento ao mercado de trabalho."
            stats={[
                { value: "3.699", label: "Bolsas de estudos para pessoas carentes" },
                { value: "1.000", label: "Feiras de empregabilidade" },
                { value: "50.000", label: "Bolsas de sangue já doadas no Brasil" },
                { value: "+160.000", label: "Pessoas encaminhadas ao mercado de trabalho" },
            ]}
        />
    );
}