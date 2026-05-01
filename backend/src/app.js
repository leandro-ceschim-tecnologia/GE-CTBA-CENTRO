import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import meRoutes from "./routes/me.routes.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

import cursoRoutes from "./routes/curso.routes.js";
import turmaRoutes from "./routes/turma.routes.js";
import disciplinaRoutes from "./routes/disciplina.routes.js";
import turmaDisciplinaRoutes from "./routes/turmaDisciplina.routes.js";
import cronogramaRoutes from "./routes/cronograma.routes.js";
import recessoRoutes from "./routes/recesso.routes.js";
import cronogramaInstrutorRoutes from "./routes/cronogramaInstrutor.routes.js";
import reservaRoutes from "./routes/reserva.routes.js";
import instrutorRoutes from "./routes/instrutor.routes.js";
import minhasAulasRoutes from "./routes/minhasAulas.routes.js";
import ofertaRoutes from "./routes/oferta.routes.js";
import certificadoRoutes from "./routes/certificado.routes.js";
import informativoRoutes from "./routes/informativo.routes.js";
import tarefasPedagogicasRoutes from "./routes/tarefasPedagogicas.routes.js";
import estagiosEnfRoutes from "./routes/estagiosEnf.routes.js";

import documentoRoutes from "./routes/documento.routes.js";

import path from "path";

import frequenciaRoutes from "./routes/frequencia.routes.js";
import evasaoRoutes from "./routes/evasao.routes.js";

import salaRoutes from "./routes/sala.routes.js";
import ensalamentoRoutes from "./routes/ensalamento.routes.js";
import ocupacaoSalasRoutes from "./routes/ocupacao-salas.routes.js";
import ofertaDisponibilidadeRoutes from "./routes/oferta-disponibilidade.routes.js";

const app = express();


//const allowedOrigins = (process.env.CORS_ORIGIN || "")
//    .split(",")
//    .map((item) => item.trim())
//    .filter(Boolean);

app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options(/.*/, cors({
    origin: true,
    credentials: true,
}));

app.use(express.json());


app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("API rodando 🚀");
});

app.use(meRoutes);

//app.post("/auth/login", (req, res) => {
//    console.log("✅ BATEU NA ROTA DIRETA /auth/login");
//    return res.status(200).json({
//        ok: true,
//        source: "app.js direto",
//        body: req.body,
//    });
//});

app.use("/auth", authRoutes);

app.use("/users", userRoutes);
app.use("/cursos", cursoRoutes);
app.use("/turmas", turmaRoutes);
app.use("/disciplinas", disciplinaRoutes);
app.use("/turma-disciplinas", turmaDisciplinaRoutes);
app.use("/cronograma", cronogramaRoutes);
app.use("/recessos", recessoRoutes);
app.use("/cronograma-aulas", cronogramaInstrutorRoutes);
app.use("/reservas", reservaRoutes);
app.use("/instrutores", instrutorRoutes);
app.use("/minhas-aulas", minhasAulasRoutes);
app.use("/ofertas", ofertaRoutes);
app.use("/", certificadoRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/", informativoRoutes);
app.use("/", tarefasPedagogicasRoutes);
app.use("/estagios-enf", estagiosEnfRoutes);
app.use(documentoRoutes);
app.use("/storage", express.static(path.resolve(process.cwd(), "storage")));

app.use("/frequencia", frequenciaRoutes);
app.use("/evasao", evasaoRoutes);


app.use("/salas", salaRoutes);
app.use("/ensalamento", ensalamentoRoutes);
app.use("/ocupacao-salas", ocupacaoSalasRoutes);
app.use("/ofertas/disponibilidade", ofertaDisponibilidadeRoutes);



app.use(errorHandler);

export default app;