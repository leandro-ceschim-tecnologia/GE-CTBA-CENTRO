import InstitutionInfoPage from "../components/InstitutionInfoPage";

export default function InstituicaoValoresPage() {
    return (
        <InstitutionInfoPage
            title="Instituição - Valores"
            subtitle="Informações institucionais do Grau Educacional"
            icon="💚"
            description="Os valores do Grau Educacional reforçam o compromisso com uma formação humana, inclusiva, conectada com a realidade social e apoiada em inovação acessível."
            bullets={[
                "Empregabilidade com propósito",
                "Acolhimento e respeito",
                "Parceria com a comunidade",
                "Inovação com acesso",
            ]}
        />
    );
}