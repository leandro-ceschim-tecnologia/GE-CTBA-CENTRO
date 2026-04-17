-- CreateEnum
CREATE TYPE "TarefaPedagogicaTipo" AS ENUM ('LEVANTAMENTO_CH_ESTAGIO', 'CONTATO_INSTRUTOR', 'AJUSTE_CRONOGRAMA', 'DOCUMENTACAO_ESTAGIO', 'LANCAMENTO_SISTEMA', 'CONFERENCIA_DIARIOS', 'RESPONDER_WHATS_AD', 'CONTATO_ALUNO', 'EMISSAO_DOCUMENTO', 'LIGACOES_PARA_LFR', 'LIGACOES_PARA_LFI', 'LIGACOES_PARA_NC_LAC', 'LIGACOES_FALTOSOS', 'REQUERIMENTOS_SECRETARIA', 'SEPARAR_MATERIAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "TarefaPedagogicaTurno" AS ENUM ('MANHA', 'TARDE', 'NOITE', 'INTEGRAL', 'SABADO');

-- CreateEnum
CREATE TYPE "TarefaPedagogicaStatus" AS ENUM ('PENDENTE', 'EM_EXECUCAO', 'CONCLUIDA', 'CANCELADA');

-- CreateTable
CREATE TABLE "TarefaPedagogica" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TarefaPedagogicaTipo" NOT NULL,
    "prazo" TIMESTAMP(3) NOT NULL,
    "turno" "TarefaPedagogicaTurno" NOT NULL,
    "status" "TarefaPedagogicaStatus" NOT NULL DEFAULT 'PENDENTE',
    "responsavelId" INTEGER NOT NULL,
    "criadoPorId" INTEGER NOT NULL,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConclusao" TIMESTAMP(3),
    "observacoes" TEXT,

    CONSTRAINT "TarefaPedagogica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TarefaPedagogica_responsavelId_idx" ON "TarefaPedagogica"("responsavelId");

-- CreateIndex
CREATE INDEX "TarefaPedagogica_criadoPorId_idx" ON "TarefaPedagogica"("criadoPorId");

-- CreateIndex
CREATE INDEX "TarefaPedagogica_status_idx" ON "TarefaPedagogica"("status");

-- CreateIndex
CREATE INDEX "TarefaPedagogica_tipo_idx" ON "TarefaPedagogica"("tipo");

-- CreateIndex
CREATE INDEX "TarefaPedagogica_prazo_idx" ON "TarefaPedagogica"("prazo");

-- AddForeignKey
ALTER TABLE "TarefaPedagogica" ADD CONSTRAINT "TarefaPedagogica_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TarefaPedagogica" ADD CONSTRAINT "TarefaPedagogica_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
