import path from "path";

/**
 * Caminho absoluto da pasta de templates.
 *
 * Ajustado para funcionar mesmo executando o backend a partir da pasta /backend.
 */
export const TEMPLATE_BASE_DIR = path.resolve(process.cwd(), "templates");

/**
 * Registro central dos templates disponíveis no sistema.
 *
 * Nesta primeira etapa:
 * - NÃO vamos mexer no banco
 * - NÃO vamos mexer no frontend
 * - NÃO vamos criar tipos novos no Prisma
 *
 * Vamos apenas centralizar o conhecimento dos templates.
 *
 * Depois, se você quiser evoluir para cadastro em banco,
 * este arquivo pode virar a "ponte" até essa migração.
 */
export const DOCUMENT_TEMPLATE_REGISTRY = {
    // =========================
    // DECLARAÇÕES
    // =========================
    declaracao_padrao: {
        key: "declaracao_padrao",
        tipo: "DECLARACAO",
        label: "Declaração Padrão",
        category: "declaracoes",
        templatePath: "declaracoes/declaracaopadrao.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "ASSUNTO",
            "OBSERVACOES",
            "NOME",
            "CPF",
            "MATRICULA",
            "FONE1",
            "FONE2",
            "CURSO",
            "TURMA",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    declaracao_conclusao_curso: {
        key: "declaracao_conclusao_curso",
        tipo: "DECLARACAO",
        label: "Declaração de Conclusão de Curso",
        category: "declaracoes",
        templatePath: "declaracoes/declaracaoconclusaocurso.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "ASSUNTO",
            "OBSERVACOES",
            "NOME",
            "CPF",
            "MATRICULA",
            "CURSO",
            "TURMA",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    declaracao_estagio: {
        key: "declaracao_estagio",
        tipo: "DECLARACAO",
        label: "Declaração de Estágio",
        category: "declaracoes",
        templatePath: "declaracoes/declaracaodeestagio.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "ASSUNTO",
            "OBSERVACOES",
            "NOME",
            "CPF",
            "MATRICULA",
            "CURSO",
            "TURMA",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    // =========================
    // OFÍCIOS
    // =========================
    oficio_padrao: {
        key: "oficio_padrao",
        tipo: "OFICIO",
        label: "Ofício Padrão",
        category: "oficios",
        templatePath: "oficios/oficiopadrao.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "ASSUNTO",
            "OBSERVACOES",
            "DESTINATARIO",
            "CARGO_DESTINATARIO",
            "ORGAO_DESTINATARIO",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    // =========================
    // REQUERIMENTOS
    // =========================
    requerimento_padrao: {
        key: "requerimento_padrao",
        tipo: "REQUERIMENTO",
        label: "Requerimento Padrão",
        category: "requerimentos",
        templatePath: "requerimentos/requerimentopadrao.docx",
        placeholders: [
            "ALUNO",
            "CPF",
            "MATRICULA",
            "FONE1",
            "FONE2",
            "EMAIL",
            "CURSO",
            "TURMA",
            "MOTIVO",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "OBSERVACOES",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    requerimento_segunda_chamada: {
        key: "requerimento_segunda_chamada",
        tipo: "REQUERIMENTO",
        label: "Requerimento de Segunda Chamada",
        category: "requerimentos",
        templatePath: "requerimentos/requerimento_segunda_chamada.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "ASSUNTO",
            "OBSERVACOES",
            "NOME",
            "CPF",
            "MATRICULA",
            "CURSO",
            "TURMA",
            "MOTIVO",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    // =========================
    // RESPONSABILIDADE
    // =========================
    responsabilidade_entrada_mais_tarde: {
        key: "responsabilidade_entrada_mais_tarde",
        tipo: "REQUERIMENTO", // mantido assim por enquanto para não mexer no enum agora
        label: "Responsabilidade de Entrada Mais Tarde",
        category: "responsabilidade",
        templatePath: "responsabilidade/responsabilidadeentradamaistarde.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "NOME",
            "CPF",
            "MATRICULA",
            "CURSO",
            "TURMA",
            "PAI",
            "MAE",
            "MOTIVO",
            "HORARIO",
            "HORARIOENTRADA",
            "HORARIOSAIDA",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    responsabilidade_saida_antecipada: {
        key: "responsabilidade_saida_antecipada",
        tipo: "REQUERIMENTO", // mantido assim por enquanto para não mexer no enum agora
        label: "Responsabilidade de Saída Antecipada",
        category: "responsabilidade",
        templatePath: "responsabilidade/responsabilidadesaidaantecipada.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "NOME",
            "CPF",
            "MATRICULA",
            "CURSO",
            "TURMA",
            "PAI",
            "MAE",
            "MOTIVO",
            "HORARIO",
            "HORARIOENTRADA",
            "HORARIOSAIDA",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    // =========================
    // ESTÁGIO
    // =========================
    aceite_estagio: {
        key: "aceite_estagio",
        tipo: "REQUERIMENTO", // provisório nesta etapa
        label: "Aceite de Estágio",
        category: "estagio",
        templatePath: "estagio/aceitedeestagio.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "ASSUNTO",
            "OBSERVACOES",
            "NOME",
            "CPF",
            "MATRICULA",
            "CURSO",
            "TURMA",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    desistencia_estagio: {
        key: "desistencia_estagio",
        tipo: "REQUERIMENTO", // provisório nesta etapa
        label: "Desistência de Estágio",
        category: "estagio",
        templatePath: "estagio/desistenciadeestagio.docx",
        placeholders: [
            "TITULO",
            "TIPO_DOCUMENTO",
            "ASSUNTO",
            "OBSERVACOES",
            "NOME",
            "CPF",
            "MATRICULA",
            "CURSO",
            "TURMA",
            "MOTIVO",
            "CODIGO",
            "DATA_ATUAL",
            "DATA_EXTENSO",
            "CIDADE_DATA",
            "URL_VALIDACAO",
        ],
    },

    // =========================
    // ATA INDIVIDUAL
    // =========================
    ata_individual: {
        key: "ata_individual",
        tipo: "DECLARACAO", // provisório nesta etapa, sem alterar enum agora
        label: "Ata Individual",
        category: "ataindividual",
        templatePath: "ataindividual/ataindividual.docx",

        /**
         * Este template é especial.
         *
         * Motivos:
         * - usa placeholders padrão de aluno/turma
         * - usa placeholders acadêmicos próprios
         * - usa sequência DATA01 ... DATA15
         *
         * Depois trataremos isso com um "builder" específico.
         */
        placeholders: [
            "ALUNO",
            "TURMA",
            "DISCIPLINA",
            "INSTRUTOR",
            "MOTIVO",
            "OBSERVAÇÃO",
            "DATA01",
            "DATA02",
            "DATA03",
            "DATA04",
            "DATA05",
            "DATA06",
            "DATA07",
            "DATA08",
            "DATA09",
            "DATA10",
            "DATA11",
            "DATA12",
            "DATA13",
            "DATA14",
            "DATA15",
        ],
        specialHandler: "ataIndividual",
    },
};

/**
 * Retorna a configuração de um template pelo "key".
 */
export function getDocumentTemplateByKey(templateKey) {
    return DOCUMENT_TEMPLATE_REGISTRY[templateKey] || null;
}

/**
 * Retorna o caminho absoluto do arquivo físico.
 */
export function getDocumentTemplateAbsolutePath(templateKey) {
    const template = getDocumentTemplateByKey(templateKey);

    if (!template) {
        throw new Error(`Template não encontrado para a chave: ${templateKey}`);
    }

    return path.join(TEMPLATE_BASE_DIR, template.templatePath);
}

/**
 * Lista templates por tipo Prisma atual.
 *
 * Útil porque hoje seu enum ainda é:
 * DECLARACAO | OFICIO | REQUERIMENTO
 */
export function listDocumentTemplatesByTipo(tipo) {
    return Object.values(DOCUMENT_TEMPLATE_REGISTRY).filter(
        (item) => item.tipo === tipo
    );
}

/**
 * Mapeamento provisório para manter compatibilidade com o frontend atual.
 *
 * Hoje o frontend envia somente:
 * - tipo
 * - título
 * - assunto
 * - observações
 * etc.
 *
 * Ainda não envia "templateKey".
 *
 * Então, nesta etapa, cada tipo usa um template padrão.
 * Depois você poderá mudar isso no frontend e escolher o template exato.
 */
export const DEFAULT_TEMPLATE_KEY_BY_TIPO = {
    DECLARACAO: "declaracao_padrao",
    OFICIO: "oficio_padrao",
    REQUERIMENTO: "requerimento_padrao",
};

/**
 * Resolve a chave do template:
 * 1. usa templateKey se vier explícita
 * 2. senão, usa o padrão conforme o tipo
 */
export function resolveTemplateKey({ tipo, templateKey }) {
    if (templateKey && DOCUMENT_TEMPLATE_REGISTRY[templateKey]) {
        return templateKey;
    }

    const defaultKey = DEFAULT_TEMPLATE_KEY_BY_TIPO[tipo];
    if (!defaultKey) {
        throw new Error(`Não há template padrão configurado para o tipo ${tipo}.`);
    }

    return defaultKey;
}

/**
 * Busca template por templatePath salvo no banco.
 * Útil para regeneração futura.
 */
export function getDocumentTemplateByPath(templatePath) {
    return (
        Object.values(DOCUMENT_TEMPLATE_REGISTRY).find(
            (item) => item.templatePath === templatePath
        ) || null
    );
}