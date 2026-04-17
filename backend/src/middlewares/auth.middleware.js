import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token não informado." });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        // ✅ NORMALIZA O USER
        req.user = {
            ...decoded,
            id: Number(decoded.id || decoded.sub),
        };

        if (!req.user.id) {
            return res.status(401).json({ message: "Token inválido." });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Usuário não autenticado." });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Acesso negado." });
        }

        next();
    };
}