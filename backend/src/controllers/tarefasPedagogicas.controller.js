import {
    createTarefaPedagogicaSchema,
    createTarefasPedagogicasLoteSchema,
    updateStatusTarefaPedagogicaSchema,
    tarefaPedagogicaIdParamSchema,
    listTarefasPedagogicasQuerySchema,
    validarSugestaoPrazoLevantamentoCHSchema,
} from "../schemas/tarefasPedagogicas.schemas.js";

import * as tarefasPedagogicasService from "../services/tarefasPedagogicas.service.js";

export async function listTarefasPedagogicas(req, res, next) {
    try {
        const filters = listTarefasPedagogicasQuerySchema.parse(req.query);
        const result = await tarefasPedagogicasService.listTarefasPedagogicas(filters);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getResumoTarefasPedagogicas(req, res, next) {
    try {
        const filters = listTarefasPedagogicasQuerySchema.parse(req.query);
        const result = await tarefasPedagogicasService.getResumoTarefasPedagogicas(filters);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function getTarefaPedagogicaById(req, res, next) {
    try {
        const { id } = tarefaPedagogicaIdParamSchema.parse(req.params);
        const result = await tarefasPedagogicasService.getTarefaPedagogicaById(id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function listPedagogicosAtivos(req, res, next) {
    try {
        const result = await tarefasPedagogicasService.listPedagogicosAtivos();
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function validarSugestaoPrazoLevantamentoCH(req, res, next) {
    try {
        const data = validarSugestaoPrazoLevantamentoCHSchema.parse(req.body);
        const result = await tarefasPedagogicasService.validarSugestaoPrazoLevantamentoCH(data);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function createTarefaPedagogica(req, res, next) {
    try {
        const data = createTarefaPedagogicaSchema.parse(req.body);
        const currentUserId = Number(req.user?.sub);

        const result = await tarefasPedagogicasService.createTarefaPedagogica(
            data,
            currentUserId
        );

        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function createTarefasPedagogicasEmLote(req, res, next) {
    try {
        const data = createTarefasPedagogicasLoteSchema.parse(req.body);
        const currentUserId = Number(req.user?.sub);

        const result = await tarefasPedagogicasService.createTarefasPedagogicasEmLote(
            data,
            currentUserId
        );

        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

export async function updateStatusTarefaPedagogica(req, res, next) {
    try {
        const { id } = tarefaPedagogicaIdParamSchema.parse(req.params);
        const { status } = updateStatusTarefaPedagogicaSchema.parse(req.body);

        const result = await tarefasPedagogicasService.updateStatusTarefaPedagogica(
            id,
            status
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

export async function deleteTarefaPedagogica(req, res, next) {
    try {
        const { id } = tarefaPedagogicaIdParamSchema.parse(req.params);
        const result = await tarefasPedagogicasService.deleteTarefaPedagogica(id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}