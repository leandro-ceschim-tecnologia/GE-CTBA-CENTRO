import InstitutionInfoPage from "../components/InstitutionInfoPage";

export default function InstituicaoVisaoPage() {
    return (
        <InstitutionInfoPage
            title="Instituição - Visão"
            subtitle="Informações institucionais do Grau Educacional"
            icon="👁️"
            description="Até 2030, ser a rede de educação reconhecida nacionalmente como a melhor escolha para quem quer aprender, trabalhar e crescer na vida."
            bullets={[
                "Reconhecimento nacional",
                "Melhor escolha para aprender",
                "Conexão entre formação e crescimento de vida",
            ]}
        />
    );
}