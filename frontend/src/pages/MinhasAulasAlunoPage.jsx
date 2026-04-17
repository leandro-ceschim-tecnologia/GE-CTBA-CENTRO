import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

function getReservaLabel(aula) {
    const reservasAtivas = (aula.reservas || []).filter(
        (reserva) => reserva.status === "ativa"
    );

    if (!reservasAtivas.length) return "OK";

    const lab = reservasAtivas.find((r) => r.tipo === "laboratorio");
    if (lab) return `Laboratório: ${lab.recursoNome}`;

    const vpo = reservasAtivas.find((r) => r.tipo === "vpo");
    if (vpo) return `VPO: ${vpo.recursoNome}`;

    return "OK";
}

function getRowClass(aula) {
    if (aula.status === "cancelada") return "row-cancelada";
    if (aula.status === "realizada") return "row-realizada";
    if (aula.status === "ajustada") return "row-ajustada";
    if (aula.tipoAula === "Avaliação Final") return "row-avaliacao-final";

    const reservas = aula.reservas || [];
    if (reservas.some((r) => r.tipo === "laboratorio" && r.status === "ativa")) {
        return "row-com-laboratorio";
    }
    if (reservas.some((r) => r.tipo === "vpo" && r.status === "ativa")) {
        return "row-com-vpo";
    }

    return "";
}

export default function MinhasAulasAlunoPage() {
    const [aulas, setAulas] = useState([]);
    const [somenteFuturas, setSomenteFuturas] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadAulas() {
        try {
            setLoading(true);
            setError("");

            const data = await apiRequest(
                `/minhas-aulas/aluno?somenteFuturas=${somenteFuturas}`
            );

            setAulas(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAulas();
    }, [somenteFuturas]);

    return (
        <Layout
            title="Minhas Aulas"
            subtitle="Agenda do aluno com aulas, laboratórios e VPO"
        >
            {/* <div className="page-header">
                <h2>Minhas Aulas</h2>
                <p>Visualização das aulas da turma do aluno.</p>
            </div> */}

            <div className="card">
                <label className="checkbox-item">
                    <input
                        type="checkbox"
                        checked={somenteFuturas}
                        onChange={(e) => setSomenteFuturas(e.target.checked)}
                    />
                    <span>Mostrar somente aulas futuras</span>
                </label>
            </div>

            <div className="card">
                <h3>Aulas da turma</h3>

                {error ? <p className="form-error">{error}</p> : null}

                {loading ? (
                    <p>Carregando aulas...</p>
                ) : aulas.length ? (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Turma</th>
                                    <th>Curso</th>
                                    <th>Disciplina</th>
                                    <th>Instrutor</th>
                                    <th>Tipo</th>
                                    <th>Status</th>
                                    <th>Reserva</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aulas.map((aula) => {
                                    const reservasAtivas = (aula.reservas || []).filter(
                                        (reserva) => reserva.status === "ativa"
                                    );

                                    const reservaPrincipal =
                                        reservasAtivas.find((r) => r.tipo === "laboratorio") ||
                                        reservasAtivas.find((r) => r.tipo === "vpo") ||
                                        null;

                                    return (
                                        <tr key={aula.id} className={getRowClass(aula)}>
                                            <td>{new Date(aula.data).toLocaleDateString("pt-BR")}</td>
                                            <td>{aula.turma?.nome || "-"}</td>
                                            <td>{aula.turma?.curso?.nome || "-"}</td>
                                            <td>{aula.turmaDisciplina?.disciplina?.nome || "-"}</td>
                                            <td>{aula.instrutorEfetivo?.nome || "Sem instrutor"}</td>
                                            <td>{aula.tipoAula}</td>
                                            <td>{aula.status}</td>
                                            <td>{getReservaLabel(aula)}</td>
                                            <td>{reservaPrincipal?.observacoes || "-"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p>Nenhuma aula encontrada.</p>
                )}
            </div>
        </Layout>
    );
}