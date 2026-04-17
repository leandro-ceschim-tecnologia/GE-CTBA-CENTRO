import * as meService from "../services/me.service.js";

export async function getMe(req, res, next) {
    try {
        const userId = req.user.id;
        const user = await meService.getMe(userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
}

export async function updateMe(req, res, next) {
    try {
        const userId = req.user.id;
        const updated = await meService.updateMe(userId, req.body);
        res.json(updated);
    } catch (error) {
        next(error);
    }
}

export async function updateMyPassword(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await meService.updateMyPassword(userId, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
}