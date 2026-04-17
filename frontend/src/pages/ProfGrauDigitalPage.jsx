import ProfessionalCategoryPage from "../components/ProfessionalCategoryPage";

export default function ProfGrauDigitalPage() {
    return (
        <ProfessionalCategoryPage
            title="Profissionalizantes - Grau Digital"
            subtitle="Informações institucionais da área"
            icon="💻"
            description="A área Grau Digital reúne cursos voltados à informática, comunicação, produtividade e desenvolvimento de competências digitais aplicadas ao mercado."
            courses={[
                {
                    name: "AutoCAD 2D e 3D",
                    description: "Curso interativo voltado à criação e edição de desenhos técnicos digitais.",
                    mode: "Interativo",
                },
                {
                    name: "Back End",
                    description: "Curso com foco em lógica e desenvolvimento de programas e sistemas.",
                    mode: "Interativo",
                },
                {
                    name: "Operador de Computador",
                    description: "Formação abrangente no uso do computador e softwares essenciais.",
                    mode: "Presencial / Interativo",
                },
                {
                    name: "Oratória",
                    description: "Curso de comunicação, expressão verbal e técnicas para falar em público.",
                    mode: "Interativo",
                },
                {
                    name: "Designer Gráfico",
                    description: "Curso de comunicação visual com uso de softwares gráficos do mercado.",
                    mode: "Interativo",
                },
                {
                    name: "Excel Básico",
                    description: "Curso introdutório para criação, organização e análise de planilhas.",
                    mode: "Interativo",
                },
            ]}
        />
    );
}