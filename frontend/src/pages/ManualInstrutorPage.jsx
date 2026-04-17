import Layout from "../components/Layout";

export default function ManualInstrutorPage() {
    return (
        <Layout
            title="Manual do Instrutor"
            subtitle="Diretrizes e condutas da unidade"
        >


            <div className="manual-container">
                <div className="manual-alert">
                    ⚠️ Este manual deve ser seguido rigorosamente durante todas as atividades em sala.
                </div>

                <div className="manual-meta">
                    Última atualização: 05/04/2026
                </div>

                <section className="manual-section">
                    <h2>👋 Bem-vindo ao Grau Educacional</h2>
                    <p>
                        Você faz parte da família Grau Técnico e desempenha um papel essencial
                        na formação profissional e pessoal dos nossos alunos.
                    </p>

                    <div className="manual-grid">
                        <div>
                            <h3>🎯 Missão</h3>
                            <p>
                                Preparar profissionais técnicos para o mercado de trabalho,
                                formando cidadãos éticos e comprometidos com a sociedade.
                            </p>
                        </div>

                        <div>
                            <h3>👁️ Visão</h3>
                            <p>
                                Ser referência na formação de profissionais e cidadãos.
                            </p>
                        </div>

                        <div>
                            <h3>💚 Valores</h3>
                            <ul>
                                <li>Respeito e relações humanas</li>
                                <li>Preservação da vida</li>
                                <li>Inovação na educação</li>
                                <li>Inclusão e diversidade</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="manual-section">
                    <h2>📚 Papel do Instrutor</h2>
                    <p>
                        O instrutor deve dominar o conteúdo da disciplina e atuar como mediador
                        do processo de ensino-aprendizagem, promovendo aulas dinâmicas,
                        práticas e alinhadas ao mercado de trabalho.
                    </p>

                    <ul>
                        <li>Ministrar aulas dinâmicas e práticas</li>
                        <li>Preencher diário, notas e frequência</li>
                        <li>Participar de reuniões pedagógicas</li>
                        <li>Auxiliar na formação profissional dos alunos</li>
                    </ul>
                </section>

                <section className="manual-section">
                    <h2>🧠 Perfil do Instrutor</h2>

                    <div className="manual-grid">
                        <div>
                            <h3>Conhecimentos</h3>
                            <ul>
                                <li>Disciplina ministrada</li>
                                <li>Mercado de trabalho</li>
                                <li>Informática</li>
                                <li>Atendimento ao aluno</li>
                            </ul>
                        </div>

                        <div>
                            <h3>Habilidades</h3>
                            <ul>
                                <li>Aulas dinâmicas</li>
                                <li>Comunicação clara</li>
                                <li>Organização</li>
                                <li>Trabalho em equipe</li>
                                <li>Mediação de conflitos</li>
                            </ul>
                        </div>

                        <div>
                            <h3>Atitudes</h3>
                            <ul>
                                <li>Pontualidade</li>
                                <li>Assiduidade</li>
                                <li>Postura profissional</li>
                                <li>Liderança</li>
                                <li>Didática</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="manual-section">
                    <h2>📋 Atribuições Principais</h2>

                    <ul>
                        <li>Seguir o cronograma da disciplina</li>
                        <li>Utilizar material padronizado</li>
                        <li>Recepcionar alunos no início da aula</li>
                        <li>Manter sala organizada</li>
                        <li>Corrigir provas no mesmo dia</li>
                        <li>Controlar frequência e notas</li>
                        <li>Utilizar o portal do instrutor</li>
                        <li>Preservar laboratórios</li>
                    </ul>
                </section>

                <section className="manual-section alert">
                    <h2>⚠️ Regras Importantes</h2>

                    <ul>
                        <li>❌ Não liberar turma antes do horário</li>
                        <li>❌ Não cancelar aula sem autorização</li>
                        <li>❌ Não permitir alimentos em sala</li>
                        <li>❌ Não comercializar produtos na unidade</li>
                        <li>✔️ Cumprir horários rigorosamente</li>
                        <li>✔️ Avisar faltas com antecedência</li>
                    </ul>
                </section>

                <section className="manual-section">
                    <h2>📝 Avaliações</h2>

                    <ul>
                        <li>Provas com 10 questões</li>
                        <li>Duração: 1h30</li>
                        <li>Entrega de resultados no mesmo dia</li>
                        <li>Nota final de 0 a 10</li>
                        <li>Prazo de entrega de atas: 48h</li>
                    </ul>
                </section>

                <section className="manual-section">
                    <h2>💼 Agência de Emprego</h2>

                    <p>
                        O instrutor é fundamental no encaminhamento dos alunos ao mercado de trabalho.
                    </p>

                    <h4>Pré-requisitos do aluno:</h4>
                    <ul>
                        <li>Nota ≥ 7,0</li>
                        <li>Frequência mínima de 75%</li>
                        <li>Participação em palestras</li>
                        <li>Estar adimplente</li>
                    </ul>
                </section>
            </div>
        </Layout>
    );
}