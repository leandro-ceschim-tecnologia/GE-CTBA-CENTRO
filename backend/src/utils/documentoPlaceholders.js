/**
 * Este arquivo monta o dicionário padrão de placeholders.
 *
 * Ideia:
 * - concentrar aqui a transformação dos dados do formulário
 * - evitar montar placeholders "na mão" em vários arquivos
 * - facilitar inclusão futura de novos campos
 */

import { email } from "zod";

/**
 * Formata data em pt-BR: 08/04/2026
 */
export function formatDateBR(date = new Date()) {
    return new Intl.DateTimeFormat("pt-BR").format(date);
}

/**
 * Formata data por extenso simples.
 * Ex.: 8 de abril de 2026
 */
export function formatDateExtenso(date = new Date()) {
    return date.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

/**
 * Monta algo como "Curitiba, 8 de abril de 2026"
 */
export function buildCidadeData(cidade = "Curitiba", date = new Date()) {
    return `${cidade}, ${formatDateExtenso(date)}`;
}

/**
 * Normaliza valor nulo/undefined para string vazia.
 */
function safe(value) {
    return value === undefined || value === null ? "" : String(value);
}

/**
 * Gera o mapa padrão de placeholders do sistema.
 *
 * IMPORTANTE:
 * Nesta primeira etapa estamos respeitando a estrutura
 * que seu frontend atual já envia no payload.
 */
export function buildDefaultPlaceholders({
    codigoDocumento,
    baseUrlValidacao,
    cidade = "Curitiba",
    form = {},
    user = null,
}) {
    const now = new Date();

    const aluno = form.nomeSolicitante || user?.nome || "";
    const email = form.emailSolicitante || user?.email || "";
    const cpf = form.cpfSolicitante || user?.cpf || "";
    const matricula = form.matriculaSolicitante || user?.matricula || "";
    const fone1 = form.fone1Solicitante || user?.fone1 || "";
    const fone2 = form.fone2Solicitante || user?.fone2 || "";
    const curso = form.cursoSolicitante || user?.turma?.curso?.nome || "";
    const turma = form.turmaSolicitante || user?.turma?.nome || "";

    const codigo = safe(codigoDocumento);
    const urlValidacao = codigo
        ? `${baseUrlValidacao}/${codigo}`
        : "";

    return {
        // Base
        OBSERVACOES: safe(form.observacoes),
        ALUNO: safe(aluno),
        CPF: safe(cpf),
        EMAIL: safe(email),
        MATRICULA: safe(matricula),
        FONE1: safe(fone1),
        FONE2: safe(fone2),
        CURSO: safe(curso),
        TURMA: safe(turma),
        "CIDADE-DATA": buildCidadeData(cidade, now),
        CODIGO: codigo,
        URL_VALIDACAO: urlValidacao,

        // Condicionais
        PAI: safe(form.pai),
        MAE: safe(form.mae),
        MOTIVO: safe(form.motivo),
        HORARIO: safe(form.horario),
        HORARIOENTRADA: safe(form.horarioEntrada),
        HORARIOSAIDA: safe(form.horarioSaida),

        // Ocasionais
        TITULO: safe(form.titulo),
        TIPO_DOCUMENTO: safe(form.tipo),
        ASSUNTO: safe(form.assunto),
        DESTINATARIO: safe(form.destinatarioNome),
        CARGO_DESTINATARIO: safe(form.destinatarioCargo),
        ORGAO_DESTINATARIO: safe(form.destinatarioOrgao),
        DATA_ATUAL: formatDateBR(now),
        DATA_EXTENSO: formatDateExtenso(now),
    };
}

/**
 * Builder especial da ata individual.
 *
 * Nesta primeira etapa ele só garante a estrutura dos placeholders.
 * No próximo passo nós vamos ligar isso ao cronograma/disciplina.
 */
export function buildAtaIndividualPlaceholders({
    form = {},
    datas = [],
}) {
    const placeholders = {
        ALUNO: safe(form.aluno || form.nomeSolicitante),
        TURMA: safe(form.turma || form.turmaSolicitante),
        DISCIPLINA: safe(form.disciplina),
        INSTRUTOR: safe(form.instrutor),
        MOTIVO: safe(form.motivo),
        "OBSERVAÇÃO": safe(form.observacao || form.observacoes),
    };

    /**
     * Garante DATA01 até DATA15 sempre presentes.
     * Se não houver data, fica vazio para não sobrar placeholder.
     */
    for (let i = 1; i <= 15; i += 1) {
        const key = `DATA${String(i).padStart(2, "0")}`;
        placeholders[key] = safe(datas[i - 1] || "");
    }

    return placeholders;
}