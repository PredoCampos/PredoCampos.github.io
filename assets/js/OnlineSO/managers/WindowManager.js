/**
 * @file WindowManager.js
 * @description Gerencia o ciclo de vida das janelas, com a animação de
 * minimizar/restaurar e com gerenciamento de foco automático.
 */
import { capitalize } from '../utils.js';
import { APP_ICONS } from '../config.js';

export class WindowManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.state = soInstance.state;
        this.animationDuration = 350;
        this.loadIndicator = document.getElementById('app-load-indicator');
    }

    open(appName) {
        const existingApp = this.state.windows.abertas.get(appName);
        if (existingApp) {
            this.interact(appName);
            return;
        }

        this.state.windows.abertas.set(appName, { status: 'loading' });

        if (this.loadIndicator) this.loadIndicator.classList.remove('hidden');
        document.body.classList.add('app-loading');

        const randomDelay = Math.random() * (1500 - 500) + 500;

        setTimeout(() => {
            if (this.loadIndicator) this.loadIndicator.classList.add('hidden');
            document.body.classList.remove('app-loading');

            const windowEl = this._createWindowElement(appName);
            const appData = {
                id: windowEl.id,
                element: windowEl,
                minimized: false,
                maximized: false,
                originalRect: null,
                isAnimating: false,
                status: 'loaded'
            };

            this.state.windows.abertas.set(appName, appData);

            this.so.taskManager.add(appName);
            this.so.appRunner.run(appName, windowEl.querySelector('.window-content'));
            this.focus(appName);
            console.log(`Aplicativo '${appName}' aberto após ${randomDelay.toFixed(0)}ms.`);

        }, randomDelay);
    }

    close(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (app && app.status !== 'loading') {
            app.element.remove();
            this.state.windows.abertas.delete(appName);
            this.so.taskManager.remove(appName);
            console.log(`Aplicativo '${appName}' fechado.`);

            // MUDANÇA: Chama a função para gerenciar o foco
            this._manageFocusAfterStateChange();
        }
    }

    minimize(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || app.minimized || app.isAnimating) return;
    
        app.isAnimating = true;
        const winEl = app.element;
    
        const windowRect = winEl.getBoundingClientRect();
        app.originalRect = {
            top: `${windowRect.top}px`,
            left: `${windowRect.left}px`,
            width: `${windowRect.width}px`,
            height: `${windowRect.height}px`,
        };
    
        winEl.classList.add('window-animated');
        winEl.classList.add('minimized');
    
        const taskbarButton = document.querySelector(`.taskbar-app[data-app="${appName}"]`);
        if (taskbarButton) {
            const buttonRect = taskbarButton.getBoundingClientRect();
            winEl.style.top = `${buttonRect.top + buttonRect.height / 2}px`;
            winEl.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
            winEl.style.width = `0px`;
            winEl.style.height = `0px`;
        } else {
            winEl.style.width = `0px`;
            winEl.style.height = `0px`;
        }
    
        winEl.classList.remove('focused');
        
        setTimeout(() => {
            winEl.style.display = 'none';
            app.minimized = true;
            app.isAnimating = false;
            winEl.classList.remove('window-animated');
            winEl.style.top = winEl.style.left = winEl.style.width = winEl.style.height = '';
            
            // MUDANÇA: Chama a função para gerenciar o foco
            this._manageFocusAfterStateChange();
        }, this.animationDuration);
    
        this.so.taskManager.updateState();
    }

    restore(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || !app.minimized || app.isAnimating) return;
    
        app.isAnimating = true;
        const winEl = app.element;
        
        const taskbarButton = document.querySelector(`.taskbar-app[data-app="${appName}"]`);
        if (taskbarButton) {
            const buttonRect = taskbarButton.getBoundingClientRect();
            winEl.style.top = `${buttonRect.top + buttonRect.height / 2}px`;
            winEl.style.left = `${buttonRect.left + buttonRect.width / 2}px`;
            winEl.style.width = `0px`;
            winEl.style.height = `0px`;
        }
        
        winEl.style.display = 'flex';
        app.minimized = false;
    
        setTimeout(() => {
            winEl.classList.add('window-animated');
            winEl.classList.remove('minimized');
            
            if (app.originalRect) {
                winEl.style.top = app.originalRect.top;
                winEl.style.left = app.originalRect.left;
                winEl.style.width = app.originalRect.width;
                winEl.style.height = app.originalRect.height;
            }
            this.focus(appName);
    
            setTimeout(() => {
                winEl.classList.remove('window-animated');
                app.isAnimating = false;
            }, this.animationDuration);
        }, 20);
    }
    
    interact(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app) {
            this.open(appName);
            return;
        }

        if (app.status === 'loading' || app.isAnimating) {
            return;
        }

        if (app.minimized) {
            this.restore(appName);
        } else {
            if (app.element.classList.contains('focused')) {
                this.minimize(appName);
            } else {
                this.focus(appName);
            }
        }
    }

    focus(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (app && app.status !== 'loading' && !app.minimized) {
            this.state.windows.abertas.forEach(a => {
                if (a.element) a.element.classList.remove('focused');
            });
            app.element.classList.add('focused');
            app.element.style.zIndex = ++this.state.windows.zIndexAtual;
            this.so.taskManager.updateState();
        }
    }
    
    toggleMaximize(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || app.isAnimating) return;

        app.isAnimating = true;
        const winEl = app.element;
        winEl.classList.add('window-animated');

        if (app.maximized) {
            app.maximized = false;
            winEl.classList.remove('maximized');
            if (app.originalRect) {
                winEl.style.top = app.originalRect.top;
                winEl.style.left = app.originalRect.left;
                winEl.style.width = app.originalRect.width;
                winEl.style.height = app.originalRect.height;
            }
        } else {
            const windowRect = winEl.getBoundingClientRect();
            app.originalRect = {
                top: `${windowRect.top}px`,
                left: `${windowRect.left}px`,
                width: `${windowRect.width}px`,
                height: `${windowRect.height}px`
            };
            
            winEl.style.top = '';
            winEl.style.left = '';
            winEl.style.width = '';
            winEl.style.height = '';
            app.maximized = true;
            winEl.classList.add('maximized');
        }

        setTimeout(() => {
            winEl.classList.remove('window-animated');
            app.isAnimating = false;
        }, this.animationDuration);
    }

    /**
     * MUDANÇA: Nova função auxiliar para gerenciar o foco.
     */
    _manageFocusAfterStateChange() {
        // Converte o Map de janelas abertas em um array
        const openWindows = Array.from(this.state.windows.abertas.values());

        // Filtra para encontrar apenas as janelas que não estão minimizadas
        const visibleWindows = openWindows.filter(app => app.status === 'loaded' && !app.minimized);

        // Se sobrar exatamente uma janela visível, ela recebe o foco.
        if (visibleWindows.length === 1) {
            const appToFocus = visibleWindows[0];
            const appNameToFocus = appToFocus.element.dataset.app;
            console.log(`Foco automático direcionado para: ${appNameToFocus}`);
            this.focus(appNameToFocus);
        } else if (visibleWindows.length === 0) {
            // Se não houver janelas visíveis, atualiza a taskbar para remover qualquer estado 'active'
            this.so.taskManager.updateState();
        }
    }

    _createWindowElement(appName) {
        const { selectors } = this.config;
        const { windows: winState } = this.state;
        const container = document.querySelector(selectors.windowsContainer);
        const windowId = `window-${winState.proximoId++}`;
        const winEl = document.createElement('div');
        winEl.className = 'window';
        winEl.id = windowId;
        winEl.dataset.app = appName;
        const { x, y, width, height } = this._calculateWindowInitialRect();
        winEl.style.left = `${x}px`;
        winEl.style.top = `${y}px`;
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;
        const iconPath = (APP_ICONS[appName] || APP_ICONS.default).small;
        winEl.innerHTML = `
            <div class="window-header">
                <div class="window-header-title-group">
                    <img src="${iconPath}" alt="${appName} icon" class="window-header-icon">
                    <span class="window-title">${capitalize(appName)}</span>
                </div>
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

    _calculateWindowInitialRect() {
        const { window: winConfig } = this.config;
        const { windows: winState, device, grid } = this.state;
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
        if (x + width > window.innerWidth || y + height > window.innerHeight - grid.taskbarHeight) {
            x = device.isMobile ? 20 : 40;
            y = device.isMobile ? 20 : 40;
        }
        return { x, y, width, height };
    }
}