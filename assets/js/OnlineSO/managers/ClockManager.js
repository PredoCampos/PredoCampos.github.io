/**
 * @file ClockManager.js
 * @description Gerenciador dedicado para o ciclo de vida e atualização
 * do relógio da barra de tarefas.
 */

export class ClockManager {
    /**
     * @param {object} soInstance - A instância principal do Sistema Operacional.
     */
    constructor(soInstance) {
        this.config = soInstance.config;
        this.clockElement = document.querySelector(this.config.selectors.taskbarClock);
        this.dateElement = document.querySelector(this.config.selectors.taskbarData);
        this.intervalId = null;
    }

    /**
     * Inicia a atualização periódica do relógio.
     */
    start() {
        if (!this.clockElement || !this.dateElement) {
            console.warn("Elementos de relógio ou data não encontrados na taskbar. O ClockManager não será iniciado.");
            return;
        }

        this._updateDateTime(); // Atualiza imediatamente ao iniciar
        
        // Define um intervalo para atualizar o relógio a cada 30 segundos
        this.intervalId = setInterval(() => this._updateDateTime(), 30000);
    }

    /**
     * Para a atualização do relógio.
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }

    /**
     * Método privado que busca a data/hora atual e atualiza o DOM.
     */
    _updateDateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        this.clockElement.textContent = `${hours}:${minutes}`;

        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        this.dateElement.textContent = `${day}/${month}/${year}`;
    }
}