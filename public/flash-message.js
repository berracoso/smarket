/**
 * Sistema de Flash Messages (Toast Notifications)
 * Substitui window.alert() por notificações personalizadas
 */

class FlashMessage {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Criar container se não existir
        if (!document.getElementById('flash-container')) {
            this.container = document.createElement('div');
            this.container.id = 'flash-container';
            this.container.className = 'flash-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('flash-container');
        }
    }

    /**
     * Exibir mensagem flash
     * @param {string} message - Texto da mensagem
     * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duração em ms (padrão: 5000)
     */
    show(message, type = 'info', duration = 5000) {
        const flash = document.createElement('div');
        flash.className = `flash-message flash-${type}`;

        // Ícone baseado no tipo
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        flash.innerHTML = `
            <div class="flash-icon">${icons[type] || icons.info}</div>
            <div class="flash-content">${message}</div>
            <button class="flash-close" onclick="this.parentElement.remove()">×</button>
        `;

        this.container.appendChild(flash);

        // Animação de entrada
        setTimeout(() => {
            flash.classList.add('flash-show');
        }, 10);

        // Auto-remover após duração
        if (duration > 0) {
            setTimeout(() => {
                this.remove(flash);
            }, duration);
        }

        return flash;
    }

    remove(flash) {
        flash.classList.remove('flash-show');
        flash.classList.add('flash-hide');
        setTimeout(() => {
            if (flash.parentElement) {
                flash.remove();
            }
        }, 300);
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Instância global
const flashMessage = new FlashMessage();

// Atalhos globais para facilitar uso
window.showSuccess = (msg, duration) => flashMessage.success(msg, duration);
window.showError = (msg, duration) => flashMessage.error(msg, duration);
window.showWarning = (msg, duration) => flashMessage.warning(msg, duration);
window.showInfo = (msg, duration) => flashMessage.info(msg, duration);

/**
 * Sistema de Confirmação Modal (substitui window.confirm)
 */
class ConfirmModal {
    constructor() {
        this.modal = null;
        this.resolveCallback = null;
        this.init();
    }

    init() {
        // Criar modal se não existir
        if (!document.getElementById('confirm-modal')) {
            this.modal = document.createElement('div');
            this.modal.id = 'confirm-modal';
            this.modal.className = 'confirm-modal';
            this.modal.innerHTML = `
                <div class="confirm-overlay"></div>
                <div class="confirm-dialog">
                    <div class="confirm-icon"></div>
                    <div class="confirm-title"></div>
                    <div class="confirm-message"></div>
                    <div class="confirm-buttons">
                        <button class="confirm-btn confirm-btn-cancel">Cancelar</button>
                        <button class="confirm-btn confirm-btn-confirm">Confirmar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(this.modal);

            // Event listeners
            this.modal.querySelector('.confirm-overlay').addEventListener('click', () => this.resolve(false));
            this.modal.querySelector('.confirm-btn-cancel').addEventListener('click', () => this.resolve(false));
            this.modal.querySelector('.confirm-btn-confirm').addEventListener('click', () => this.resolve(true));
        } else {
            this.modal = document.getElementById('confirm-modal');
        }
    }

    /**
     * Exibir modal de confirmação
     * @param {string} message - Mensagem principal
     * @param {object} options - Opções de customização
     * @returns {Promise<boolean>}
     */
    show(message, options = {}) {
        const {
            title = 'Confirmação',
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            type = 'warning', // 'warning', 'danger', 'info', 'success'
            icon = '⚠️'
        } = options;

        return new Promise((resolve) => {
            this.resolveCallback = resolve;

            // Atualizar conteúdo
            this.modal.querySelector('.confirm-icon').textContent = icon;
            this.modal.querySelector('.confirm-title').textContent = title;
            this.modal.querySelector('.confirm-message').innerHTML = message.replace(/\n/g, '<br>');
            this.modal.querySelector('.confirm-btn-confirm').textContent = confirmText;
            this.modal.querySelector('.confirm-btn-cancel').textContent = cancelText;

            // Aplicar tipo
            const dialog = this.modal.querySelector('.confirm-dialog');
            dialog.className = `confirm-dialog confirm-${type}`;

            // Mostrar modal
            this.modal.classList.add('confirm-show');

            // Focar no botão de cancelar para segurança
            setTimeout(() => {
                this.modal.querySelector('.confirm-btn-cancel').focus();
            }, 100);
        });
    }

    resolve(value) {
        // Esconder modal
        this.modal.classList.remove('confirm-show');

        // Chamar callback
        if (this.resolveCallback) {
            this.resolveCallback(value);
            this.resolveCallback = null;
        }
    }

    // Atalhos para tipos específicos
    warning(message, options = {}) {
        return this.show(message, { ...options, type: 'warning', icon: '⚠️' });
    }

    danger(message, options = {}) {
        return this.show(message, { ...options, type: 'danger', icon: '🚨' });
    }

    info(message, options = {}) {
        return this.show(message, { ...options, type: 'info', icon: 'ℹ️' });
    }

    success(message, options = {}) {
        return this.show(message, { ...options, type: 'success', icon: '✓' });
    }
}

// Instância global de confirmação
const confirmModal = new ConfirmModal();

// Atalho global para substituir window.confirm
window.showConfirm = (message, options) => confirmModal.show(message, options);
window.confirmWarning = (message, options) => confirmModal.warning(message, options);
window.confirmDanger = (message, options) => confirmModal.danger(message, options);
window.confirmInfo = (message, options) => confirmModal.info(message, options);
