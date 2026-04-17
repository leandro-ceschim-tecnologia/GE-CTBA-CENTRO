import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/prisma/client.js";

async function main() {
    const email = "admin@portal.com";

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log("Admin já existe.");
        return;
    }

    const senhaHash = await bcrypt.hash("123456", 10);

    const user = await prisma.user.create({
        data: {
            nome: "Administrador",
            email,
            senha: senhaHash,
            role: "admin",
            ativo: true,
        },
    });

    console.log("Admin criado com sucesso:", user.email);
}

main()
    .catch((error) => {
        console.error("Erro no seed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });