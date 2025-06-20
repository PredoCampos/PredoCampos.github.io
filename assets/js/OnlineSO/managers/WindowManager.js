/**
 * @file WindowManager.js
 * @description Gerencia o ciclo de vida das janelas, garantindo uma
 * animação de fade puro e estável.
 */
import { capitalize } from '../utils.js';
import { APP_ICONS } from '../config.js';

export class WindowManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.state = soInstance.state;
        this.animationDuration = 200; // Duração da animação de fade
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
            this._manageFocusAfterStateChange();
        }
    }

    /**
     * MUDANÇA: Lógica de minimizar refatorada para ser mais robusta.
     */
    minimize(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || app.minimized || app.isAnimating) return;

        app.isAnimating = true;
        const winEl = app.element;
        
        // Salva as dimensões atuais ANTES de minimizar, caso não estejam salvas.
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
        winEl.classList.add('minimized'); // Inicia a transição de opacidade
        winEl.classList.remove('focused');
        app.minimized = true;

        setTimeout(() => {
            winEl.style.display = 'none'; // Esconde o elemento após a animação
            winEl.classList.remove('window-animated');
            app.isAnimating = false;
            
            this._manageFocusAfterStateChange();
        }, this.animationDuration);

        this.so.taskManager.updateState();
    }

    /**
     * MUDANÇA: Lógica de restaurar refatorada para evitar animação de movimento.
     */
    restore(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || !app.minimized || app.isAnimating) return;

        app.isAnimating = true;
        const winEl = app.element;
        
        // Passo 1: Aplica a posição e o tamanho corretos ENQUANTO a janela está invisível.
        // Isso evita que o navegador tente animar a mudança de posição.
        if (app.maximized) {
            winEl.classList.add('maximized');
        } else if (app.originalRect) {
            winEl.classList.remove('maximized'); // Garante que não está maximizada
            winEl.style.top = app.originalRect.top;
            winEl.style.left = app.originalRect.left;
            winEl.style.width = app.originalRect.width;
            winEl.style.height = app.originalRect.height;
        }

        // Passo 2: Torna a janela visível, mas ainda transparente.
        winEl.style.display = 'flex';
        app.minimized = false;

        // Passo 3: Usa um pequeno timeout para garantir que o navegador processou os estilos acima.
        // Em seguida, adiciona as classes que acionarão a animação de FADE.
        setTimeout(() => {
            winEl.classList.add('window-animated');
            winEl.classList.remove('minimized'); // Aciona a transição de opacidade
            
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
            // Salva a posição antes de maximizar
            const windowRect = winEl.getBoundingClientRect();
            app.originalRect = {
                top: `${windowRect.top}px`,
                left: `${windowRect.left}px`,
                width: `${windowRect.width}px`,
                height: `${windowRect.height}px`
            };
            
            // Remove estilos inline para que a classe .maximized assuma
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
            // Foca na janela de maior z-index
            const topWindow = visibleWindows.reduce((top, current) => {
                return parseInt(current.element.style.zIndex) > parseInt(top.element.style.zIndex) ? current : top;
            });
            this.focus(topWindow.element.dataset.app);
        } else {
            // Se não houver janelas visíveis, apenas atualiza a taskbar
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
            <div class="window-content"></div>
        `;
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