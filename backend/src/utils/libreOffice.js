import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Caminho do soffice.exe.
 * Lê do .env e, se não houver, tenta o padrão do Windows.
 */
function getSofficePath() {
    return (
        process.env.SOFFICE_PATH ||
        "soffice"
    );
}

/**
 * Verifica se o executável existe.
 */
export async function assertSofficeAvailable() {
    const sofficePath = getSofficePath();
    await fs.access(sofficePath);
    return sofficePath;
}

/**
 * Converte um arquivo DOCX em PDF usando o LibreOffice headless.
 *
 * IMPORTANTE:
 * - o LibreOffice grava o PDF na pasta de saída
 * - o nome do PDF será o mesmo do arquivo DOCX, trocando apenas a extensão
 */
export async function convertDocxToPdf({
    inputAbsolutePath,
    outputDirAbsolutePath,
}) {
    const sofficePath = await assertSofficeAvailable();

    await fs.mkdir(outputDirAbsolutePath, { recursive: true });

    const args = [
        "--headless",
        "--convert-to",
        "pdf",
        inputAbsolutePath,
        "--outdir",
        outputDirAbsolutePath,
    ];

    await execFileAsync(sofficePath, args, {
        windowsHide: true,
    });

    const inputFileName = path.basename(inputAbsolutePath, path.extname(inputAbsolutePath));
    const outputPdfAbsolutePath = path.join(
        outputDirAbsolutePath,
        `${inputFileName}.pdf`
    );

    // valida se o PDF realmente foi criado
    await fs.access(outputPdfAbsolutePath);

    return outputPdfAbsolutePath;
}