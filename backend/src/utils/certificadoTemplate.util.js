import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import {
    converterDocxParaPdf,
    getCertificadoFilePaths,
    getTemplateCertificadoPath,
} from "./certificado.utils.js";

export async function gerarCertificadoAPartirDoTemplate(inscricao, dadosTemplate, codigoCertificado) {
    const templatePath = getTemplateCertificadoPath(inscricao.oferta);

    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template de certificado não encontrado: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
        delimiters: {
            start: "<<",
            end: ">>",
        },
        paragraphLoop: true,
        linebreaks: true,
    });

    doc.render({
        ALUNO: dadosTemplate.ALUNO,
        CPF: dadosTemplate.CPF,
        CURSANDO: dadosTemplate.CURSANDO,
        TIPO: dadosTemplate.TIPO,
        TEMA: dadosTemplate.TEMA,
        "DATA-EXECUÇÃO": dadosTemplate["DATA-EXECUÇÃO"],
        CH: dadosTemplate.CH,
        "DATA-CERTIFICAÇÃO": dadosTemplate["DATA-CERTIFICAÇÃO"],
        CODIGO: dadosTemplate.CODIGO,
        URL_VALIDACAO: dadosTemplate.URL_VALIDACAO,
    });

    const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
    });

    const { docxPath, pdfPath, pdfUrl } = getCertificadoFilePaths(codigoCertificado);

    fs.writeFileSync(docxPath, buffer);

    await converterDocxParaPdf(docxPath, pdfPath.replace(/\\[^\\]+$|\/[^/]+$/, ""));

    return {
        certificadoUrl: pdfUrl,
        docxPath,
        pdfPath,
    };
}