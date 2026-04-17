import { useMemo, useState } from "react";
import Layout from "../components/Layout";

const POP_ITEMS = [
    {
        id: 1,
        titulo: "Salvar atestados e declarações",
        pergunta: "Quero lançar um atestado ou declaração do aluno",
        categoria: "Documentos",
        resumo:
            "Aprenda como registrar corretamente atestados médicos, declarações e observações no sistema.",
        objetivo:
            "Garantir que todos os atestados e/ou declarações entregues pelos alunos no setor pedagógico ou ao instrutor sejam lançados corretamente no ACADWEB.",
        passos: [
            "Assim que receber o atestado médico ou declaração, registre uma observação no nome do aluno no sistema.",
            "A observação deve conter o fato ocorrido, a data e o nome completo de quem lançou a informação.",
            "Observe a quantidade de dias de repouso e compare com os dias de aula para verificar risco de reprovação por faltas.",
            "Se o atestado for superior a 14 dias, encaminhe para a coordenação pedagógica analisar retirada de disciplina.",
            "Atestados de acompanhante só são válidos se constar o nome do aluno no documento.",
            "Atestados de óbito são aceitos apenas nos casos previstos no POP e, quando necessário, com comprovação de parentesco.",
        ],
        atencao: [
            "Toda observação deve terminar com o nome completo do colaborador responsável.",
            "Nem todo documento apresentado justifica automaticamente a falta.",
        ],
        indicador: "Total de atestados e declarações lançados no ACADWEB.",
    },
    {
        id: 2,
        titulo: "VPO (Visitas Pedagógicas Orientadas)",
        pergunta: "Quero organizar uma VPO",
        categoria: "VPO",
        resumo:
            "Fluxo para solicitação, ofício, autorização, relatório, frequência e lançamento no sistema.",
        objetivo:
            "Garantir que o processo de solicitação, lançamento e arquivo dos documentos de VPO seja realizado corretamente.",
        passos: [
            "Agendar a VPO com o campo para a turma.",
            "Solicitar ao instrutor as informações necessárias para o ofício, quando aplicável.",
            "Editar o ofício e encaminhar ao local solicitado.",
            "Informar o instrutor que o ofício foi enviado e aguardar retorno do local.",
            "Imprimir autorização, relatório de VPO e lista de frequência da turma.",
            "Entregar ao instrutor os documentos necessários.",
            "Após devolução dos documentos, fazer o lançamento no ACADWEB.",
            "Na ata de frequência, lançar faltas e presenças com os devidos carimbos.",
            "Conferir o lançamento das faltas no portal acadêmico pelo instrutor.",
            "Arquivar os documentos ao final do processo.",
        ],
        atencao: [
            "Se não houver necessidade de ofício, o fluxo pode começar direto na preparação dos documentos.",
            "Conferir sempre a frequência lançada depois da devolutiva.",
        ],
        indicador: "Total de VPOs realizadas no mês.",
    },
    {
        id: 3,
        titulo: "Atendimento ao aluno",
        pergunta: "Quero atender corretamente um aluno no pedagógico",
        categoria: "Atendimento",
        resumo:
            "Conduta para recepção, identificação da necessidade, devolutiva e registros do atendimento.",
        objetivo:
            "Garantir que o atendimento proporcione satisfação e leve à solução da dúvida ou problema do aluno.",
        passos: [
            "Receber o aluno com cordialidade e profissionalismo.",
            "Identificar a necessidade com escuta atenta e perguntas objetivas.",
            "Se necessário, encaminhar solicitação ao setor ou responsável correto.",
            "Registrar atendimentos relevantes no Acadweb ou em planilhas específicas.",
            "Preencher requerimentos com dados completos, corretos e confirmados.",
            "Quando houver pendência, registrar e acompanhar o retorno dentro do prazo combinado.",
            "Fornecer informações claras e objetivas, sem ambiguidades.",
            "Por telefone, falar somente com o próprio aluno.",
            "Em caso de saída temporária, verificar o motivo e liberar somente dentro da regra prevista.",
            "Para autorizações permanentes, exigir documento oficial e submeter à avaliação.",
        ],
        atencao: [
            "Não passar informações pessoais a terceiros por telefone.",
            "Alunos menores exigem contato com responsável para saída antecipada.",
        ],
        indicador: "Total de alunos atendidos no dia pelo setor pedagógico.",
    },
    {
        id: 4,
        titulo: "Controle de evasão",
        pergunta: "Quero fazer o controle de evasão dos faltosos",
        categoria: "Evasão",
        resumo:
            "Passo a passo para localizar alunos com faltas consecutivas, entrar em contato e registrar tratativas.",
        objetivo:
            "Garantir o contato com os alunos faltosos para reduzir indicadores como NC, LFR, LFI e LAC.",
        passos: [
            "Acessar o ACADWEB com login e senha próprios.",
            "Abrir a pasta de controle de evasão referente ao ano, mês e dia anterior.",
            "Filtrar os alunos com 2 faltas seguidas.",
            "Pesquisar o aluno no ACADWEB e verificar observações e tratativas anteriores.",
            "Ligar para os números cadastrados e perguntar o motivo da falta.",
            "Se houver justificativa, solicitar envio de foto ou arquivo para registro.",
            "Registrar com detalhes toda a tratativa no ACADWEB.",
            "Se não houver sucesso na ligação, enviar mensagem via WhatsApp e registrar também.",
            "Repetir o processo até concluir todos os alunos do fluxo diário.",
        ],
        atencao: [
            "Sempre conferir histórico de atendimentos antes de fazer novo contato.",
            "Toda tentativa de contato deve ser registrada.",
        ],
        indicador: "Quantidade de ligações realizadas no dia para alunos faltosos.",
    },
    {
        id: 5,
        titulo: "Atividades gerais do setor pedagógico",
        pergunta: "Quero consultar rotinas gerais do setor pedagógico",
        categoria: "Rotina do Setor",
        resumo:
            "Lista de tarefas operacionais do setor, incluindo pastas, materiais, mensagens, compras e organização.",
        objetivo:
            "Descrever as atividades gerais realizadas pelo setor pedagógico, garantindo organização e qualidade do atendimento.",
        passos: [
            "Atender alunos conforme o fluxo de atendimento.",
            "Separar pastas das turmas e disponibilizá-las na sala dos instrutores.",
            "Organizar cestinhas das salas com controles, apagador e canetões.",
            "Visualizar mensagens recebidas no portal acadêmico e solucionar dentro das permissões.",
            "Realizar cotações e compras de itens pedagógicos quando aprovadas.",
            "Montar a decoração mensal da unidade.",
            "Conferir requerimentos emitidos, salvar na rede, dar baixa e arquivar corretamente.",
            "Baixar fotos enviadas ao marketing para comprovações e registros.",
            "Verificar WhatsApp do setor e orientar corretamente quando não houver atendimento por esse canal.",
            "Atualizar comunicados de disciplinas disponíveis e providenciar impressões quando necessário.",
        ],
        atencao: [
            "Nem toda demanda recebida por WhatsApp deve ser atendida por esse canal.",
            "Conferência e arquivamento correto de requerimentos é rotina crítica.",
        ],
        indicador: "A definir.",
    },
    {
        id: 6,
        titulo: "Disciplina teórica encerrada",
        pergunta: "Quero conferir documentos de disciplina encerrada",
        categoria: "Encerramento",
        resumo:
            "Checklist para conferência de diário, plano, atas e documentos antes da liberação de pagamento.",
        objetivo:
            "Garantir que a conferência dos documentos da disciplina realizada pelo instrutor seja efetiva e agilize a liberação do pagamento.",
        passos: [
            "Retirar o material da pasta e acondicionar em envelope plástico.",
            "Conferir se o plano de ensino possui as assinaturas necessárias.",
            "Verificar se o plano de ensino foi enviado via portal acadêmico para os alunos.",
            "Conferir se o diário de classe está preenchido e assinado.",
            "Conferir a ata de frequência com assuntos resumidos preenchidos.",
            "Conferir a ata de avaliação, sem rasuras e devidamente assinada.",
            "Verificar na pasta da rede se constam avaliação final, recuperação e segunda chamada.",
            "Fazer cópia do diário de classe para cada instrutor envolvido.",
            "Entregar à coordenação pedagógica somente após todos os itens estarem corretos.",
        ],
        atencao: [
            "Pagamento só deve seguir se toda a documentação estiver correta.",
            "Se houver rasura, separar os documentos e aguardar correção do instrutor.",
        ],
        indicador: "Total de turmas encerradas no dia.",
    },
    {
        id: 8,
        titulo: "Cronograma de aulas teóricas",
        pergunta: "Quero montar ou conferir cronograma de aulas teóricas",
        categoria: "Cronograma",
        resumo:
            "Fluxo para criação da planilha, organização das turmas, definição de instrutores e conferências.",
        objetivo:
            "Garantir que os cronogramas de aulas teóricas sejam corretamente criados e disponibilizados para consultas futuras.",
        passos: [
            "No início do ano letivo, criar uma planilha compartilhada para cada curso.",
            "Inserir as turmas e disciplinas conforme os dias de aula de cada turma.",
            "Conferir se as datas das aulas batem com as datas do cronograma no ACADWEB.",
            "Definir os instrutores que fornecerão as aulas.",
            "Seguir com o envio dos materiais ao instrutor.",
            "Pintar o cronograma com uma cor para cada instrutor, conforme legenda.",
            "Receber do instrutor plano de ensino, avaliações e atividade extra.",
            "Imprimir o plano e encaminhar para avaliação pedagógica e técnica.",
            "Após aprovação, avisar o instrutor para envio via portal acadêmico.",
            "Depois do primeiro dia de aula, conferir se o plano foi enviado para a turma.",
        ],
        atencao: [
            "A conferência entre planilha e ACADWEB é obrigatória.",
            "O plano de ensino só segue após aprovação.",
        ],
        indicador: "A definir.",
    },
    {
        id: 9,
        titulo: "Justificativas de faltas",
        pergunta: "Quero tratar justificativa de faltas do aluno",
        categoria: "Frequência",
        resumo:
            "Entendimento das possibilidades de justificativa, reposição, composição de frequência e registros.",
        objetivo:
            "Garantir o correto entendimento e lançamento das justificativas de faltas do aluno.",
        passos: [
            "Receber o atestado ou declaração de trabalho no setor pedagógico ou pelo instrutor, conforme estágio da disciplina.",
            "Realizar leitura do documento e registrar a observação no ACADWEB.",
            "Após o encerramento da disciplina, analisar necessidade de reposição ou outra medida.",
            "Quando o aluno ultrapassar 1 falta do permitido, orientar reposição em outra turma conforme regra com ou sem custo.",
            "Quando houver 2 ou mais faltas justificadas, após análise, poderá ser proposto trabalho para composição de frequência.",
            "Convocar o aluno presencialmente para apresentar as possibilidades e riscos.",
            "Colher assinatura do termo de ciência quando houver trabalho para composição.",
            "Somente após entrega e correção do trabalho lançar a justificativa no campo específico.",
            "Emitir e arquivar ata individual, termo de ciência e trabalho na pasta da turma.",
        ],
        atencao: [
            "Trabalho de composição de frequência não vale nota.",
            "A composição depende de análise e solicitação da coordenação.",
        ],
        indicador: "A definir.",
    },
    {
        id: 10,
        titulo: "Envio de link de recuperação e segunda chamada",
        pergunta: "Quero enviar o link de recuperação ou segunda chamada",
        categoria: "Avaliações",
        resumo:
            "Checklist para criação do formulário, envio de mensagem, conferência de turmas e aplicação das provas.",
        objetivo:
            "Garantir que os alunos sejam informados corretamente sobre inscrições e dados das provas.",
        passos: [
            "Criar ou revisar o formulário de inscrição no Google Forms.",
            "Conferir as datas de abertura, fechamento e aplicação da prova.",
            "Enviar comunicado aos grupos sobre o período de inscrições.",
            "Enviar o link pelo portal acadêmico com a mensagem formatada.",
            "Selecionar apenas as turmas elegíveis para receber a mensagem.",
            "Encerrar o link no horário correto no dia de fechamento.",
            "Fazer levantamento dos alunos aptos e não aptos via ACADWEB.",
            "Avisar por WhatsApp e registrar no ACADWEB os casos impeditivos.",
            "Imprimir provas, gabaritos e atas.",
            "Organizar aplicação, sala, avisos e equipe do setor.",
            "Após aplicação, corrigir provas e lançar notas no ACADWEB.",
        ],
        atencao: [
            "Não enviar para turmas que ainda não devem realizar o processo.",
            "Conferir status do envio e guardar cópia da mensagem e do link.",
        ],
        indicador: "A definir.",
    },
    {
        id: 14,
        titulo: "Transferência de turma",
        pergunta: "Quero realizar transferência de turma",
        categoria: "Transferência",
        resumo:
            "Fluxo para análise acadêmica e financeira, preenchimento de requerimento e observações no sistema.",
        objetivo:
            "Garantir que o processo de transferência de turma do aluno seja realizado de forma efetiva.",
        passos: [
            "Verificar no Acadweb se o aluno é o responsável financeiro.",
            "Se não for, a formalização depende da presença e assinatura do responsável financeiro.",
            "Conferir pagamentos, taxa administrativa e possíveis ajustes financeiros com a CRA.",
            "Analisar o andamento acadêmico do aluno e a situação da disciplina vigente.",
            "Verificar qual turma está no mesmo andamento ou próximo do atual.",
            "Definir no documento se o aluno conclui a disciplina atual, reinicia ou cursará depois sem custo, conforme o caso.",
            "Preencher requerimento e adendo na pasta correta da rede.",
            "Se houver custo, imprimir para a secretaria e orientar pagamento.",
            "Salvar observações do adendo e do requerimento no Acadweb.",
        ],
        atencao: [
            "A transferência não deve ser feita sem análise acadêmica e financeira.",
            "A situação da disciplina em andamento precisa constar claramente no documento.",
        ],
        indicador: "A definir.",
    },
    {
        id: 15,
        titulo: "Viradas de módulo",
        pergunta: "Quero organizar a virada de módulo",
        categoria: "Eventos Acadêmicos",
        resumo:
            "Passo a passo para ata de entrega de apostila, protocolo, bombons, registro de foto e comunicação.",
        objetivo:
            "Organizar corretamente o processo de virada de módulo e entrega de apostilas.",
        passos: [
            "No dia anterior, imprimir a ata genérica de entrega de apostila.",
            "Registrar a entrega no caderno de protocolo da secretaria e colher assinatura.",
            "Gerar a ata no Acadweb com curso, turma, disciplina, título e subtítulo corretos.",
            "Conferir todos os dados antes de imprimir.",
            "Separar bombons para alunos e instrutor.",
            "Fixar mensagem motivacional nas embalagens.",
            "Subir em sala, entregar os bombons e parabenizar a turma.",
            "Registrar foto no aplicativo indicado.",
            "Postar a foto no grupo de mídia com a legenda adequada.",
        ],
        atencao: [
            "A ata deve ser conferida antes da impressão.",
            "O registro fotográfico faz parte da comprovação da ação.",
        ],
        indicador: "A definir.",
    },
];

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

export default function ManualPedagogicoPage() {
    const [busca, setBusca] = useState("");
    const [categoria, setCategoria] = useState("");
    const [openId, setOpenId] = useState(POP_ITEMS[0]?.id || null);

    const categorias = useMemo(() => {
        return [...new Set(POP_ITEMS.map((item) => item.categoria))].sort();
    }, []);

    const itensFiltrados = useMemo(() => {
        return POP_ITEMS.filter((item) => {
            const termo = normalizarTexto(busca);
            const matchBusca =
                !termo ||
                normalizarTexto(item.titulo).includes(termo) ||
                normalizarTexto(item.pergunta).includes(termo) ||
                normalizarTexto(item.resumo).includes(termo) ||
                normalizarTexto(item.categoria).includes(termo);

            const matchCategoria = !categoria || item.categoria === categoria;

            return matchBusca && matchCategoria;
        });
    }, [busca, categoria]);

    function toggleItem(id) {
        setOpenId((prev) => (prev === id ? null : id));
    }

    return (
        <Layout
            title="Central de Ajuda"
            subtitle="POP operacional em formato de consulta rápida"
        >
            <div className="manual-container">
                {/* <div className="manual-alert">
                    📌 Central de apoio do setor pedagógico com procedimentos operacionais em formato de FAQ.
                </div>

                <div className="manual-meta">
                    Baseado no Procedimento Operacional Padrão (POP) • Consulta rápida para equipe pedagógica
                </div> */}

                <section className="manual-section">
                    <h2>❓ O que você quer fazer?</h2>
                    <p>
                        Digite uma palavra-chave ou selecione uma categoria para localizar
                        rapidamente o procedimento desejado.
                    </p>

                    <div className="manual-grid">
                        <div className="form-group">
                            <label>Buscar procedimento</label>
                            <input
                                type="text"
                                placeholder="Ex.: evasão, VPO, falta, cronograma, transferência..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {categorias.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="manual-section">
                    <h2>📚 Procedimentos disponíveis</h2>

                    {!itensFiltrados.length ? (
                        <div className="manual-empty">
                            Nenhum procedimento encontrado para os filtros informados.
                        </div>
                    ) : (
                        <div className="manual-faq-list">
                            {itensFiltrados.map((item) => {
                                const isOpen = openId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`manual-faq-item ${isOpen ? "open" : ""}`}
                                    >
                                        <button
                                            type="button"
                                            className="manual-faq-question"
                                            onClick={() => toggleItem(item.id)}
                                        >
                                            <div>
                                                <div className="manual-faq-category">
                                                    {item.categoria}
                                                </div>
                                                <h3>
                                                    POP {String(item.id).padStart(2, "0")} •{" "}
                                                    {item.pergunta}
                                                </h3>
                                                <p>{item.resumo}</p>
                                            </div>

                                            <span className="manual-faq-icon">
                                                {isOpen ? "−" : "+"}
                                            </span>
                                        </button>

                                        {isOpen ? (
                                            <div className="manual-faq-answer">
                                                <div className="manual-faq-block">
                                                    <strong>Procedimento:</strong> {item.titulo}
                                                </div>

                                                <div className="manual-faq-block">
                                                    <strong>Objetivo:</strong> {item.objetivo}
                                                </div>

                                                <div className="manual-faq-block">
                                                    <strong>Passo a passo:</strong>
                                                    <ol>
                                                        {item.passos.map((passo, index) => (
                                                            <li key={index}>{passo}</li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                <div className="manual-faq-block">
                                                    <strong>Pontos de atenção:</strong>
                                                    <ul>
                                                        {item.atencao.map((ponto, index) => (
                                                            <li key={index}>{ponto}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="manual-faq-block">
                                                    <strong>Indicador de controle:</strong>{" "}
                                                    {item.indicador}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </Layout>
    );
}