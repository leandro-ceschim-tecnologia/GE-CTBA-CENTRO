import prisma from "../prisma/client.js";

export async function listInstrutores(req, res, next) {
    try {
        const instrutores = await prisma.user.findMany({
            where: {
                ativo: true,
                role: {
                    in: ["instrutor", "coordenacao"],
                },
            },
            select: {
                id: true,
                nome: true,
                email: true,
                role: true,
                ativo: true,
            },
            orderBy: {
                nome: "asc",
            },
        });

        return res.status(200).json(instrutores);
    } catch (error) {
        next(error);
    }
}