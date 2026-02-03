/**
 * Domain Service: ValidadorPermissoes
 * Valida permissões de usuários baseado em seus tipos/roles
 * 
 * Hierarquia de Permissões:
 * - SuperAdmin: Pode gerenciar usuários e eventos, mas NÃO pode apostar
 * - Admin: Pode gerenciar eventos e apostar
 * - Usuario: Pode apenas apostar
 */

class ValidadorPermissoes {
    podeApostar(usuario) {
        // Super Admin não pode apostar
        return !usuario.isSuperAdmin;
    }

    podeGerenciarEventos(usuario) {
        return usuario.isAdmin || usuario.isSuperAdmin;
    }

    podeGerenciarUsuarios(usuario) {
        return usuario.isSuperAdmin;
    }

    podePromoverUsuario(usuarioPromovedor, usuarioAlvo) {
        // Apenas Super Admin pode promover
        if (!usuarioPromovedor.isSuperAdmin) {
            throw new Error('Apenas Super Admin pode promover usuários');
        }

        // Não pode promover Super Admin
        if (usuarioAlvo.isSuperAdmin) {
            throw new Error('Super Admin não pode ser promovido');
        }

        return true;
    }

    podeRebaixarUsuario(usuarioRebaixador, usuarioAlvo) {
        // Apenas Super Admin pode rebaixar
        if (!usuarioRebaixador.isSuperAdmin) {
            throw new Error('Apenas Super Admin pode rebaixar usuários');
        }

        // Não pode rebaixar Super Admin
        if (usuarioAlvo.isSuperAdmin) {
            throw new Error('Super Admin não pode ser rebaixado');
        }

        return true;
    }

    podeExcluirUsuario(usuarioExcluidor, usuarioAlvo) {
        // Apenas Super Admin pode excluir
        if (!usuarioExcluidor.isSuperAdmin) {
            throw new Error('Apenas Super Admin pode excluir usuários');
        }

        // Não pode excluir Super Admin
        if (usuarioAlvo.isSuperAdmin) {
            throw new Error('Super Admin não pode ser excluído');
        }

        // Não pode se auto-excluir
        if (usuarioExcluidor.id === usuarioAlvo.id) {
            throw new Error('Usuário não pode se auto-excluir');
        }

        return true;
    }

    validarAcaoEvento(usuario, acao) {
        const acoesPermitidas = ['abrir', 'fechar', 'definir_vencedor', 'resetar', 'criar'];
        
        if (!acoesPermitidas.includes(acao)) {
            throw new Error(`Ação inválida: ${acao}`);
        }

        if (!this.podeGerenciarEventos(usuario)) {
            throw new Error('Usuário não tem permissão para gerenciar eventos');
        }

        return true;
    }
}

module.exports = ValidadorPermissoes;
