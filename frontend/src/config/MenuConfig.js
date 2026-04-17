export const instituicaoMenu = {
    label: "Instituição",
    icon: "🏛️",
    children: [
        { label: "Sobre o Grau", path: "/instituicao/sobre", icon: "📖" },
        { label: "Missão", path: "/instituicao/missao", icon: "🎯" },
        { label: "Visão", path: "/instituicao/visao", icon: "👁️" },
        { label: "Valores", path: "/instituicao/valores", icon: "💚" },
        { label: "Ações Sociais", path: "/instituicao/acoes-sociais", icon: "🤝" },
    ],
};

export const cursosEscolaMenu = {
    label: "Cursos Técnicos",
    icon: "🎓",
    children: [
        { label: "Administração", path: "/cursos/administracao", icon: "📘" },
        { label: "Edificações", path: "/cursos/edificacoes", icon: "🏗️" },
        { label: "Eletrotécnica", path: "/cursos/eletrotecnica", icon: "⚡" },
        { label: "Enfermagem", path: "/cursos/enfermagem", icon: "🩺" },
        { label: "Radiologia", path: "/cursos/radiologia", icon: "🩻" },
        { label: "Segurança do Trabalho", path: "/cursos/seguranca-do-trabalho", icon: "🦺" },
    ],
};

export const pedagogico = {
    label: "Pedagógico",
    icon: "📚",
    children: [
        { label: "Cursos", path: "/cursos", icon: "🧩" },
        { label: "Turmas", path: "/turmas", icon: "🏫" },
        { label: "Disciplinas", path: "/disciplinas", icon: "📝" },
        { label: "Turma x Disciplinas", path: "/turma-disciplinas", icon: "🔗" },
        { label: "Recessos", path: "/recessos", icon: "🚫" },
        { label: "Cronograma", path: "/cronograma", icon: "🗓️" },
        { label: "Cronograma Geral", path: "/cronograma-geral", icon: "🗂️" },
        { label: "Central de Ajuda", path: "/manual-pedagogico", icon: "📘", roles: ["admin", "pedagogico", "coordenacao"] }
    ]
};

export const profissionalizantesMenu = {
    label: "Cursos Profissionalizantes",
    icon: "🛠️",
    children: [
        { label: "Saúde", path: "/profissionalizantes/saude", icon: "🩺" },
        { label: "Grau Digital", path: "/profissionalizantes/grau-digital", icon: "💻" },
        { label: "Indústria e Construção", path: "/profissionalizantes/industria-construcao", icon: "🏗️" },
        { label: "Grau Gourmet", path: "/profissionalizantes/gourmet", icon: "🍳" },
        { label: "Grau Beleza", path: "/profissionalizantes/beleza", icon: "💄" },
        { label: "Moda", path: "/profissionalizantes/moda", icon: "🧵" },
        { label: "Tecnologia", path: "/profissionalizantes/tecnologia", icon: "🤖" },
        { label: "Automotivo", path: "/profissionalizantes/automotivo", icon: "🚗" },
    ],
};

export const portalAcademicoMenu = {
    label: "Portal Acadêmico",
    path: "https://portalacademico.qualinfonet.com.br/grauteccuritiba/",
    icon: "🎓",
    external: true,
};

export const ensalamentoMenu = {
    label: "Ensalamento",
    path: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzISAVYb7XBxIcXICBK2lMOKX2Afa1ggvGZL8H52SC1awZlMt6wTyzOgiz4m4ALspxywKD_SCraL6t/pubhtml?gid=1804756709&single=true",
    icon: "🏫",
    external: true,
};

export const estagiosMenu = {
    label: "Estágios",
    icon: "🩺",
    children: [
        {
            label: "Blocos",
            path: "/estagios-enfermagem",
            icon: "📋",
        },
        {
            label: "Campos de Estágio",
            path: "/estagios-enfermagem/campos",
            icon: "🏥",
        },
    ],
};

export const menuByRole = {
    admin: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        portalAcademicoMenu,
        ensalamentoMenu,
        { label: "Informativos", path: "/informativos", icon: "📢" },
        { label: "Tarefas Pedagógicas", path: "/tarefas-pedagogicas", icon: "✅" },
        pedagogico,
        { label: "Ofertas Acadêmicas", path: "/ofertas", icon: "📚" },

        estagiosMenu,
        {
            label: "Documentos Oficiais",
            path: "/documentos",
            icon: "📄",
        },
        { label: "Usuários", path: "/usuarios", icon: "👥" },
        { label: "Frequência", path: "/frequencia", icon: "✅" },
        { label: "Controle de Evasão", path: "/evasao", icon: "📞" },
        {
            label: "Salas",
            path: "/salas",
            icon: "🏫",
            roles: ["admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"],
        },
        {
            label: "Ensalamento",
            path: "/ensalamento",
            icon: "🪑",
            roles: ["admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"],
        },
        {
            label: "Ocupação de Salas",
            path: "/ocupacao-salas",
            icon: "📅",
            roles: ["admin", "pedagogico", "coordenacao", "coordsetor", "secretaria"],
        }
    ],

    pedagogico: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        portalAcademicoMenu,
        ensalamentoMenu,
        { label: "Informativos", path: "/informativos", icon: "📢" },
        { label: "Tarefas Pedagógicas", path: "/tarefas-pedagogicas", icon: "✅" },
        pedagogico,
        { label: "Ofertas Acadêmicas", path: "/ofertas", icon: "📚" },

        estagiosMenu,
        {
            label: "Documentos Oficiais",
            path: "/documentos",
            icon: "📄",
        },
        { label: "Frequência", path: "/frequencia", icon: "✅" },
        { label: "Controle de Evasão", path: "/evasao", icon: "📞" },
    ],

    coordenacao: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        portalAcademicoMenu,
        ensalamentoMenu,
        pedagogico,
        { label: "Ofertas Acadêmicas", path: "/ofertas", icon: "📚" },
        { label: "Informativos", path: "/informativos", icon: "📢" },

        estagiosMenu,
        {
            label: "Documentos Oficiais",
            path: "/documentos",
            icon: "📄",
        }
    ],

    coordsetor: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        portalAcademicoMenu,
        ensalamentoMenu,
        { label: "Informativos", path: "/informativos", icon: "📢" },
        { label: "Cursos", path: "/cursos", icon: "📚" },
        { label: "Recessos", path: "/recessos", icon: "📅" },
        { label: "Ofertas Acadêmicas", path: "/ofertas", icon: "📚" },

    ],

    instrutor: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        portalAcademicoMenu,
        ensalamentoMenu,
        { label: "Minhas Aulas", path: "/minhas-aulas/instrutor", icon: "📘" },
        { label: "Manual do Instrutor", path: "/manual-instrutor", icon: "📕" },


    ],

    secretaria: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        portalAcademicoMenu,
        ensalamentoMenu,
    ],

    comercial: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        ensalamentoMenu,
    ],

    aluno: [
        { label: "Home", path: "/", icon: "🏠" },
        { label: "Perfis", path: "/perfis", icon: "👥" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
        portalAcademicoMenu,
        ensalamentoMenu,
        { label: "Minhas Aulas", path: "/minhas-aulas/aluno", icon: "📘" },
        { label: "Meu Estágio", path: "/meu-estagio", icon: "🩺" },
        { label: "Meus Documentos", path: "/meus-documentos", icon: "📄" },
        {
            label: "Meu Ensalamento",
            path: "/meu-ensalamento",
            icon: "📍",
            roles: ["aluno"],
        },

    ],
};

export function getMenuByRole(role) {
    return menuByRole[role] || [
        { label: "Home", path: "/", icon: "🏠" },
        instituicaoMenu,
        cursosEscolaMenu,
        profissionalizantesMenu,
    ];
}