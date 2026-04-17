import { z } from "zod";
import bcrypt from "bcrypt";
import prisma from "../prisma/client.js";

const cpfSchema = z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, "");
        return digits.length === 11;
    }, "CPF inválido.");

const telefoneSchema = z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, "");
        return digits.length === 10 || digits.length === 11;
    }, "Telefone inválido.");

const matriculaSchema = z
    .string()
    .trim()
    .optional()
    .nullable();

const baseUserSchema = z.object({
    nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres."),
    email: z.string().email("E-mail inválido."),
    role: z.enum([
        "admin",
        "direcao",
        "pedagogico",
        "coordenacao",
        "coordsetor",
        "comercial",
        "secretaria",
        "instrutor",
        "aluno",
    ]),
    cpf: cpfSchema,
    matricula: matriculaSchema,
    fone1: telefoneSchema,
    fone2: telefoneSchema,
    turmaId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
});

const createUserSchema = baseUserSchema.extend({
    senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

const updateUserSchema = baseUserSchema.extend({
    senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres.").optional(),
});

const updateStatusSchema = z.object({
    ativo: z.boolean(),
});

const importUserItemSchema = z.object({
    nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres."),
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
    role: z.enum([
        "admin",
        "direcao",
        "pedagogico",
        "coordenacao",
        "coordsetor",
        "comercial",
        "secretaria",
        "instrutor",
        "aluno",
    ]),
    turmaNome: z.string().trim().optional().nullable(),
    cpf: cpfSchema,
    matricula: matriculaSchema,
    fone1: telefoneSchema,
    fone2: telefoneSchema,
});

const importUsersSchema = z.object({
    itens: z.array(importUserItemSchema).min(1, "Nenhum item enviado para importação."),
});

function normalizeTurmaId(role, turmaId) {
    if (role !== "aluno") return null;
    return turmaId ?? null;
}

function normalizeCpf(cpf) {
    if (!cpf) return null;
    const digits = String(cpf).replace(/\D/g, "");
    return digits || null;
}

function normalizeTelefone(telefone) {
    if (!telefone) return null;
    const digits = String(telefone).replace(/\D/g, "");
    return digits || null;
}

function normalizeMatricula(matricula) {
    if (!matricula) return null;
    const value = String(matricula).trim();
    return value || null;
}

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

async function validarTurmaSeNecessario(role, turmaId) {
    if (role !== "aluno") return null;
    if (!turmaId) return null;

    const turma = await prisma.turma.findUnique({
        where: { id: Number(turmaId) },
    });

    if (!turma) {
        const error = new Error("Turma não encontrada.");
        error.status = 404;
        throw error;
    }

    return Number(turmaId);
}

async function findTurmaByNome(nome) {
    const nomeLimpo = String(nome || "").trim();
    if (!nomeLimpo) return null;

    const turma = await prisma.turma.findFirst({
        where: {
            nome: {
                equals: nomeLimpo,
                mode: "insensitive",
            },
        },
    });

    return turma;
}

const userSelect = {
    id: true,
    nome: true,
    email: true,
    role: true,
    cpf: true,
    matricula: true,
    fone1: true,
    fone2: true,
    ativo: true,
    turmaId: true,
    turma: {
        select: {
            id: true,
            nome: true,
            turno: true,
            curso: {
                select: {
                    id: true,
                    nome: true,
                },
            },
        },
    },
    createdAt: true,
};

export async function listUsers(req, res, next) {
    try {
        const users = await prisma.user.findMany({
            select: userSelect,
            orderBy: {
                id: "asc",
            },
        });

        return res.status(200).json(users);
    } catch (error) {
        next(error);
    }
}

export async function createUser(req, res, next) {
    try {
        const data = createUserSchema.parse(req.body);

        const email = normalizeEmail(data.email);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Já existe um usuário com esse e-mail.",
            });
        }

        const turmaId = await validarTurmaSeNecessario(data.role, data.turmaId);
        const senhaHash = await bcrypt.hash(data.senha, 10);

        const user = await prisma.user.create({
            data: {
                nome: data.nome,
                email,
                senha: senhaHash,
                role: data.role,
                cpf: normalizeCpf(data.cpf),
                matricula: normalizeMatricula(data.matricula),
                fone1: normalizeTelefone(data.fone1),
                fone2: normalizeTelefone(data.fone2),
                ativo: true,
                turmaId: normalizeTurmaId(data.role, turmaId),
            },
            select: userSelect,
        });

        return res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

export async function updateUser(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = updateUserSchema.parse(req.body);
        const email = normalizeEmail(data.email);

        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                message: "Usuário não encontrado.",
            });
        }

        const emailEmUso = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id },
            },
        });

        if (emailEmUso) {
            return res.status(409).json({
                message: "Já existe outro usuário com esse e-mail.",
            });
        }

        const turmaId = await validarTurmaSeNecessario(data.role, data.turmaId);

        const payload = {
            nome: data.nome,
            email,
            role: data.role,
            cpf: normalizeCpf(data.cpf),
            matricula: normalizeMatricula(data.matricula),
            fone1: normalizeTelefone(data.fone1),
            fone2: normalizeTelefone(data.fone2),
            turmaId: normalizeTurmaId(data.role, turmaId),
        };

        if (data.senha && data.senha.trim()) {
            payload.senha = await bcrypt.hash(data.senha, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: payload,
            select: userSelect,
        });

        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export async function updateUserStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = updateStatusSchema.parse(req.body);
        const currentUserId = Number(req.user?.sub);

        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                message: "Usuário não encontrado.",
            });
        }

        if (id === currentUserId && data.ativo === false) {
            return res.status(400).json({
                message: "Você não pode desativar o próprio usuário logado.",
            });
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                ativo: data.ativo,
            },
            select: userSelect,
        });

        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}

export async function deleteUser(req, res, next) {
    try {
        const id = Number(req.params.id);
        const currentUserId = Number(req.user?.sub);

        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({
                message: "Usuário não encontrado.",
            });
        }

        if (id === currentUserId) {
            return res.status(400).json({
                message: "Você não pode excluir o próprio usuário logado.",
            });
        }

        await prisma.user.delete({
            where: { id },
        });

        return res.status(204).send();
    } catch (error) {
        next(error);
    }
}

export async function importUsers(req, res, next) {
    try {
        const data = importUsersSchema.parse(req.body);
        const erros = [];
        let importados = 0;

        for (let index = 0; index < data.itens.length; index++) {
            const item = data.itens[index];
            const linha = index + 2;

            try {
                const email = normalizeEmail(item.email);

                const existingUser = await prisma.user.findUnique({
                    where: { email },
                });

                if (existingUser) {
                    throw new Error("Já existe um usuário com esse e-mail.");
                }

                let turmaId = null;

                if (item.role === "aluno") {
                    if (!item.turmaNome || !String(item.turmaNome).trim()) {
                        throw new Error("Aluno precisa informar turmaNome.");
                    }

                    const turma = await findTurmaByNome(item.turmaNome);

                    if (!turma) {
                        throw new Error(`Turma não encontrada: ${item.turmaNome}`);
                    }

                    turmaId = turma.id;
                }

                const senhaHash = await bcrypt.hash(item.senha, 10);

                await prisma.user.create({
                    data: {
                        nome: item.nome,
                        email,
                        senha: senhaHash,
                        role: item.role,
                        cpf: normalizeCpf(item.cpf),
                        matricula: normalizeMatricula(item.matricula),
                        fone1: normalizeTelefone(item.fone1),
                        fone2: normalizeTelefone(item.fone2),
                        ativo: true,
                        turmaId: normalizeTurmaId(item.role, turmaId),
                    },
                });

                importados++;
            } catch (error) {
                erros.push({
                    linha,
                    nome: item.nome || "-",
                    email: item.email || "-",
                    message: error.message || "Erro ao importar usuário.",
                });
            }
        }

        if (erros.length) {
            return res.status(400).json({
                message: "Foram encontrados erros no arquivo CSV.",
                erros,
            });
        }

        const users = await prisma.user.findMany({
            select: userSelect,
            orderBy: {
                id: "asc",
            },
        });

        return res.status(201).json({
            message: `${importados} usuário(s) importado(s) com sucesso.`,
            users,
        });
    } catch (error) {
        next(error);
    }
}

/*PERFIL USER*/
export async function listPublicUsers(req, res, next) {
    try {
        const users = await prisma.user.findMany({
            where: {
                ativo: true,
            },
            select: {
                id: true,
                nome: true,
                role: true,
                bio: true,
                fotoUrl: true,
            },
            orderBy: {
                nome: "asc",
            },
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
}
/*END PERFIL USER*/