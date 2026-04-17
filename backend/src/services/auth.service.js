import bcrypt from "bcrypt";
import prisma from "../prisma/client.js";
import { signToken } from "../utils/jwt.js";

function normalizeCpf(cpf) {
    if (!cpf) return null;
    return String(cpf).replace(/\D/g, "") || null;
}

export async function registerUser(data) {
    const { nome, email, senha, role, cpf } = data;

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        const error = new Error("Já existe um usuário com esse e-mail.");
        error.status = 409;
        throw error;
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
        data: {
            nome,
            email,
            senha: senhaHash,
            role,
            cpf: normalizeCpf(cpf), // ✅ AQUI
            ativo: true,
        },
        select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            cpf: true, // ✅ IMPORTANTE
            ativo: true,
            createdAt: true,
        },
    });

    return user;
}

export async function loginUser(data) {
    const { email, senha } = data;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        const error = new Error("E-mail ou senha inválidos.");
        error.status = 401;
        throw error;
    }

    if (!user.ativo) {
        const error = new Error("Usuário inativo.");
        error.status = 403;
        throw error;
    }

    const senhaOk = await bcrypt.compare(senha, user.senha);

    if (!senhaOk) {
        const error = new Error("E-mail ou senha inválidos.");
        error.status = 401;
        throw error;
    }

    const token = signToken({
        sub: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
    });

    return {
        token,
        user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            role: user.role,
            cpf: user.cpf,
            ativo: user.ativo,
        },
    };
}

export async function getMe(userId) {
    return prisma.user.findUnique({
        where: { id: Number(userId) },
        select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            cpf: true,
            ativo: true,
            createdAt: true,
        },
    });
}