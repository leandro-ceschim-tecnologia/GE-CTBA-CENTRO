import InstitutionInfoPage from "../components/InstitutionInfoPage";

export default function InstituicaoMissaoPage() {
    return (
        <InstitutionInfoPage
            title="Instituição - Missão"
            subtitle="Informações institucionais do Grau Educacional"
            icon="🎯"
            description="Proporcionar educação de qualidade, transformando vidas, por meio da geração de renda, empregabilidade, empreendedorismo, construindo uma rede sustentável, formando profissionais conscientes do seu papel na sociedade e no desenvolvimento do país."
            bullets={[
                "Educação de qualidade",
                "Transformação de vidas",
                "Empregabilidade e geração de renda",
                "Empreendedorismo",
                "Formação de profissionais conscientes",
            ]}
        />
    );
}