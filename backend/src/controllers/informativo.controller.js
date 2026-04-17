import {
    createInformativoSchema,
    updateInformativoSchema,
    updateInformativoStatusSchema,
} from "../schemas/informativo.schemas.js";

import * as informativoService from "../services/informativo.service.js";

export async function createInformativo(req, res, next) {
    try {
        const data = createInformativoSchema.parse(req.body);
        const currentUserId = Number(req.user?.sub);

        const result = await informativoService.createInformativo(data, currentUserId);

        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function listInformativosAdmin(req, res, next) {
    try {
        const result = await informativoService.listInformativosAdmin();
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getInformativoById(req, res, next) {
    try {
        const id = Number(req.params.id);
        const result = await informativoService.getInformativoById(id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function updateInformativo(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = updateInformativoSchema.parse(req.body);

        const result = await informativoService.updateInformativo(id, data);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function updateInformativoStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status } = updateInformativoStatusSchema.parse(req.body);

        const result = await informativoService.updateInformativoStatus(id, status);

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function listInformativosAtivosMe(req, res, next) {
    try {
        const result = await informativoService.listInformativosAtivosParaUsuario(req.user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function listDestinatariosInformativos(req, res, next) {
    try {
        const result = await informativoService.listDestinatariosInformativos();
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}