/**
 * @file UIFactory.js
 * @description Fábrica dedicada a criar elementos de UI complexos,
 * como janelas, de forma isolada e reutilizável.
 */

export class UIFactory {
    constructor() {}

    /**
     * Cria o elemento DOM para uma nova janela.
     * @param {string} appName - O nome do aplicativo.
     * @param {string} iconPath - O caminho para o ícone da janela.
     * @param {string} windowId - O ID a ser atribuído ao elemento da janela.
     * @returns {HTMLElement} O elemento da janela construído.
     */
    createWindowElement(appName, iconPath, windowId) {
        const winEl = document.createElement('div');
        winEl.className = 'window';
        winEl.id = windowId;
        winEl.dataset.app = appName;

        winEl.innerHTML = `
            <div class="window-header">
                <div class="window-header-title-group">
                    <img src="${iconPath}" alt="${appName} icon" class="window-header-icon">
                    <span class="window-title">${appName.charAt(0).toUpperCase() + appName.slice(1)}</span>
                </div>
                <div class="window-controls">
                    <button class="window-control minimize-btn" aria-label="Minimizar">_</button>
                    <button class="window-control maximize-btn" aria-label="Maximizar">□</button>
                    <button class="window-control close-btn" aria-label="Fechar">×</button>
                </div>
            </div>
            <div class="window-content"></div>
        `;
        return winEl;
    }
}