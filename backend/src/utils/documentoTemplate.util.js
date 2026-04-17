import fs from "fs";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import {
    converterDocxParaPdf,
    getDocumentoFilePaths,
} from "./documento.utils.js";

export async function gerarDocumentoAPartirDoTemplate(
    templatePath,
    dadosTemplate,
    codigoDocumento
) {
    if (!fs.existsSync(templatePath)) {
        throw new Error(`Template de documento não encontrado: ${templatePath}`);
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

    doc.render(dadosTemplate);

    const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
    });

    const { docxPath, pdfPath, docxUrl, pdfUrl } = getDocumentoFilePaths(codigoDocumento);

    fs.writeFileSync(docxPath, buffer);

    await converterDocxParaPdf(
        docxPath,
        pdfPath.replace(/\\[^\\]+$|\/[^/]+$/, "")
    );

    return {
        docxPath,
        pdfPath,
        docxUrl,
        pdfUrl,
    };
}