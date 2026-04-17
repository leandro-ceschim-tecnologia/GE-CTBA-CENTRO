import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
    getDocumentTemplateByKey,
    getDocumentTemplateAbsolutePath,
} from "../config/documentoTemplates.config.js";
import {
    buildDefaultPlaceholders,
    buildAtaIndividualPlaceholders,
} from "../utils/documentoPlaceholders.js";
import { renderDocxTemplateToFile } from "../utils/docxReplace.js";
import { convertDocxToPdf } from "../utils/libreOffice.js";

/**
 * Diretório onde os arquivos gerados serão armazenados.
 *
 * Nesta etapa vamos gerar o .docx final aqui.
 * No próximo passo, poderemos converter para PDF e também salvar o caminho no banco.
 */
const GENERATED_DOCS_BASE_DIR = path.resolve(process.cwd(), "storage", "documentos");

const GENERATED_PDF_BASE_DIR = GENERATED_DOCS_BASE_DIR;

/**
 * Converte caminho absoluto salvo em /storage/documentos/... para URL relativa pública.
 */
function absolutePathToStorageUrl(absolutePath) {
    const normalized = absolutePath.replace(/\\/g, "/");
    const storageIndex = normalized.lastIndexOf("/storage/");

    if (storageIndex === -1) {
        throw new Error("Não foi possível mapear o arquivo gerado para URL pública.");
    }

    return normalized.slice(storageIndex);
}

/**
 * Base pública do backend para montar URL de validação.
 *
 * Ajuste no .env se quiser:
 * BACKEND_PUBLIC_BASE_URL=http://localhost:3000
 */
function getBackendPublicBaseUrl() {
    return process.env.BACKEND_PUBLIC_BASE_URL || "http://localhost:3000";
}

/**
 * Prefixo da rota pública de validação.
 *
 * Quando sua rota pública estiver pronta, ela deve seguir esse padrão
 * ou você pode ajustar aqui depois.
 */
function getValidationBaseUrl() {
    return `${getBackendPublicBaseUrl()}/documentos/publico/validar`;
}

/**
 * Gera nome único de arquivo.
 */
function generateOutputFilename({
    codigoDocumento,
    templateKey,
    extension = ".docx",
}) {
    const safeCode = String(codigoDocumento || "SEM_CODIGO").replace(/[^\w-]/g, "_");
    const safeTemplateKey = String(templateKey || "template").replace(/[^\w-]/g, "_");
    const random = crypto.randomBytes(4).toString("hex");

    return `${safeCode}__${safeTemplateKey}__${random}${extension}`;
}

/**
 * Converte mapa de placeholders de <<CAMPO>> para o formato
 * que o docxtemplater espera, que é {{CAMPO}} no documento
 * e { CAMPO: valor } no render.
 *
 * Como seus documentos estão com <<CAMPO>>,
 * precisamos fazer um pré-processamento simples do template
 * ou padronizar no futuro.
 *
 * NESTA ETAPA:
 * - vamos usar os nomes das chaves normalmente
 * - e deixar a adaptação do conteúdo dos arquivos para o passo seguinte
 *
 * IMPORTANTE:
 * Se os templates já estiverem em <<CAMPO>>, o ideal técnico é migrar
 * esses placeholders para {{CAMPO}} gradualmente.
 * Enquanto isso, este service já centraliza todo o resto.
 */
function normalizePlaceholderData(placeholders = {}) {
    const result = {};

    for (const [key, value] of Object.entries(placeholders)) {
        result[key] = value === undefined || value === null ? "" : String(value);
    }

    return result;
}

/**
 * Valida se a chave do template existe no registro central.
 */
export function assertTemplateKey(templateKey) {
    const template = getDocumentTemplateByKey(templateKey);

    if (!template) {
        throw new Error(`Template "${templateKey}" não encontrado.`);
    }

    return template;
}

/**
 * Monta placeholders padrão + extras.
 *
 * Ordem de prioridade:
 * 1. placeholders padrão
 * 2. placeholders especiais (se houver)
 * 3. variáveis extras vindas do formulário/payload
 *
 * Assim você mantém flexibilidade para ampliar depois.
 */
export function buildTemplatePlaceholderMap({
    templateKey,
    codigoDocumento,
    form = {},
    user = null,
    variaveisExtras = {},
    cidade = "Curitiba",
    specialData = {},
}) {
    const template = assertTemplateKey(templateKey);

    const basePlaceholders = buildDefaultPlaceholders({
        codigoDocumento,
        baseUrlValidacao: getValidationBaseUrl(),
        cidade,
        form,
        user,
    });

    let specialPlaceholders = {};

    if (template.specialHandler === "ataIndividual") {
        specialPlaceholders = buildAtaIndividualPlaceholders({
            form,
            datas: Array.isArray(specialData?.datas) ? specialData.datas : [],
        });
    }

    return {
        ...basePlaceholders,
        ...specialPlaceholders,
        ...(variaveisExtras || {}),
    };
}

/**
 * Retorna a lista dos placeholders exigidos pelo template.
 */
export function getExpectedPlaceholdersByTemplateKey(templateKey) {
    const template = assertTemplateKey(templateKey);
    return Array.isArray(template.placeholders) ? template.placeholders : [];
}

/**
 * Verifica quais placeholders esperados estão vazios.
 *
 * Não bloqueia por padrão.
 * Serve para log, aviso ou regra futura.
 */
export function findMissingOrEmptyPlaceholders({
    templateKey,
    placeholders = {},
}) {
    const expected = getExpectedPlaceholdersByTemplateKey(templateKey);

    return expected.filter((key) => {
        const value = placeholders[key];
        return value === undefined || value === null || String(value).trim() === "";
    });
}

/**
 * Gera metadados do arquivo de saída.
 */
export function buildGeneratedDocxPaths({
    templateKey,
    codigoDocumento,
}) {
    const outputFileName = generateOutputFilename({
        codigoDocumento,
        templateKey,
        extension: ".docx",
    });

    const absolutePath = path.join(GENERATED_DOCS_BASE_DIR, outputFileName);

    /**
     * URL relativa pensando em servir os arquivos depois.
     * No próximo passo podemos plugar isso no express static.
     */
    const relativeUrl = `/storage/documentos/${outputFileName}`;

    return {
        outputFileName,
        absolutePath,
        relativeUrl,
    };
}

/**
 * Copia o template original para um arquivo temporário e
 * renderiza com os placeholders.
 *
 * IMPORTANTE SOBRE <<CAMPO>>:
 * As libs de templating DOCX trabalham melhor com {{CAMPO}}.
 *
 * Então nesta etapa o motor central já fica pronto, mas há duas opções:
 *
 * 1. melhor opção: gradualmente converter seus templates para {{CAMPO}}
 * 2. alternativa futura: fazer uma rotina de conversão antes da renderização
 *
 * Para não inventar risco agora, este passo já deixa a estrutura pronta.
 */
export async function generateDocxFromTemplate({
    templateKey,
    codigoDocumento,
    form = {},
    user = null,
    variaveisExtras = {},
    cidade = "Curitiba",
    specialData = {},
}) {
    const template = assertTemplateKey(templateKey);
    const templateAbsolutePath = getDocumentTemplateAbsolutePath(templateKey);

    // Garante que o template físico existe
    await fs.access(templateAbsolutePath);

    const placeholders = buildTemplatePlaceholderMap({
        templateKey,
        codigoDocumento,
        form,
        user,
        variaveisExtras,
        cidade,
        specialData,
    });

    const missingPlaceholders = findMissingOrEmptyPlaceholders({
        templateKey,
        placeholders,
    });

    const normalizedData = normalizePlaceholderData(placeholders);

    const { absolutePath, relativeUrl, outputFileName } = buildGeneratedDocxPaths({
        templateKey,
        codigoDocumento,
    });

    await renderDocxTemplateToFile({
        templateAbsolutePath,
        outputAbsolutePath: absolutePath,
        data: normalizedData,
    });

    return {
        template,
        templateAbsolutePath,
        outputAbsolutePath: absolutePath,
        outputRelativeUrl: relativeUrl,
        outputFileName,
        placeholders,
        missingPlaceholders,
    };
}

/**
 * Função utilitária para obter metadados resumidos do template.
 *
 * Útil para logs, validação de tela e futura API de listagem.
 */
export function getTemplateMetadata(templateKey) {
    const template = assertTemplateKey(templateKey);

    return {
        key: template.key,
        tipo: template.tipo,
        label: template.label,
        category: template.category,
        templatePath: template.templatePath,
        placeholders: template.placeholders || [],
        specialHandler: template.specialHandler || null,
    };
}

/**
 * Converte o DOCX gerado para PDF e retorna metadados do PDF.
 *
 * Mantemos a pasta igual à do DOCX para simplificar a implantação inicial.
 */
export async function generatePdfFromGeneratedDocx({
    docxAbsolutePath,
}) {
    const pdfAbsolutePath = await convertDocxToPdf({
        inputAbsolutePath: docxAbsolutePath,
        outputDirAbsolutePath: GENERATED_PDF_BASE_DIR,
    });

    const pdfRelativeUrl = absolutePathToStorageUrl(pdfAbsolutePath);

    return {
        pdfAbsolutePath,
        pdfRelativeUrl,
    };
}