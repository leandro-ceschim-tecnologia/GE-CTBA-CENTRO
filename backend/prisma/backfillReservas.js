import "dotenv/config";
import prisma from "../src/prisma/client.js";

function getDefaultTimeByTurno(turno) {
    if (turno === "manha") {
        return { inicio: "08:00", fim: "12:00" };
    }

    if (turno === "tarde") {
        return { inicio: "13:00", fim: "17:00" };
    }

    return { inicio: "18:30", fim: "22:30" };
}

async function main() {
    const reservas = await prisma.reserva.findMany({
        where: {
            OR: [
                { data: null },
                { turno: null },
                { horarioInicio: null },
                { horarioFim: null },
            ],
        },
        include: {
            cronogramaAula: {
                include: {
                    turma: true,
                },
            },
        },
    });

    if (!reservas.length) {
        console.log("Nenhuma reserva pendente de backfill.");
        return;
    }

    let totalAtualizadas = 0;

    for (const reserva of reservas) {
        const aula = reserva.cronogramaAula;

        if (!aula) {
            console.log(
                `Reserva ${reserva.id} ignorada: não possui cronogramaAula vinculada.`
            );
            continue;
        }

        const turno = reserva.turno || aula.turma?.turno || "noite";
        const horarioPadrao = getDefaultTimeByTurno(turno);

        const data = reserva.data || aula.data;
        const horarioInicio = reserva.horarioInicio || horarioPadrao.inicio;
        const horarioFim = reserva.horarioFim || horarioPadrao.fim;

        await prisma.reserva.update({
            where: { id: reserva.id },
            data: {
                data,
                turno,
                horarioInicio,
                horarioFim,
            },
        });

        totalAtualizadas++;
        console.log(`Reserva ${reserva.id} atualizada com sucesso.`);
    }

    console.log(`Backfill concluído. Total atualizadas: ${totalAtualizadas}`);
}

main()
    .catch((error) => {
        console.error("Erro no backfill de reservas:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });