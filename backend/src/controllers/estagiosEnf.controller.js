import * as service from "../services/estagiosEnf.service.js";

function getErrorMessage(error) {
    if (error instanceof Error) return error.message;
    return "Erro interno do servidor.";
}

export async function listBlocosPadrao(req, res, next) {
    try {
        const blocos = service.listarBlocosPadraoEnfermagem();
        res.json(blocos);
    } catch (error) {
        next(error);
    }
}

export async function createCampo(req, res, next) {
    try {
        const campo = await service.createCampo(req.body);
        res.status(201).json(campo);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function listCampos(req, res, next) {
    try {
        const campos = await service.listCampos();
        res.json(campos);
    } catch (error) {
        next(error);
    }
}

export async function getGrupoById(req, res, next) {
    try {
        const grupo = await service.getGrupoById(req.params.grupoId);
        res.json(grupo);
    } catch (error) {
        error.status = 404;
        next(error);
    }
}

export async function createBloco(req, res, next) {
    try {
        const bloco = await service.createBloco(req.body);
        res.status(201).json(bloco);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function listBlocos(req, res, next) {
    try {
        const blocos = await service.listBlocos();
        res.json(blocos);
    } catch (error) {
        next(error);
    }
}

export async function getBlocoById(req, res, next) {
    try {
        const bloco = await service.getBlocoById(req.params.id);
        res.json(bloco);
    } catch (error) {
        error.status = 404;
        next(error);
    }
}

export async function updateBloco(req, res, next) {
    try {
        const bloco = await service.updateBloco(req.params.id, req.body);
        res.json(bloco);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function deleteBloco(req, res, next) {
    try {
        const result = await service.deleteBloco(req.params.id);
        res.json({
            message: "Bloco removido com sucesso.",
            data: result,
        });
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function addCampoToBloco(req, res, next) {
    try {
        const result = await service.addCampoToBloco(req.params.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function removeCampoFromBloco(req, res, next) {
    try {
        const result = await service.removeCampoFromBloco(
            req.params.id,
            req.params.campoVinculoId
        );

        res.json({
            message: "Campo removido do bloco com sucesso.",
            data: result,
        });
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function listCamposDoBloco(req, res, next) {
    try {
        const campos = await service.listCamposDoBloco(req.params.id);
        res.json(campos);
    } catch (error) {
        error.status = 404;
        next(error);
    }
}

export async function createGrupo(req, res, next) {
    try {
        const grupo = await service.createGrupo(req.params.id, req.body);
        res.status(201).json(grupo);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function updateGrupo(req, res, next) {
    try {
        const grupo = await service.updateGrupo(req.params.grupoId, req.body);
        res.json(grupo);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function deleteGrupo(req, res, next) {
    try {
        const result = await service.deleteGrupo(req.params.grupoId);
        res.json({
            message: "Grupo removido com sucesso.",
            data: result,
        });
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function listGruposDoBloco(req, res, next) {
    try {
        const grupos = await service.listGruposDoBloco(req.params.id);
        res.json(grupos);
    } catch (error) {
        error.status = 404;
        next(error);
    }
}

export async function addAlunoToGrupo(req, res, next) {
    try {
        const { alunoId } = req.body;

        const result = await service.addAlunoToGrupo(req.params.grupoId, alunoId);

        res.status(201).json(result);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function removeAlunoFromGrupo(req, res, next) {
    try {
        const result = await service.removeAlunoFromGrupo(
            req.params.grupoId,
            req.params.alunoId
        );

        res.json({
            message: "Aluno removido do grupo com sucesso.",
            data: result,
        });
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function listAlunosDoGrupo(req, res, next) {
    try {
        const alunos = await service.listAlunosDoGrupo(req.params.grupoId);
        res.json(alunos);
    } catch (error) {
        error.status = 404;
        next(error);
    }
}

export async function listAlunosDisponiveisPorBloco(req, res, next) {
    try {
        const alunos = await service.listAlunosDisponiveisPorBloco(req.params.id);
        res.json(alunos);
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export function estagiosEnfErrorHandler(error, req, res, next) {
    const status = error.status || 500;
    const message = getErrorMessage(error);

    res.status(status).json({
        error: message,
    });
}

export async function listRotacoesDoBloco(req, res, next) {
    try {
        const rotacoes = await service.listRotacoesDoBloco(req.params.id);
        res.json(rotacoes);
    } catch (error) {
        error.status = 404;
        next(error);
    }
}

export async function gerarRodizioAutomatico(req, res, next) {
    try {
        const rotacoes = await service.gerarRodizioAutomatico(req.params.id);
        res.json({
            message: "Rodízio gerado com sucesso.",
            data: rotacoes,
        });
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function deleteRotacoesDoBloco(req, res, next) {
    try {
        const result = await service.deleteRotacoesDoBloco(req.params.id);
        res.json({
            message: "Rodízios removidos com sucesso.",
            data: result,
        });
    } catch (error) {
        error.status = 400;
        next(error);
    }
}

export async function getMeuEstagio(req, res, next) {
    try {
        const alunoId = Number(req.user?.id);

        console.log("ALUNO LOGADO ID:", alunoId);
        console.log("REQ.USER:", req.user);

        if (!alunoId) {
            return res.status(401).json({ error: "Usuário não autenticado." });
        }

        const result = await service.getMeuEstagio(alunoId);
        res.json(result);
    } catch (error) {
        console.error("ERRO getMeuEstagio:", error);
        error.status = 400;
        next(error);
    }
}

export async function listSupervisoresCampo(req, res, next) {
    try {
        const supervisores = await service.listSupervisoresCampo();
        res.json(supervisores);
    } catch (error) {
        next(error);
    }
}