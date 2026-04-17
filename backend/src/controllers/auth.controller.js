import { z } from "zod";
import { getMe, loginUser, registerUser } from "../services/auth.service.js";

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

const registerSchema = z.object({
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
    cpf: cpfSchema,
});

const loginSchema = z.object({
    email: z.string().email("E-mail inválido."),
    senha: z.string().min(1, "Senha obrigatória."),
});

export async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        const user = await registerUser(data);

        return res.status(201).json(user);
    } catch (error) {
        next(error);
    }
}

export async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);
        const result = await loginUser(data);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function me(req, res, next) {
    try {
        const user = await getMe(req.user.sub);

        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        return res.status(200).json(user);
    } catch (error) {
        next(error);
    }
}