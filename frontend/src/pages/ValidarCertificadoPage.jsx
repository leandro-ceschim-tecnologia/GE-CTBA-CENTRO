import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

function formatDate(dateValue) {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("pt-BR");
}

export default function ValidarCertificadoPage() {
    const { codigo } = useParams();

    const [loading, setLoading] = useState(true);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadValidacao() {
            try {
                setLoading(true);
                setError("");

                const response = await apiRequest(`/certificados/publico/${codigo}`);
                setResultado(response);
            } catch (err) {
                setError(err.message || "Erro ao validar certificado.");
            } finally {
                setLoading(false);
            }
        }

        loadValidacao();
    }, [codigo]);

    return (
        <Layout
            title="Validação de Certificado"
            subtitle="Consulte a autenticidade do certificado pelo código"
        >
            <div className="page-card">
                {loading ? (
                    <div className="empty-state">Validando certificado...</div>
                ) : error ? (
                    <div className="alert alert-error">{error}</div>
                ) : !resultado?.valido ? (
                    <div className="alert alert-error">
                        {resultado?.mensagem || "Certificado não encontrado."}
                    </div>
                ) : (
                    <div className="certificado-validacao">
                        <div className="alert alert-success">
                            Certificado válido.
                        </div>

                        <div className="table-wrapper">
                            <table className="table">
                                <tbody>
                                    <tr>
                                        <th>Razão Social</th>
                                        <td>Centro de Ensino Grau Educacional</td>
                                    </tr>
                                    <tr>
                                        <th>Unidade</th>
                                        <td>Curitiba-Centro</td>
                                    </tr>
                                    <tr>
                                        <th>Endereço</th>
                                        <td>Avenida Sete de Setembro, 3293 - Rebouças - Curitiba - PR - CEP: 80.230-085</td>
                                    </tr>
                                    <tr>
                                        <th>Código</th>
                                        <td>{resultado.codigoCertificado}</td>
                                    </tr>
                                    <tr>
                                        <th>Aluno</th>
                                        <td>{resultado.aluno}</td>
                                    </tr>
                                    <tr>
                                        <th>CPF</th>
                                        <td>{resultado.cpfMascarado}</td>
                                    </tr>
                                    <tr>
                                        <th>Curso</th>
                                        <td>{resultado.cursando}</td>
                                    </tr>
                                    <tr>
                                        <th>Tipo</th>
                                        <td>{resultado.tipo}</td>
                                    </tr>
                                    <tr>
                                        <th>Tema</th>
                                        <td>{resultado.tema}</td>
                                    </tr>
                                    <tr>
                                        <th>Data de execução</th>
                                        <td>{formatDate(resultado.dataExecucao)}</td>
                                    </tr>
                                    <tr>
                                        <th>Data da certificação</th>
                                        <td>{formatDate(resultado.dataCertificacao)}</td>
                                    </tr>
                                    <tr>
                                        <th>Carga horária</th>
                                        <td>
                                            {resultado.cargaHoraria
                                                ? `${resultado.cargaHoraria} horas`
                                                : "-"}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {resultado.certificadoUrl ? (
                            <div className="form-actions">
                                <a
                                    className="btn btn-primary"
                                    href={`http://localhost:3000${resultado.certificadoUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Abrir certificado
                                </a>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </Layout>
    );
}