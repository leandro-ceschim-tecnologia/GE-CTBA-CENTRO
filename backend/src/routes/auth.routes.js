import { Router } from "express";
import { login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireAuth, me);

console.log(
    "Auth routes carregadas:",
    router.stack
        .filter((layer) => layer.route)
        .map((layer) => ({
            path: layer.route.path,
            methods: Object.keys(layer.route.methods),
        }))
);

export default router;