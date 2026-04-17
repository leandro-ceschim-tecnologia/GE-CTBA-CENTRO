import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

function normalizeVinculos(data) {
    return data.map((item) => ({
        ...item,
        moduloEdit: String(item.modulo ?? "1"),
        quantidadeEncontrosEdit: String(item.quantidadeEncontros ?? ""),
        instrutorPadraoIdEdit: String(item.instrutorPadraoId ?? ""),
    }));
}

export default function TurmaDisciplinasPage() {
    const { user } = useAuth();

    const [turmas, setTurmas] = useState([]);
    const [vinculos, setVinculos] = useState([]);
    const [instrutores, setInstrutores] = useState([]);
    const [turmaId, setTurmaId] = useState("");
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const canManage = ["admin", "pedagogico"].includes(user?.role);

    async function loadBaseData() {
        try {
            setLoading(true);
            setError("");

            const [turmasData, instrutoresData] = await Promise.all([
                apiRequest("/turmas"),
                apiRequest("/instrutores"),
            ]);

            setTurmas(turmasData);
            setInstrutores(instrutoresData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function loadVinculos(selectedTurmaId) {
        if (!selectedTurmaId) {
            setVinculos([]);
            return;
        }

        try {
            setError("");
            const data = await apiRequest(`/turma-disciplinas?turmaId=${selectedTurmaId}`);
            setVinculos(normalizeVinculos(data));
        } catch (err) {
            setError(err.message);
        }
    }

    useEffect(() => {
        loadBaseData();
    }, []);

    useEffect(() => {
        loadVinculos(turmaId);
    }, [turmaId]);

    const turmaSelecionada = useMemo(() => {
        return turmas.find((item) => item.id === Number(turmaId));
    }, [turmaId, turmas]);

    function updateLocalRow(id, changes) {
        setVinculos((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...changes } : item))
        );
    }

    async function handleSync() {
        if (!turmaId) {
            setError("Selecione uma turma para sincronizar.");
            return;
        }

        try {
            setSyncing(true);
            setError("");
            setSuccess("");

            const result = await apiRequest("/turma-disciplinas/sync", {
                method: "POST",
                body: JSON.stringify({
                    turmaId: Number(turmaId),
                }),
            });

            setSuccess(
                result.totalCriado > 0
                    ? `${result.totalCriado} disciplina(s) vinculada(s) automaticamente à turma.`
                    : "Nenhuma nova disciplina precisava ser vinculada."
            );

            setVinculos(normalizeVinculos(result.vinculos));
        } catch (err) {
            setError(err.message);
        } finally {
            setSyncing(false);
        }
    }

    async function handleMover(vinculoId, direcao) {
        try {
            setSavingId(vinculoId);
            setError("");
            setSuccess("");

            const result = await apiRequest(`/turma-disciplinas/${vinculoId}/mover`, {
                method: "PATCH",
                body: JSON.stringify({ direcao }),
            });

            setSuccess(result.message || "Ordem atualizada com sucesso.");
            setVinculos(normalizeVinculos(result.vinculos));
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    }

    async function handleSaveRow(item) {
        try {
            setSavingId(item.id);
            setError("");
            setSuccess("");

            await apiRequest(`/turma-disciplinas/${item.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    modulo: Number(item.moduloEdit),
                    quantidadeEncontros: Number(item.quantidadeEncontrosEdit),
                }),
            });

            setSuccess(`Disciplina "${item.disciplina?.nome}" atualizada com sucesso.`);
            await loadVinculos(turmaId);
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    }

    async function handleSetInstrutorPadrao(vinculoId, instrutorId) {
        try {
            setError("");
            setSuccess("");

            await apiRequest(`/turma-disciplinas/${vinculoId}/instrutor-padrao`, {
                method: "PATCH",
                body: JSON.stringify({
                    instrutorId: instrutorId ? Number(instrutorId) : null,
                }),
            });

            setSuccess("Instrutor padrão atualizado com sucesso.");
            await loadVinculos(turmaId);
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleReplicarInstrutor(vinculo) {
        const confirmar = window.confirm(
            `Deseja replicar o instrutor padrão para as aulas da disciplina "${vinculo.disciplina?.nome}" na turma "${vinculo.turma?.nome}"?`
        );

        if (!confirmar) return;

        try {
            setError("");
            setSuccess("");

            const result = await apiRequest(
                `/turma-disciplinas/${vinculo.id}/replicar-instrutor`,
                {
                    method: "PATCH",
                }
            );

            setSuccess(
                `${result.totalAtualizado} aula(s) atualizada(s) com o instrutor padrão.`
            );
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleExcluir(item) {
        const confirmar = window.confirm(
            `Deseja realmente excluir a disciplina "${item.disciplina?.nome}" da turma "${item.turma?.nome}"?`
        );

        if (!confirmar) return;

        try {
            setDeletingId(item.id);
            setError("");
            setSuccess("");

            const result = await apiRequest(`/turma-disciplinas/${item.id}`, {
                method: "DELETE",
            });

            setSuccess(result.message || "Disciplina removida da turma com sucesso.");
            setVinculos(normalizeVinculos(result.vinculos));
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <Layout
            title="Turma x Disciplinas"
            subtitle="Organize as disciplinas da turma, mova a ordem e exclua o que não se aplica"
        >
            <div className="card">
                <h3>Selecionar turma</h3>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Turma</label>
                        <select
                            value={turmaId}
                            onChange={(e) => {
                                setTurmaId(e.target.value);
                                setError("");
                                setSuccess("");
                            }}
                        >
                            <option value="">Selecione uma turma</option>
                            {turmas.map((turma) => (
                                <option key={turma.id} value={turma.id}>
                                    {turma.nome} - {turma.curso?.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {turmaSelecionada ? (
                    <div className="page-info-box">
                        <p>
                            <strong>Curso:</strong> {turmaSelecionada.curso?.nome || "-"}
                        </p>
                        <p>
                            <strong>Turno:</strong> {turmaSelecionada.turno || "-"}
                        </p>
                        <p>
                            <strong>Fluxo:</strong> sincronize as disciplinas do curso, ajuste a
                            ordem da turma com subir/descer e exclua as disciplinas que não se
                            aplicam a esta turma.
                        </p>
                    </div>
                ) : null}

                {canManage ? (
                    <div className="table-actions" style={{ marginTop: "12px" }}>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleSync}
                            disabled={!turmaId || syncing}
                        >
                            {syncing ? "Sincronizando..." : "Sincronizar disciplinas da turma"}
                        </button>
                    </div>
                ) : null}

                {error ? <p className="form-error">{error}</p> : null}
                {success ? <p className="form-success">{success}</p> : null}
            </div>

            <div className="card">
                <h3>Vínculos da turma</h3>

                {loading ? (
                    <p>Carregando dados...</p>
                ) : !turmaId ? (
                    <p>Selecione uma turma para visualizar os vínculos.</p>
                ) : !vinculos.length ? (
                    <p>
                        Nenhum vínculo encontrado para esta turma. Gere o cronograma ou clique em
                        “Sincronizar disciplinas da turma”.
                    </p>
                ) : (
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Disciplina</th>
                                    <th>Ordem</th>
                                    <th>Módulo</th>
                                    <th>Encontros</th>
                                    <th>Instrutor padrão</th>
                                    {canManage ? <th>Ações</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {vinculos.map((item, index) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.disciplina?.nome || "-"}</td>

                                        <td>
                                            {canManage ? (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                    }}
                                                >
                                                    <span>{item.ordem}</span>

                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() => handleMover(item.id, "cima")}
                                                        disabled={savingId === item.id || index === 0}
                                                    >
                                                        ↑
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() => handleMover(item.id, "baixo")}
                                                        disabled={
                                                            savingId === item.id ||
                                                            index === vinculos.length - 1
                                                        }
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            ) : (
                                                item.ordem
                                            )}
                                        </td>

                                        <td>
                                            {canManage ? (
                                                <select
                                                    value={item.moduloEdit}
                                                    onChange={(e) =>
                                                        updateLocalRow(item.id, {
                                                            moduloEdit: e.target.value,
                                                        })
                                                    }
                                                >
                                                    <option value="1">Módulo 1</option>
                                                    <option value="2">Módulo 2</option>
                                                    <option value="3">Módulo 3</option>
                                                    <option value="4">Módulo 4</option>
                                                </select>
                                            ) : (
                                                item.modulo
                                            )}
                                        </td>

                                        <td>
                                            {canManage ? (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantidadeEncontrosEdit}
                                                    onChange={(e) =>
                                                        updateLocalRow(item.id, {
                                                            quantidadeEncontrosEdit: e.target.value,
                                                        })
                                                    }
                                                />
                                            ) : (
                                                item.quantidadeEncontros
                                            )}
                                        </td>

                                        <td>
                                            {canManage ? (
                                                <select
                                                    value={item.instrutorPadraoIdEdit}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        updateLocalRow(item.id, {
                                                            instrutorPadraoIdEdit: value,
                                                        });
                                                        handleSetInstrutorPadrao(item.id, value);
                                                    }}
                                                >
                                                    <option value="">Sem instrutor padrão</option>
                                                    {instrutores.map((instrutor) => (
                                                        <option
                                                            key={instrutor.id}
                                                            value={instrutor.id}
                                                        >
                                                            {instrutor.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                item.instrutorPadrao?.nome ||
                                                "Sem instrutor padrão"
                                            )}
                                        </td>

                                        {canManage ? (
                                            <td>
                                                <div
                                                    className="table-actions"
                                                    style={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: "8px",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() => handleSaveRow(item)}
                                                        disabled={savingId === item.id}
                                                    >
                                                        {savingId === item.id ? "Salvando..." : "Salvar"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() => handleReplicarInstrutor(item)}
                                                    >
                                                        Replicar instrutor
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-edit"
                                                        onClick={() => handleExcluir(item)}
                                                        disabled={deletingId === item.id}
                                                    >
                                                        {deletingId === item.id
                                                            ? "Excluindo..."
                                                            : "Excluir da turma"}
                                                    </button>
                                                </div>
                                            </td>
                                        ) : null}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}