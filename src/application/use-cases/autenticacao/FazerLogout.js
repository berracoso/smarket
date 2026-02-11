/**
 * Use Case: Fazer Logout
 * 
 * Simples caso de uso que retorna sucesso.
 * A destruição da sessão é responsabilidade da camada de Interface (Controller).
 */

class FazerLogout {
    /**
     * Executa o caso de uso
     * @returns {Promise<Object>} { sucesso: true, mensagem }
     */
    async executar() {
        return {
            sucesso: true,
            mensagem: 'Logout realizado com sucesso'
        };
    }
}

module.exports = FazerLogout;
