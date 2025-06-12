/**
 * @file WindowManager.js
 * @description Gerencia o ciclo de vida e as interações das janelas de aplicativos.
 */
import { capitalize } from '../utils.js'; 

export class WindowManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.state = soInstance.state;
    }

    /**
     * Abre um novo aplicativo ou foca se já estiver aberto.
     * @param {string} appName O nome do aplicativo.
     */
    open(appName) {
        if (this.state.windows.abertas.has(appName)) {
            this.focus(appName);
            return;
        }

        const windowEl = this._createWindowElement(appName);
        const appData = {
            id: windowEl.id,
            element: windowEl,
            minimized: false,
            maximized: false,
            originalRect: null
        };

        this.state.windows.abertas.set(appName, appData);
        this.so.taskManager.add(appName);
        this.so.appRunner.run(appName, windowEl.querySelector('.window-content'));
        this.focus(appName); // Foca a janela recém-aberta
        console.log(`Aplicativo '${appName}' aberto.`);
    }

    /**
     * Fecha um aplicativo.
     * @param {string} appName
     */
    close(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (app) {
            app.element.remove();
            this.state.windows.abertas.delete(appName);
            this.so.taskManager.remove(appName);
            console.log(`Aplicativo '${appName}' fechado.`);
        }
    }

    /**
     * Minimiza uma janela.
     * @param {string} appName
     */
    minimize(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (app && !app.minimized) {
            app.element.classList.add('minimized');
            app.element.classList.remove('focused');
            app.minimized = true;
            this.so.taskManager.updateState();
        }
    }

    /**
     * Restaura uma janela que estava minimizada.
     * @param {string} appName
     */
    restore(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (app && app.minimized) {
            app.element.classList.remove('minimized');
            app.minimized = false;
            this.focus(appName);
        }
    }
    
    /**
     * Ação de interação padrão (usada pelo mobile e taskbar).
     * Abre, ou foca, ou minimiza/restaura.
     * @param {string} appName
     */
    interact(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app) {
            this.open(appName);
        } else if (app.minimized) {
            this.restore(appName);
        } else {
            // Se a janela já está em foco, minimiza. Senão, foca.
            if (app.element.classList.contains('focused')) {
                this.minimize(appName);
            } else {
                this.focus(appName);
            }
        }
    }

    /**
     * Traz uma janela para a frente (foco).
     * @param {string} appName
     */
    focus(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (app && !app.minimized) {
            // Remove foco das outras janelas
            this.state.windows.abertas.forEach(a => a.element.classList.remove('focused'));
            // Adiciona foco e aumenta z-index
            app.element.classList.add('focused');
            app.element.style.zIndex = ++this.state.windows.zIndexAtual;
            this.so.taskManager.updateState();
        }
    }
    
    /**
     * Alterna o estado de maximização de uma janela.
     * @param {string} appName
     */
    toggleMaximize(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app) return;

        const winEl = app.element;
        if (app.maximized) {
            // Restaura
            const rect = app.originalRect;
            winEl.style.top = rect.top;
            winEl.style.left = rect.left;
            winEl.style.width = rect.width;
            winEl.style.height = rect.height;
            winEl.classList.remove('maximized');
            app.maximized = false;
        } else {
            // Maximiza
            app.originalRect = { top: winEl.style.top, left: winEl.style.left, width: winEl.style.width, height: winEl.style.height };
            const taskbarHeight = this.state.grid.taskbarHeight;
            winEl.style.top = '0px';
            winEl.style.left = '0px';
            winEl.style.width = '100vw';
            winEl.style.height = `calc(100vh - ${taskbarHeight}px)`;
            winEl.classList.add('maximized');
            app.maximized = true;
        }
    }

    /**
     * Cria o elemento DOM para uma nova janela com base nas configurações.
     * @private
     */
    _createWindowElement(appName) {
        const { selectors, window: winConfig } = this.config;
        const { windows: winState, device, grid } = this.state;

        const container = document.querySelector(selectors.windowsContainer);
        const windowId = `window-${winState.proximoId++}`;
        
        const winEl = document.createElement('div');
        winEl.className = 'window';
        winEl.id = windowId;
        winEl.dataset.app = appName;

        // Calcula tamanho e posição inicial
        let width = winConfig.defaultWidth;
        let height = winConfig.defaultHeight;
        if (device.isMobile) {
            width = Math.min(width, window.innerWidth - 40);
            height = Math.min(height, window.innerHeight - grid.taskbarHeight - 60);
        }
        const openWindowsCount = winState.abertas.size;
        const offset = openWindowsCount * winConfig.offsetIncrement;
        let x = ((window.innerWidth - width) / 2) + offset;
        let y = ((window.innerHeight - grid.taskbarHeight - height) / 2) + offset;
        
        // Previne que a janela saia da tela
        if (x + width > window.innerWidth || y + height > window.innerHeight - grid.taskbarHeight) {
            x = device.isMobile ? 20 : 40;
            y = device.isMobile ? 20 : 40;
        }
        winEl.style.left = `${x}px`;
        winEl.style.top = `${y}px`;
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;

        winEl.innerHTML = `
            <div class="window-header">
                <span class="window-title">${capitalize(appName)}</span>
                <div class="window-controls">
                    <button class="window-control minimize-btn" aria-label="Minimizar">_</button>
                    <button class="window-control maximize-btn" aria-label="Maximizar">□</button>
                    <button class="window-control close-btn" aria-label="Fechar">×</button>
                </div>
            </div>
            <div class="window-content"></div>`;
        
        container.appendChild(winEl);
        return winEl;
    }
}