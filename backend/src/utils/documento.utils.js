import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export function gerarCodigoDocumento(tipo, documentoId) {
    const ano = new Date().getFullYear();

    const prefixos = {
        DECLARACAO: "DEC",
        OFICIO: "OFI",
        REQUERIMENTO: "REQ",
    };

    const prefixo = prefixos[tipo] || "DOC";

    return `GRAU-CWB-${prefixo}-${ano}-${String(documentoId).padStart(6, "0")}`;
}

export function garantirPasta(baseDir) {
    fs.mkdirSync(baseDir, { recursive: true });
    return baseDir;
}

export function garantirPastasDocumentos() {
    const rootDir = path.resolve("uploads", "documentos");
    const docxDir = path.join(rootDir, "docx");
    const pdfDir = path.join(rootDir, "pdf");

    garantirPasta(rootDir);
    garantirPasta(docxDir);
    garantirPasta(pdfDir);

    return { rootDir, docxDir, pdfDir };
}

export function normalizarTexto(value) {
    if (value === undefined || value === null) return null;
    const texto = String(value).trim();
    return texto || null;
}

export function normalizarCpf(cpf) {
    if (!cpf) return null;
    const digits = String(cpf).replace(/\D/g, "");
    return digits || null;
}

export function normalizarTelefone(fone) {
    if (!fone) return null;
    const digits = String(fone).replace(/\D/g, "");
    return digits || null;
}

export function formatarCpf(cpf) {
    if (!cpf) return "";
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

export function formatarTelefone(fone) {
    if (!fone) return "";
    const digits = String(fone).replace(/\D/g, "");

    if (digits.length === 11) {
        return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }

    if (digits.length === 10) {
        return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return fone;
}

export function formatarDataPtBr(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    return date.toLocaleDateString("pt-BR");
}

export function formatarDataExtenso(dateValue) {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    const dia = String(date.getDate()).padStart(2, "0");

    const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
    ];

    const mes = meses[date.getMonth()];
    const ano = date.getFullYear();

    return `${dia} de ${mes} de ${ano}`;
}

export function getTipoDocumentoLabel(tipo) {
    const map = {
        DECLARACAO: "Declaração",
        OFICIO: "Ofício",
        REQUERIMENTO: "Requerimento",
    };

    return map[tipo] || tipo;
}

export function getTemplateDocumentoPath(tipo) {
    const map = {
        DECLARACAO: path.resolve("templates", "declaracoes", "declaracaopadrao.docx"),
        OFICIO: path.resolve("templates", "oficios", "oficiopadrao.docx"),
        REQUERIMENTO: path.resolve("templates", "requerimentos", "requerimentopadrao.docx"),
    };

    return map[tipo];
}

export function getDocumentoFilePaths(codigoDocumento) {
    const { docxDir, pdfDir } = garantirPastasDocumentos();

    return {
        docxPath: path.join(docxDir, `${codigoDocumento}.docx`),
        pdfPath: path.join(pdfDir, `${codigoDocumento}.pdf`),
        docxUrl: `/uploads/documentos/docx/${codigoDocumento}.docx`,
        pdfUrl: `/uploads/documentos/pdf/${codigoDocumento}.pdf`,
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