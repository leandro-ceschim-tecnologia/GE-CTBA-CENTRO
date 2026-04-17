import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../services/api";

function formatDate(value) {
    if (!value) return "-";
    return value;
}

export default function ValidarDocumentoPage() {
    const { codigo } = useParams();

    const [loading, setLoading] = useState(true);
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadValidacao() {
            try {
                setLoading(true);
                setError("");

                const response = await apiRequest(`/documentos/publico/${codigo}`);
                setResultado(response);
            } catch (err) {
                setError(err.message || "Erro ao validar documento.");
            } finally {
                setLoading(false);
            }
        }

        loadValidacao();
    }, [codigo]);

    return (
        <Layout
            title="Validação de Documento"
            subtitle="Consulte a autenticidade do documento pelo código"
        >
            <div className="page-card">
                {loading ? (
                    <div className="empty-state">Validando documento...</div>
                ) : error ? (
                    <div className="alert alert-error">{error}</div>
                ) : !resultado?.valido ? (
                    <div className="alert alert-error">
                        {resultado?.mensagem || "Documento não encontrado."}
                    </div>
                ) : (
                    <div className="certificado-validacao">
                        <div className="alert alert-success">
                            Documento válido.
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
                                        <td>
                                            Avenida Sete de Setembro, 3293 - Rebouças - Curitiba - PR
                                            - CEP: 80.230-085
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>Código</th>
                                        <td>{resultado.codigoDocumento}</td>
                                    </tr>
                                    <tr>
                                        <th>Tipo</th>
                                        <td>{resultado.tipo}</td>
                                    </tr>
                                    <tr>
                                        <th>Título</th>
                                        <td>{resultado.titulo}</td>
                                    </tr>
                                    <tr>
                                        <th>Solicitante</th>
                                        <td>{resultado.nomeSolicitante}</td>
                                    </tr>
                                    <tr>
                                        <th>CPF</th>
                                        <td>{resultado.cpfMascarado}</td>
                                    </tr>
                                    <tr>
                                        <th>Assunto</th>
                                        <td>{resultado.assunto || "-"}</td>
                                    </tr>
                                    <tr>
                                        <th>Data de emissão</th>
                                        <td>{formatDate(resultado.emitidoEm)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {resultado.documentoUrl ? (
                            <div className="form-actions">
                                <a
                                    className="btn btn-primary"
                                    href={`http://localhost:3000${resultado.documentoUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Abrir documento
                                </a>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </Layout>
    );
}