export function errorHandler(error, req, res, next) {
    console.error(error);

    if (error?.name === "ZodError") {
        return res.status(400).json({
            message: "Dados inválidos.",
            issues: error.issues,
        });
    }

    return res.status(error.status || 500).json({
        message: error.message || "Erro interno do servidor.",
    });
}