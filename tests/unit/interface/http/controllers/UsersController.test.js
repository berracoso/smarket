const UsersController = require('../../../../../src/interface/http/controllers/UsersController');

describe('UsersController', () => {
    let usersController;
    let mockListarUsuariosUseCase;
    let mockPromoverUsuarioUseCase;
    let mockRebaixarUsuarioUseCase;
    let req;
    let res;
    let next;

    beforeEach(() => {
        // Mocks dos use cases
        mockListarUsuariosUseCase = { executar: jest.fn() };
        mockPromoverUsuarioUseCase = { executar: jest.fn() };
        mockRebaixarUsuarioUseCase = { executar: jest.fn() };

        usersController = new UsersController(
            mockListarUsuariosUseCase,
            mockPromoverUsuarioUseCase,
            mockRebaixarUsuarioUseCase
        );

        // Mocks de req, res, next
        req = {
            params: {},
            body: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('listar', () => {
        it('deve retornar usuários com status 200', async () => {
            const resultadoMock = { sucesso: true, usuarios: [] };
            mockListarUsuariosUseCase.executar.mockResolvedValue(resultadoMock);

            await usersController.listar(req, res, next);

            expect(mockListarUsuariosUseCase.executar).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(resultadoMock);
        });

        it('deve chamar next(erro) se use case falhar', async () => {
            const erro = new Error('Erro interno');
            mockListarUsuariosUseCase.executar.mockRejectedValue(erro);

            await usersController.listar(req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
        });
    });

    describe('promover', () => {
        it('deve promover usuário com sucesso', async () => {
            req.params.id = '2';
            const resultadoMock = { sucesso: true, mensagem: 'OK' };
            mockPromoverUsuarioUseCase.executar.mockResolvedValue(resultadoMock);

            await usersController.promover(req, res, next);

            expect(mockPromoverUsuarioUseCase.executar).toHaveBeenCalledWith({ userId: 2 });
            expect(res.json).toHaveBeenCalledWith(resultadoMock);
        });

        it('deve retornar erro 400 se ID inválido', async () => {
            req.params.id = 'abc';

            await usersController.promover(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ erro: 'ID inválido' });
            expect(mockPromoverUsuarioUseCase.executar).not.toHaveBeenCalled();
        });

        it('deve retornar erro 400 se use case retornar falha', async () => {
            req.params.id = '2';
            const resultadoMock = { sucesso: false, erro: 'Usuário não encontrado' };
            mockPromoverUsuarioUseCase.executar.mockResolvedValue(resultadoMock);

            await usersController.promover(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(resultadoMock);
        });
        it('deve chamar next(erro) se use case lançar exceção', async () => {
            req.params.id = '2';
            const erro = new Error('Erro interno');
            mockPromoverUsuarioUseCase.executar.mockRejectedValue(erro);

            await usersController.promover(req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
        });
    });

    describe('rebaixar', () => {
        it('deve rebaixar usuário com sucesso', async () => {
            req.params.id = '2';
            const resultadoMock = { sucesso: true, mensagem: 'OK' };
            mockRebaixarUsuarioUseCase.executar.mockResolvedValue(resultadoMock);

            await usersController.rebaixar(req, res, next);

            expect(mockRebaixarUsuarioUseCase.executar).toHaveBeenCalledWith({ userId: 2 });
            expect(res.json).toHaveBeenCalledWith(resultadoMock);
        });

        it('deve retornar erro 400 se ID inválido', async () => {
            req.params.id = 'abc';

            await usersController.rebaixar(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ erro: 'ID inválido' });
            expect(mockRebaixarUsuarioUseCase.executar).not.toHaveBeenCalled();
        });

        it('deve retornar erro 400 se use case retornar falha', async () => {
            req.params.id = '2';
            const resultadoMock = { sucesso: false, erro: 'Usuário não encontrado' };
            mockRebaixarUsuarioUseCase.executar.mockResolvedValue(resultadoMock);

            await usersController.rebaixar(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(resultadoMock);
        });

        it('deve chamar next(erro) se use case lançar exceção', async () => {
            req.params.id = '2';
            const erro = new Error('Erro interno');
            mockRebaixarUsuarioUseCase.executar.mockRejectedValue(erro);

            await usersController.rebaixar(req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
        });
    });
});
