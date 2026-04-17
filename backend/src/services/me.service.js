import bcrypt from "bcrypt";
import prisma from "../prisma/client.js";

function normalizarTexto(valor) {
    if (valor === undefined || valor === null) return null;
    const texto = String(valor).trim();
    return texto ? texto : null;
}

export async function getMe(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            matricula: true,
            fone1: true,
            fone2: true,
            fotoUrl: true,
            bio: true,
            role: true,
            ativo: true,
            turmaId: true,
            createdAt: true,
            updatedAt: true,
            turma: {
                select: {
                    id: true,
                    nome: true,
                    turno: true,
                },
            },
        },
    });

    if (!user) {
        throw new Error("Usuário não encontrado.");
    }

    return user;
}

export async function updateMe(userId, payload) {
    const data = {};

    if (payload.nome !== undefined) {
        const nome = normalizarTexto(payload.nome);

        if (!nome) {
            throw new Error("Nome não pode ficar vazio.");
        }

        data.nome = nome;
    }

    if (payload.fone1 !== undefined) {
        data.fone1 = normalizarTexto(payload.fone1);
    }

    if (payload.fone2 !== undefined) {
        data.fone2 = normalizarTexto(payload.fone2);
    }

    if (payload.fotoUrl !== undefined) {
        data.fotoUrl = normalizarTexto(payload.fotoUrl);
    }

    if (payload.bio !== undefined) {
        data.bio = normalizarTexto(payload.bio);
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            nome: true,
            email: true,
            cpf: true,
            matricula: true,
            fone1: true,
            fone2: true,
            fotoUrl: true,
            bio: true,
            role: true,
            ativo: true,
            turmaId: true,
            createdAt: true,
            updatedAt: true,
            turma: {
                select: {
                    id: true,
                    nome: true,
                    turno: true,
                },
            },
        },
    });

    return updated;
}

export async function updateMyPassword(userId, payload) {
    const senhaAtual = String(payload.senhaAtual || "");
    const novaSenha = String(payload.novaSenha || "");
    const confirmarNovaSenha = String(payload.confirmarNovaSenha || "");

    if (!senhaAtual) {
        throw new Error("Informe a senha atual.");
    }

    if (!novaSenha || novaSenha.length < 6) {
        throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
    }

    if (novaSenha !== confirmarNovaSenha) {
        throw new Error("A confirmação da nova senha não confere.");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            senha: true,
        },
    });

    if (!user) {
        throw new Error("Usuário não encontrado.");
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, user.senha);

    if (!senhaCorreta) {
        throw new Error("A senha atual está incorreta.");
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
        where: { id: userId },
        data: {
            senha: senhaHash,
        },
    });

    return {
        success: true,
        message: "Senha alterada com sucesso.",
    };
}