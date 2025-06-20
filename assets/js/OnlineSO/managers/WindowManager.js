/**
 * @file WindowManager.js
 * @description Gerencia o ciclo de vida das janelas, agora com suporte a
 * dimensões personalizadas e posicionamento inteligente.
 */
import { capitalize } from '../utils.js';
// MUDANÇA: Importa as configurações dos apps e ícones.
import { APP_ICONS, APP_CONFIG } from '../config.js';

export class WindowManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.state = soInstance.state;
        this.animationDuration = 280;
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

    // ... (os métodos close, minimize, restore, interact, focus, toggleMaximize, _manageFocusAfterStateChange permanecem os mesmos) ...
    close(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (app && app.status !== 'loading') {
            app.element.remove();
            this.state.windows.abertas.delete(appName);
            this.so.taskManager.remove(appName);
            console.log(`Aplicativo '${appName}' fechado.`);
            this._manageFocusAfterStateChange();
        }
    }

    minimize(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || app.minimized || app.isAnimating) return;

        app.isAnimating = true;
        const winEl = app.element;
        
        if (!app.maximized) {
            const windowRect = winEl.getBoundingClientRect();
            app.originalRect = {
                top: `${windowRect.top}px`,
                left: `${windowRect.left}px`,
                width: `${windowRect.width}px`,
                height: `${windowRect.height}px`,
            };
        }

        winEl.classList.add('window-animated');
        winEl.classList.add('minimized');
        winEl.classList.remove('focused');
        app.minimized = true;

        setTimeout(() => {
            winEl.style.display = 'none';
            winEl.classList.remove('window-animated');
            app.isAnimating = false;
            
            this._manageFocusAfterStateChange();
        }, this.animationDuration);

        this.so.taskManager.updateState();
    }

    restore(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || !app.minimized || app.isAnimating) return;

        app.isAnimating = true;
        const winEl = app.element;
        
        if (app.maximized) {
            winEl.classList.add('maximized');
        } else if (app.originalRect) {
            winEl.classList.remove('maximized');
            winEl.style.top = app.originalRect.top;
            winEl.style.left = app.originalRect.left;
            winEl.style.width = app.originalRect.width;
            winEl.style.height = app.originalRect.height;
        }

        winEl.style.display = 'flex';
        app.minimized = false;

        setTimeout(() => {
            winEl.classList.add('window-animated');
            winEl.classList.remove('minimized');
            
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

    _manageFocusAfterStateChange() {
        const openWindows = Array.from(this.state.windows.abertas.values());
        const visibleWindows = openWindows.filter(app => app.status === 'loaded' && !app.minimized);
        
        if (visibleWindows.length > 0) {
            const topWindow = visibleWindows.reduce((top, current) => {
                return parseInt(current.element.style.zIndex) > parseInt(top.element.style.zIndex) ? current : top;
            });
            this.focus(topWindow.element.dataset.app);
        } else {
            this.so.taskManager.updateState();
        }
    }
    
    /**
     * MUDANÇA: O método agora usa a UIFactory para criar o elemento da janela
     * e depois apenas calcula sua posição e tamanho.
     */
    _createWindowElement(appName) {
        const { selectors } = this.config;
        const { windows: winState } = this.state;
        const container = document.querySelector(selectors.windowsContainer);
        const windowId = `window-${winState.proximoId++}`;
        const iconPath = (APP_ICONS[appName] || APP_ICONS.default).small;
        
        // Delega a criação do HTML para a fábrica
        const winEl = this.so.uiFactory.createWindowElement(appName, iconPath, windowId);

        // Calcula a posição e o tamanho iniciais
        const { x, y, width, height } = this._calculateWindowInitialRect(appName);
        winEl.style.left = `${x}px`;
        winEl.style.top = `${y}px`;
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;

        container.appendChild(winEl);
        return winEl;
    }

    /**
     * MUDANÇA: Método reescrito para usar dimensões personalizadas e implementar
     * a nova lógica de posicionamento para desktop vs. mobile.
     * @param {string} appName - O nome do aplicativo sendo aberto.
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    _calculateWindowInitialRect(appName) {
        const { window: winConfig } = this.config;
        const { windows: winState, device, grid } = this.state;
        
        // Passo 1: Obter dimensões (customizadas ou padrão)
        const appSpecificConfig = APP_CONFIG[appName];
        let width = appSpecificConfig?.defaultWidth || winConfig.defaultWidth;
        let height = appSpecificConfig?.defaultHeight || winConfig.defaultHeight;

        // Ajusta o tamanho para caber na tela do mobile, se necessário
        if (device.isMobile) {
            width = Math.min(width, window.innerWidth - 20);
            height = Math.min(height, window.innerHeight - grid.taskbarHeight - 40);
        }
        
        // Passo 2: Calcular a posição com base no dispositivo
        const openWindowsCount = winState.abertas.size;
        let x, y;

        if (device.isMobile) {
            // Lógica de "caminhada" para mobile
            const startX = (window.innerWidth - width) / 2;
            const startY = 20;
            const xIncrement = 30;
            const yIncrement = 40;
            
            if (openWindowsCount === 0) {
                x = startX;
                y = startY;
            } else {
                y = startY + (openWindowsCount * yIncrement);
                // Alterna entre esquerda e direita a cada nova janela
                if (openWindowsCount % 2 === 1) {
                    x = startX - xIncrement; // Ímpar: Esquerda
                } else {
                    x = startX + xIncrement; // Par: Direita
                }
            }
            // Garante que a janela não saia completamente da tela
            x = Math.max(5, Math.min(x, window.innerWidth - width - 5));
            y = Math.max(5, Math.min(y, window.innerHeight - height - grid.taskbarHeight - 5));

        } else {
            // Lógica de "escada" (cascade) para desktop
            const MAX_CASCADE_STEPS = 8;
            const cascadeStep = openWindowsCount % MAX_CASCADE_STEPS;
            const offset = cascadeStep * winConfig.offsetIncrement;
            
            x = ((window.innerWidth - width) / 2) + offset;
            y = ((window.innerHeight - grid.taskbarHeight - height) / 2) + offset;
        }
        
        return { x, y, width, height };
    }
}