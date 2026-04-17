import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

const CARGA_HORARIA_BLOCOS = {
    1: 120,
    2: 60,
    3: 120,
    4: 120,
    5: 60,
    6: 120,
};

const TURNOS = ["Manhã", "Tarde", "Noite", "Integral"];

export default function EstagioBlocoFormPage() {
    const navigate = useNavigate();

    const [turmas, setTurmas] = useState([]);
    const [loadingTurmas, setLoadingTurmas] = useState(false);

    const [form, setForm] = useState({
        cursoId: "",
        turmaId: "",
        numeroBloco: "",
        turno: "",
        dataInicio: "",
        dataFim: "",
        observacoes: "",
    });

    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadTurmas();
    }, []);

    async function loadTurmas() {
        setLoadingTurmas(true);
        setErro("");

        try {
            const data = await apiRequest("/turmas");
            setTurmas(Array.isArray(data) ? data : []);
        } catch (error) {
            setErro(error.message || "Erro ao carregar turmas.");
        } finally {
            setLoadingTurmas(false);
        }
    }

    const turmaSelecionada = useMemo(() => {
        return turmas.find((turma) => String(turma.id) === String(form.turmaId)) || null;
    }, [turmas, form.turmaId]);

    const cargaHorariaPrevista = useMemo(() => {
        return CARGA_HORARIA_BLOCOS[Number(form.numeroBloco)] || "";
    }, [form.numeroBloco]);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => {
            const next = {
                ...prev,
                [name]: value,
            };

            if (name === "turmaId") {
                const turma = turmas.find((item) => String(item.id) === String(value));
                next.cursoId = turma?.cursoId ? String(turma.cursoId) : "";
            }

            return next;
        });

        setErro("");
        setSuccess("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        setErro("");
        setSuccess("");

        try {
            if (!form.turmaId) {
                throw new Error("Selecione a turma.");
            }

            if (!form.numeroBloco) {
                throw new Error("Selecione o número do bloco.");
            }

            if (!form.turno) {
                throw new Error("Selecione o turno.");
            }

            if (!form.dataInicio) {
                throw new Error("Informe a data de início.");
            }

            if (!form.dataFim) {
                throw new Error("Informe a data de fim.");
            }

            const payload = {
                cursoId: Number(form.cursoId),
                turmaId: Number(form.turmaId),
                numeroBloco: Number(form.numeroBloco),
                turno: form.turno,
                dataInicio: form.dataInicio,
                dataFim: form.dataFim,
                observacoes: form.observacoes?.trim() || null,
            };

            const response = await apiRequest("/estagios-enf/blocos", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            setSuccess("Bloco criado com sucesso.");

            if (response?.id) {
                navigate(`/estagios-enfermagem/blocos/${response.id}`);
                return;
            }

            navigate("/estagios-enfermagem");
        } catch (error) {
            setErro(error.message || "Erro ao criar bloco.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Layout
            title="Novo Bloco de Estágio"
            subtitle="Cadastre um novo bloco de estágio de enfermagem"
        >
            <section className="page-card">
                <div className="page-header">
                    <div>
                        <h2>Criar bloco</h2>
                        <p>Defina turma, bloco, período e turno.</p>
                    </div>
                </div>

                {erro && <div className="alert alert-error">{erro}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form className="form-grid" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="turmaId">Turma</label>
                        <select
                            id="turmaId"
                            name="turmaId"
                            value={form.turmaId}
                            onChange={handleChange}
                            disabled={loadingTurmas || saving}
                            required
                        >
                            <option value="">Selecione</option>
                            {turmas.map((turma) => (
                                <option key={turma.id} value={turma.id}>
                                    {turma.nome}
                                    {turma.curso?.nome ? ` - ${turma.curso.nome}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="numeroBloco">Número do bloco</label>
                        <select
                            id="numeroBloco"
                            name="numeroBloco"
                            value={form.numeroBloco}
                            onChange={handleChange}
                            disabled={saving}
                            required
                        >
                            <option value="">Selecione</option>
                            {[1, 2, 3, 4, 5, 6].map((numero) => (
                                <option key={numero} value={numero}>
                                    Bloco {numero}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="cargaHorariaPrevista">Carga horária prevista</label>
                        <input
                            id="cargaHorariaPrevista"
                            name="cargaHorariaPrevista"
                            type="text"
                            value={cargaHorariaPrevista ? `${cargaHorariaPrevista}h` : ""}
                            disabled
                            placeholder="Automática"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="turno">Turno</label>
                        <select
                            id="turno"
                            name="turno"
                            value={form.turno}
                            onChange={handleChange}
                            disabled={saving}
                            required
                        >
                            <option value="">Selecione</option>
                            {TURNOS.map((turno) => (
                                <option key={turno} value={turno}>
                                    {turno}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="dataInicio">Data de início</label>
                        <input
                            id="dataInicio"
                            name="dataInicio"
                            type="date"
                            value={form.dataInicio}
                            onChange={handleChange}
                            disabled={saving}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="dataFim">Data de fim</label>
                        <input
                            id="dataFim"
                            name="dataFim"
                            type="date"
                            value={form.dataFim}
                            onChange={handleChange}
                            disabled={saving}
                            required
                        />
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
                            placeholder="Informações adicionais sobre o bloco"
                        />
                    </div>

                    <div className="form-actions form-group-full">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate("/estagios-enfermagem")}
                            disabled={saving}
                        >
                            Cancelar
                        </button>

                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? "Salvando..." : "Salvar bloco"}
                        </button>
                    </div>
                </form>

                {turmaSelecionada && (
                    <div className="info-card">
                        <strong>Resumo da turma selecionada:</strong>
                        <div>Turma: {turmaSelecionada.nome}</div>
                        <div>Curso: {turmaSelecionada.curso?.nome || "-"}</div>
                        <div>Turno cadastrado da turma: {turmaSelecionada.turno || "-"}</div>
                    </div>
                )}
            </section>
        </Layout>
    );
}