import InstitutionInfoPage from "../components/InstitutionInfoPage";

export default function InstituicaoSobrePage() {
    return (
        <InstitutionInfoPage
            title="Instituição - Sobre o Grau"
            subtitle="Informações institucionais do Grau Educacional"
            icon="📖"
            description="O Grau Educacional defende uma formação que una conhecimento técnico, consciência social, respeito ao próximo e trabalho em equipe, buscando orientar a realização profissional e a inserção social por meio de uma educação estimuladora e inovadora."
            bullets={[
                "Educação voltada à transformação de vidas",
                "Formação técnica com responsabilidade social",
                "Compromisso com inserção social e profissional",
                "Valorização do conhecimento, da solidariedade e do trabalho em equipe",
            ]}
        />
    );
}