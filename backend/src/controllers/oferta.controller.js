import {
    createOfertaSchema,
    updateOfertaSchema,
    updateStatusSchema,
    updateInscricaoSchema,
} from "../schemas/oferta.schemas.js";

import * as service from "../services/oferta.service.js";

export async function createOferta(req, res, next) {
    try {
        const data = createOfertaSchema.parse(req.body);
        const oferta = await service.createOferta(data, req.user.id);
        res.status(201).json(oferta);
    } catch (err) {
        next(err);
    }
}

export async function listOfertas(req, res, next) {
    try {
        const ofertas = await service.listOfertas();
        res.json(ofertas);
    } catch (err) {
        next(err);
    }
}

export async function getOferta(req, res, next) {
    try {
        const id = Number(req.params.id);
        const oferta = await service.getOfertaById(id);
        res.json(oferta);
    } catch (err) {
        next(err);
    }
}

export async function updateOferta(req, res, next) {
    try {
        const id = Number(req.params.id);
        const data = updateOfertaSchema.parse(req.body);
        const oferta = await service.updateOferta(id, data);
        res.json(oferta);
    } catch (err) {
        next(err);
    }
}

export async function updateStatus(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { status } = updateStatusSchema.parse(req.body);
        const oferta = await service.updateStatus(id, status);
        res.json(oferta);
    } catch (err) {
        next(err);
    }
}

export async function inscrever(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);
        const inscricao = await service.inscreverUsuario(
            ofertaId,
            req.user
        );
        res.status(201).json(inscricao);
    } catch (err) {
        next(err);
    }
}

export async function listInscricoes(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);
        const oferta = await service.listInscricoesByOferta(ofertaId);
        res.json(oferta);
    } catch (err) {
        next(err);
    }
}

export async function updateInscricao(req, res, next) {
    try {
        const ofertaId = Number(req.params.id);
        const inscricaoId = Number(req.params.inscricaoId);
        const data = updateInscricaoSchema.parse(req.body);

        const inscricao = await service.updateInscricao(
            ofertaId,
            inscricaoId,
            data
        );

        res.json(inscricao);
    } catch (err) {
        next(err);
    }
}

export async function listOfertasDisponiveisMe(req, res, next) {
    try {
        const ofertas = await service.listOfertasDisponiveisParaUsuario(req.user);
        res.json(ofertas);
    } catch (err) {
        next(err);
    }
}

export async function listMinhasInscricoes(req, res, next) {
    try {
        const inscricoes = await service.listMinhasInscricoes(req.user.sub);
        res.json(inscricoes);
    } catch (err) {
        next(err);
    }
}

export async function listMinhasOfertasInstrutor(req, res, next) {
    try {
        const userId = Number(req.user.sub || req.user.id);
        const ofertas = await service.listOfertasDoInstrutor(userId);
        res.json(ofertas);
    } catch (err) {
        next(err);
    }
}