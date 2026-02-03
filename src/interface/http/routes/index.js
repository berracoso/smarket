/**
 * Agregador de Rotas
 * Centraliza todas as rotas da aplicação
 */

const authRoutes = require('./auth.routes');
const apostasRoutes = require('./apostas.routes');
const eventosRoutes = require('./eventos.routes');

module.exports = (controllers, middlewares) => {
    return {
        auth: authRoutes(
            controllers.authController,
            middlewares.authenticationMiddleware
        ),
        apostas: apostasRoutes(
            controllers.apostasController,
            middlewares.authenticationMiddleware,
            middlewares.authorizationMiddleware
        ),
        eventos: eventosRoutes(
            controllers.eventosController,
            middlewares.authenticationMiddleware,
            middlewares.authorizationMiddleware
        )
    };
};
