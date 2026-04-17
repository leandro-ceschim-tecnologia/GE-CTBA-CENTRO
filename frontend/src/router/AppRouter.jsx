import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MeuPerfilPage from "../pages/MeuPerfilPage";

import PerfisPublicosPage from "../pages/PerfisPublicosPage";
import PrivateRoute from "../components/PrivateRoute";
import CursosPage from "../pages/CursosPage";
import DashboardPage from "../pages/DashboardPage";
import DisciplinasPage from "../pages/DisciplinasPage";
import LoginPage from "../pages/LoginPage";
import TurmasPage from "../pages/TurmasPage";
import UsersPage from "../pages/UsersPage";
import TurmaDisciplinasPage from "../pages/TurmaDisciplinasPage";
import CronogramaPage from "../pages/CronogramaPage";
import CronogramaGeral from "../pages/CronogramaGeral";
import RecessosPage from "../pages/RecessosPage";
import MinhasAulasInstrutorPage from "../pages/MinhasAulasInstrutorPage";
import MinhasAulasAlunoPage from "../pages/MinhasAulasAlunoPage";
import OfertasPage from "../pages/OfertasPage";
import OfertaFormPage from "../pages/OfertaFormPage";
import OfertaInscritosPage from "../pages/OfertaInscritosPage";
import MinhasInscricoesPage from "../pages/MinhasInscricoesPage";
import ValidarCertificadoPage from "../pages/ValidarCertificadoPage";
import InformativosPage from "../pages/InformativosPage";
import TarefasPedagogicasPage from "../pages/TarefasPedagogicasPage";
import ManualInstrutorPage from "../pages/ManualInstrutorPage";

import AdministracaoPage from "../pages/AdministracaoPage";
import EdificacoesPage from "../pages/EdificacoesPage";
import EletrotecnicaPage from "../pages/EletrotecnicaPage";
import EnfermagemPage from "../pages/EnfermagemPage";
import RadiologiaPage from "../pages/RadiologiaPage";
import SegurancaTrabalhoPage from "../pages/SegurancaTrabalhoPage";

import ProfSaudePage from "../pages/ProfSaudePage";
import ProfGrauDigitalPage from "../pages/ProfGrauDigitalPage";
import ProfIndustriaConstrucaoPage from "../pages/ProfIndustriaConstrucaoPage";
import ProfGourmetPage from "../pages/ProfGourmetPage";
import ProfBelezaPage from "../pages/ProfBelezaPage";
import ProfModaPage from "../pages/ProfModaPage";
import ProfTecnologiaPage from "../pages/ProfTecnologiaPage";
import ProfAutomotivoPage from "../pages/ProfAutomotivoPage";

import InstituicaoSobrePage from "../pages/InstituicaoSobrePage";
import InstituicaoMissaoPage from "../pages/InstituicaoMissaoPage";
import InstituicaoVisaoPage from "../pages/InstituicaoVisaoPage";
import InstituicaoValoresPage from "../pages/InstituicaoValoresPage";
import InstituicaoAcoesSociaisPage from "../pages/InstituicaoAcoesSociaisPage";

import EstagiosEnfPage from "../pages/EstagiosEnfPage";
import EstagioBlocoFormPage from "../pages/EstagioBlocoFormPage";
import EstagioBlocoDetalhePage from "../pages/EstagioBlocoDetalhePage";
import CamposEstagioPage from "../pages/CamposEstagioPage";
import EstagioGrupoPage from "../pages/EstagioGrupoPage";
import MeuEstagioPage from "../pages/MeuEstagioPage";

import DocumentosPage from "../pages/DocumentosPage";
import MeusDocumentosPage from "../pages/MeusDocumentosPage";
import ValidarDocumentoPage from "../pages/ValidarDocumentoPage";

import FrequenciaPage from "../pages/FrequenciaPage";
import EvasaoPage from "../pages/EvasaoPage";

import ManualPedagogicoPage from "../pages/ManualPedagogicoPage";

import SalasPage from "../pages/SalasPage";
import EnsalamentoPage from "../pages/EnsalamentoPage";
import MeuEnsalamentoPage from "../pages/MeuEnsalamentoPage";
import OcupacaoSalasPage from "../pages/OcupacaoSalasPage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route
                    path="/meu-perfil"
                    element={
                        <PrivateRoute>
                            <MeuPerfilPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/perfis"
                    element={
                        <PrivateRoute>
                            <PerfisPublicosPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/instituicao/sobre"
                    element={
                        <PrivateRoute>
                            <InstituicaoSobrePage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/instituicao/missao"
                    element={
                        <PrivateRoute>
                            <InstituicaoMissaoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/instituicao/visao"
                    element={
                        <PrivateRoute>
                            <InstituicaoVisaoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/instituicao/valores"
                    element={
                        <PrivateRoute>
                            <InstituicaoValoresPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/instituicao/acoes-sociais"
                    element={
                        <PrivateRoute>
                            <InstituicaoAcoesSociaisPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <DashboardPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/usuarios"
                    element={
                        <PrivateRoute>
                            <UsersPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cursos"
                    element={
                        <PrivateRoute>
                            <CursosPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/turmas"
                    element={
                        <PrivateRoute>
                            <TurmasPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/disciplinas"
                    element={
                        <PrivateRoute>
                            <DisciplinasPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/turma-disciplinas"
                    element={
                        <PrivateRoute>
                            <TurmaDisciplinasPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cronograma"
                    element={
                        <PrivateRoute>
                            <CronogramaPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cronograma-geral"
                    element={
                        <PrivateRoute>
                            <CronogramaGeral />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/recessos"
                    element={
                        <PrivateRoute>
                            <RecessosPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/minhas-aulas/instrutor"
                    element={
                        <PrivateRoute>
                            <MinhasAulasInstrutorPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/minhas-aulas/aluno"
                    element={
                        <PrivateRoute>
                            <MinhasAulasAlunoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/ofertas"
                    element={
                        <PrivateRoute>
                            <OfertasPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/ofertas/nova"
                    element={
                        <PrivateRoute>
                            <OfertaFormPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/ofertas/:id/editar"
                    element={
                        <PrivateRoute>
                            <OfertaFormPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/ofertas/:id/inscritos"
                    element={
                        <PrivateRoute>
                            <OfertaInscritosPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/minhas-inscricoes"
                    element={
                        <PrivateRoute>
                            <MinhasInscricoesPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/informativos"
                    element={
                        <PrivateRoute roles={["admin", "pedagogico", "coordsetor", "coordenacao"]}>
                            <InformativosPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/tarefas-pedagogicas"
                    element={
                        <PrivateRoute roles={["admin", "pedagogico"]}>
                            <TarefasPedagogicasPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/manual-instrutor"
                    element={
                        <PrivateRoute allowedRoles={["instrutor", "pedagogico", "coordenacao", "admin"]}>
                            <ManualInstrutorPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cursos/administracao"
                    element={
                        <PrivateRoute>
                            <AdministracaoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cursos/edificacoes"
                    element={
                        <PrivateRoute>
                            <EdificacoesPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cursos/eletrotecnica"
                    element={
                        <PrivateRoute>
                            <EletrotecnicaPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cursos/enfermagem"
                    element={
                        <PrivateRoute>
                            <EnfermagemPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cursos/radiologia"
                    element={
                        <PrivateRoute>
                            <RadiologiaPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/cursos/seguranca-do-trabalho"
                    element={
                        <PrivateRoute>
                            <SegurancaTrabalhoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/saude"
                    element={
                        <PrivateRoute>
                            <ProfSaudePage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/grau-digital"
                    element={
                        <PrivateRoute>
                            <ProfGrauDigitalPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/industria-construcao"
                    element={
                        <PrivateRoute>
                            <ProfIndustriaConstrucaoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/gourmet"
                    element={
                        <PrivateRoute>
                            <ProfGourmetPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/beleza"
                    element={
                        <PrivateRoute>
                            <ProfBelezaPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/moda"
                    element={
                        <PrivateRoute>
                            <ProfModaPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/tecnologia"
                    element={
                        <PrivateRoute>
                            <ProfTecnologiaPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/profissionalizantes/automotivo"
                    element={
                        <PrivateRoute>
                            <ProfAutomotivoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/estagios-enfermagem"
                    element={
                        <PrivateRoute>
                            <EstagiosEnfPage />
                        </PrivateRoute>

                    }
                />

                <Route
                    path="/estagios-enfermagem/novo"
                    element={
                        <PrivateRoute>
                            <EstagioBlocoFormPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/estagios-enfermagem/blocos/:id"
                    element={
                        <PrivateRoute roles={["admin", "pedagogico", "coordenacao"]}>
                            <EstagioBlocoDetalhePage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/estagios-enfermagem/campos"
                    element={
                        <PrivateRoute roles={["admin", "pedagogico", "coordenacao"]}>
                            <CamposEstagioPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/estagios-enfermagem/grupos/:grupoId"
                    element={
                        <PrivateRoute roles={["admin", "pedagogico", "coordenacao"]}>
                            <EstagioGrupoPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/meu-estagio"
                    element={
                        <PrivateRoute roles={["aluno"]}>
                            <MeuEstagioPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/documentos"
                    element={
                        <PrivateRoute roles={["admin", "pedagogico", "coordenacao"]}>
                            <DocumentosPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/meus-documentos"
                    element={
                        <PrivateRoute roles={["admin", "pedagogico", "coordenacao"]}>
                            <MeusDocumentosPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/frequencia"
                    element={
                        <PrivateRoute>
                            <FrequenciaPage />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/evasao"
                    element={
                        <PrivateRoute>
                            <EvasaoPage />
                        </PrivateRoute>
                    }
                />

                <Route path="/manual-pedagogico" element={<ManualPedagogicoPage />} />

                <Route path="/salas" element={<SalasPage />} />
                <Route path="/ensalamento" element={<EnsalamentoPage />} />
                <Route path="/meu-ensalamento" element={<MeuEnsalamentoPage />} />
                <Route path="/ocupacao-salas" element={<OcupacaoSalasPage />} />


                <Route path="/validar-documento/:codigo" element={<ValidarDocumentoPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/validar-certificado/:codigo" element={<ValidarCertificadoPage />} />
            </Routes>
        </BrowserRouter>
    );
}