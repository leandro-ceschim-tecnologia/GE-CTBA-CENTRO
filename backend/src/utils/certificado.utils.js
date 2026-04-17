import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function gerarCodigoCertificado(inscricaoId) {
    const ano = new Date().getFullYear();
    return `GRAU-CWB-${ano}-${String(inscricaoId).padStart(6, "0")}`;
}

export function garantirPasta(baseDir) {
    fs.mkdirSync(baseDir, { recursive: true });
    return baseDir;
}

export function garantirPastasCertificados() {
    const rootDir = path.resolve("uploads", "certificados");
    const docxDir = path.join(rootDir, "docx");
    const pdfDir = path.join(rootDir, "pdf");

    garantirPasta(rootDir);
    garantirPasta(docxDir);
    garantirPasta(pdfDir);

    return { rootDir, docxDir, pdfDir };
}

export function formatarCpf(cpf) {
    if (!cpf) return "CPF não informado";
    const digits = String(cpf).replace(/\D/g, "");

    if (digits.length !== 11) return cpf;

    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function mascararCpf(cpf) {
    if (!cpf) return "CPF não informado";
    const digits = String(cpf).replace(/\D/g, "");

    if (digits.length !== 11) return cpf;

    return `${digits.slice(0, 3)}.***.***-**`;
}

export function formatarDataPtBr(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);

    return date.toLocaleDateString("pt-BR");
}

export function mapearTipoOfertaLabel(tipo) {
    const map = {
        CURSO_INTENSIVO: "Curso Intensivo",
        PALESTRA: "Palestra",
        WORKSHOP: "Workshop",
        TREINAMENTO: "Treinamento",
        MINICURSO: "Minicurso",
        EVENTO: "Evento",
        SEGUNDA_CHAMADA_RECUPERACAO: "2ª Chamada / Recuperação",
        OUTRO: "Oferta",
    };

    return map[tipo] || tipo;
}

export function getTemplateCertificadoPath(oferta) {
    if (oferta?.templateCertificadoPath) {
        return path.resolve(oferta.templateCertificadoPath);
    }

    return path.resolve(
        "templates",
        "certificados",
        "certificadograueducacional.docx"
    );
}

export function getCertificadoFilePaths(codigoCertificado) {
    const { docxDir, pdfDir } = garantirPastasCertificados();

    return {
        docxPath: path.join(docxDir, `${codigoCertificado}.docx`),
        pdfPath: path.join(pdfDir, `${codigoCertificado}.pdf`),
        docxUrl: `/uploads/certificados/docx/${codigoCertificado}.docx`,
        pdfUrl: `/uploads/certificados/pdf/${codigoCertificado}.pdf`,
    };
}

function getSofficeBinary() {
    if (process.env.LIBREOFFICE_PATH) {
        return process.env.LIBREOFFICE_PATH;
    }

    return process.platform === "win32"
        ? "soffice.exe"
        : "soffice";
}

export async function converterDocxParaPdf(docxPath, outputPdfDir) {
    garantirPasta(outputPdfDir);

    const soffice = getSofficeBinary();

    await execFileAsync(
        soffice,
        [
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            outputPdfDir,
            docxPath,
        ],
        { windowsHide: true }
    );

    const pdfPathGerado = path.join(
        outputPdfDir,
        `${path.basename(docxPath, ".docx")}.pdf`
    );

    if (!fs.existsSync(pdfPathGerado)) {
        throw new Error("Falha ao converter DOCX para PDF.");
    }

    return pdfPathGerado;
}