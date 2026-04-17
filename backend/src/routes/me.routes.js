import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMe, updateMe, updateMyPassword } from "../controllers/me.controller.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.put("/me/password", requireAuth, updateMyPassword);

export default router;