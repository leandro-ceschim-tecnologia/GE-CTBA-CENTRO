import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

export async function ensureDirectoryExists(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

export async function renderDocxTemplateToFile({
    templateAbsolutePath,
    outputAbsolutePath,
    data,
}) {
    const content = await fs.readFile(templateAbsolutePath, "binary");
    const zip = new PizZip(content);


    let doc;

    try {
        doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,

            delimiters: {
                start: "<<",
                end: ">>",
            },
        });
    } catch (error) {
        console.error("Erro ao inicializar Docxtemplater:", error);
        throw new Error(
            `Falha ao abrir o template DOCX. Detalhes: ${error.message || "erro desconhecido"}`
        );
    }

    try {
        doc.render(data || {});
    } catch (error) {
        console.error("Erro ao renderizar template DOCX:", error);

        if (error?.properties?.errors?.length) {
            const details = error.properties.errors
                .map(
                    (item) =>
                        item.properties?.explanation ||
                        item.properties?.id ||
                        item.name
                )
                .join(" | ");

            throw new Error(`Erro ao substituir placeholders no DOCX: ${details}`);
        }

        throw new Error(
            `Erro ao renderizar template DOCX: ${error.message || "erro desconhecido"}`
        );
    }

    const buffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
    });

    await ensureDirectoryExists(path.dirname(outputAbsolutePath));
    await fs.writeFile(outputAbsolutePath, buffer);

    return outputAbsolutePath;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}