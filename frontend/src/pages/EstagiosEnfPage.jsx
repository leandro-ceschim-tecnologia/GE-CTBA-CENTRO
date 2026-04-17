import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function EstagiosEnfPage() {
    const [blocos, setBlocos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");
    const navigate = useNavigate();

    async function loadBlocos() {
        setLoading(true);
        setErro("");

        try {
            const data = await apiRequest("/estagios-enf/blocos");
            setBlocos(Array.isArray(data) ? data : []);
        } catch (error) {
            setErro(error.message || "Erro ao carregar blocos.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBlocos();
    }, []);

    function formatDate(value) {
        if (!value) return "-";
        return new Date(value).toLocaleDateString("pt-BR");
    }

    return (
        <Layout
            title="Estágios de Enfermagem"
            subtitle="Gerencie os blocos de estágio da unidade"
        >
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Blocos cadastrados</h2>
                        <p>Acompanhe os blocos de estágio de enfermagem.</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => navigate("/estagios-enfermagem/novo")}
                    >
                        Novo bloco
                    </button>
                </div>

                {loading && <p>Carregando...</p>}
                {erro && <p>{erro}</p>}

                {!loading && !erro && (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Campo</th>
                                    <th>Turma</th>
                                    <th>Período</th>
                                    <th>Turno</th>
                                    <th>Vagas</th>
                                    <th>Alunos</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blocos.length === 0 ? (
                                    <tr>
                                        <td colSpan="7">Nenhum bloco encontrado.</td>
                                    </tr>
                                ) : (
                                    blocos.map((b) => (
                                        <tr key={b.id}>
                                            <td>
                                                {b.campos?.length
                                                    ? b.campos.map((item) => item.campo?.nome).filter(Boolean).join(", ")
                                                    : "-"}
                                            </td>
                                            <td>{b.turma?.nome || "-"}</td>
                                            <td>
                                                {formatDate(b.dataInicio)} - {formatDate(b.dataFim)}
                                            </td>
                                            <td>{b.turno || "-"}</td>
                                            <td>{b.vagas ?? 0}</td>
                                            <td>{b.alunos?.length ?? 0}</td>
                                            <td>{b.status || "-"}</td>
                                            <td><button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => navigate(`/estagios-enfermagem/blocos/${b.id}`)}
                                            >
                                                Abrir
                                            </button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </Layout>
    );
}