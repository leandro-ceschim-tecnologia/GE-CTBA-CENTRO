import { z } from "zod";

export const emitirCertificadoLoteSchema = z.object({
    sobrescrever: z.boolean().optional().default(false),
});

export const validarCertificadoCodigoSchema = z.object({
    codigo: z.string().min(3, "Código inválido."),
});