/**
 * Entity: Usuario
 * Representa um usuário do sistema
 * 
 * Tipos de Usuário:
 * - usuario: Pode fazer apostas
 * - admin: Pode gerenciar eventos e fazer apostas
 * - superadmin: Pode gerenciar usuários e eventos, mas NÃO pode apostar
 */

const Email = require('../value-objects/Email');
const Senha = require('../value-objects/Senha');

class Usuario {
    constructor({ id, nome, email, senha, isAdmin = false, isSuperAdmin = false, tipo = 'usuario', criadoEm = null }) {
        this.id = id;
        this.nome = this._validarNome(nome);
        this.email = email instanceof Email ? email : new Email(email);
        this.senha = senha instanceof Senha ? senha : senha; // Senha pode ser hash (string) ou objeto
        this.isAdmin = isAdmin;
        this.isSuperAdmin = isSuperAdmin;
        this.tipo = this._determinarTipo(tipo, isAdmin, isSuperAdmin);
        this.criadoEm = criadoEm || new Date().toISOString();
    }

    _validarNome(nome) {
        if (!nome || typeof nome !== 'string') {
            throw new Error('Nome é obrigatório');
        }

        const nomeTrimmed = nome.trim();
        
        if (nomeTrimmed.length < 3) {
            throw new Error('Nome deve ter no mínimo 3 caracteres');
        }

        return nomeTrimmed;
    }

    _determinarTipo(tipo, isAdmin, isSuperAdmin) {
        if (isSuperAdmin) return 'superadmin';
        if (isAdmin) return 'admin';
        return 'usuario';
    }

    podeApostar() {
        return !this.isSuperAdmin;
    }

    podeGerenciarEventos() {
        return this.isAdmin || this.isSuperAdmin;
    }

    podeGerenciarUsuarios() {
        return this.isSuperAdmin;
    }

    promoverParaAdmin() {
        if (this.isSuperAdmin) {
            throw new Error('Super Admin não pode ser promovido');
        }
        this.isAdmin = true;
        this.tipo = 'admin';
    }

    rebaixarParaUsuario() {
        if (this.isSuperAdmin) {
            throw new Error('Super Admin não pode ser rebaixado');
        }
        this.isAdmin = false;
        this.tipo = 'usuario';
    }

    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            email: this.email.toString(),
            isAdmin: this.isAdmin,
            isSuperAdmin: this.isSuperAdmin,
            tipo: this.tipo,
            criadoEm: this.criadoEm
        };
    }
}

module.exports = Usuario;
