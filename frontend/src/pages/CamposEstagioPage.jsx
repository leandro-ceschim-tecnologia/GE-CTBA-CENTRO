import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

export default function CamposEstagioPage() {
    const [campos, setCampos] = useState([]);
    const [supervisores, setSupervisores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        nome: "",
        tipo: "",
        endereco: "",
        cidade: "",
        supervisorId: "",
        convenioAtivo: true,
        observacoes: "",
        ativo: true,
    });

    useEffect(() => {
        loadPage();
    }, []);

    async function loadPage() {
        setLoading(true);
        setErro("");

        try {
            const [camposData, supervisoresData] = await Promise.all([
                apiRequest("/estagios-enf/campos"),
                apiRequest("/estagios-enf/supervisores"),
            ]);

            setCampos(Array.isArray(camposData) ? camposData : []);
            setSupervisores(Array.isArray(supervisoresData) ? supervisoresData : []);
        } catch (error) {
            setErro(error.message || "Erro ao carregar dados da página.");
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        setErro("");
        setSuccess("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setErro("");
        setSuccess("");

        try {
            if (!form.nome.trim()) {
                throw new Error("Informe o nome do campo de estágio.");
            }

            await apiRequest("/estagios-enf/campos", {
                method: "POST",
                body: {
                    nome: form.nome.trim(),
                    tipo: form.tipo.trim() || null,
                    endereco: form.endereco.trim() || null,
                    cidade: form.cidade.trim() || null,
                    supervisorId: form.supervisorId ? Number(form.supervisorId) : null,
                    convenioAtivo: form.convenioAtivo,
                    observacoes: form.observacoes.trim() || null,
                    ativo: form.ativo,
                },
            });

            setSuccess("Campo de estágio cadastrado com sucesso.");
            setForm({
                nome: "",
                tipo: "",
                endereco: "",
                cidade: "",
                supervisorId: "",
                convenioAtivo: true,
                observacoes: "",
                ativo: true,
            });

            await loadPage();
        } catch (error) {
            setErro(error.message || "Erro ao cadastrar campo de estágio.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Layout
            title="Campos de Estágio"
            subtitle="Cadastre e gerencie os campos utilizados nos blocos"
        >
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Cadastro de campos</h2>
                        <p>Monte a base de campos que poderá ser vinculada aos blocos.</p>
                    </div>
                </div>

                {erro && <div className="alert alert-error">{erro}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form className="form-grid" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="nome">Nome</label>
                        <input
                            id="nome"
                            name="nome"
                            type="text"
                            value={form.nome}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Ex.: Irmandade Santa Casa"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="tipo">Tipo</label>
                        <input
                            id="tipo"
                            name="tipo"
                            type="text"
                            value={form.tipo}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Ex.: Hospital, UBS, Clínica"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="cidade">Cidade</label>
                        <input
                            id="cidade"
                            name="cidade"
                            type="text"
                            value={form.cidade}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Ex.: Curitiba"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="endereco">Endereço</label>
                        <input
                            id="endereco"
                            name="endereco"
                            type="text"
                            value={form.endereco}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Endereço completo do campo"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="supervisorId">Supervisor</label>
                        <select
                            id="supervisorId"
                            name="supervisorId"
                            value={form.supervisorId}
                            onChange={handleChange}
                            disabled={saving}
                        >
                            <option value="">Selecione</option>
                            {supervisores.map((supervisor) => (
                                <option key={supervisor.id} value={supervisor.id}>
                                    {supervisor.nome} ({supervisor.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group form-group-full">
                        <label htmlFor="observacoes">Observações</label>
                        <textarea
                            id="observacoes"
                            name="observacoes"
                            rows="4"
                            value={form.observacoes}
                            onChange={handleChange}
                            disabled={saving}
                            placeholder="Informações adicionais sobre o campo"
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                name="convenioAtivo"
                                checked={form.convenioAtivo}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            Convênio ativo
                        </label>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                name="ativo"
                                checked={form.ativo}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            Campo ativo
                        </label>
                    </div>

                    <div className="form-actions form-group-full">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar campo"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Campos cadastrados</h2>
                        <p>Esses campos poderão ser utilizados na configuração dos blocos.</p>
                    </div>
                </div>

                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Tipo</th>
                                    <th>Cidade</th>
                                    <th>Supervisor</th>
                                    <th>Telefone</th>
                                    <th>Convênio</th>
                                    <th>Status</th>
                                    <th>Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campos.length ? (
                                    campos.map((campo) => (
                                        <tr key={campo.id}>
                                            <td>{campo.nome || "-"}</td>
                                            <td>{campo.tipo || "-"}</td>
                                            <td>{campo.cidade || "-"}</td>
                                            <td>{campo.supervisor?.nome || "-"}</td>
                                            <td>
                                                {campo.supervisor?.fone1 ||
                                                    campo.supervisor?.fone2 ||
                                                    "-"}
                                            </td>
                                            <td>{campo.convenioAtivo ? "Ativo" : "Inativo"}</td>
                                            <td>{campo.ativo ? "Ativo" : "Inativo"}</td>
                                            <td>{campo.observacoes || "-"}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8">Nenhum campo de estágio cadastrado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </Layout>
    );
}