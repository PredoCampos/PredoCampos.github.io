/**
 * @file WindowManager.js
 * @description Gerencia o ciclo de vida das janelas, com lógica de trava
 * para prevenir dupla instância e com feedback visual de carregamento.
 */
import { capitalize } from '../utils.js';
import { APP_ICONS } from '../config.js';

export class WindowManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.state = soInstance.state;
        this.animationDuration = 350;
        // MUDANÇA: Cache do elemento indicador para melhor performance
        this.loadIndicator = document.getElementById('app-load-indicator');
    }

    open(appName) {
        // MUDANÇA: Lógica de verificação e trava movida para o topo
        const existingApp = this.state.windows.abertas.get(appName);
        if (existingApp) {
            // Se o app já existe (mesmo que carregando ou minimizado),
            // a função interact decide o que fazer (focar, restaurar, etc).
            // Se estiver carregando, a `interact` não fará nada.
            this.interact(appName);
            return;
        }

        // --- Início do Processo de Abertura ---

        // 1. Trava o app, registrando-o como "carregando" para impedir dupla instância
        this.state.windows.abertas.set(appName, { status: 'loading' });

        // 2. Mostra o feedback visual de carregamento
        if (this.loadIndicator) this.loadIndicator.classList.remove('hidden');
        document.body.classList.add('app-loading'); // Mantém o cursor de espera

        const randomDelay = Math.random() * (1500 - 500) + 500;

        setTimeout(() => {
            // 3. Esconde o feedback visual
            if (this.loadIndicator) this.loadIndicator.classList.add('hidden');
            document.body.classList.remove('app-loading');

            // 4. Cria a janela e os dados completos do app
            const windowEl = this._createWindowElement(appName);
            const appData = {
                id: windowEl.id,
                element: windowEl,
                minimized: false,
                maximized: false,
                originalRect: null,
                isAnimating: false,
                status: 'loaded' // MUDANÇA: Define o status como carregado
            };

            // 5. Atualiza o app no mapa de estado com seus dados completos
            this.state.windows.abertas.set(appName, appData);

            // 6. Continua com o fluxo normal
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
        }
    }

    minimize(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || app.minimized || app.isAnimating) return;

        app.isAnimating = true;
        app.element.classList.add('window-animated');

        const taskbarButton = document.querySelector(`.taskbar-app[data-app="${appName}"]`);
        
        if (!app.maximized) {
            const windowRect = app.element.getBoundingClientRect();
            app.originalRect = {
                top: `${windowRect.top}px`,
                left: `${windowRect.left}px`,
                width: `${windowRect.width}px`,
                height: `${windowRect.height}px`,
            };
        }

        if (taskbarButton) {
            const buttonRect = taskbarButton.getBoundingClientRect();
            app.element.style.top = `${buttonRect.top + (buttonRect.height / 2)}px`;
            app.element.style.left = `${buttonRect.left + (buttonRect.width / 2)}px`;
            app.element.style.width = `0px`;
            app.element.style.height = `0px`;
        }

        app.element.classList.add('minimized');
        app.element.classList.remove('focused');
        app.minimized = true;

        setTimeout(() => {
            app.element.style.display = 'none';
            app.element.classList.remove('window-animated');
            app.isAnimating = false;
        }, this.animationDuration);

        this.so.taskManager.updateState();
    }

    restore(appName) {
        const app = this.state.windows.abertas.get(appName);
        if (!app || app.status === 'loading' || !app.minimized || app.isAnimating) return;

        app.isAnimating = true;
        
        const winEl = app.element;
        winEl.classList.add('window-animated');

        const taskbarButton = document.querySelector(`.taskbar-app[data-app="${appName}"]`);
        if (taskbarButton) {
            const buttonRect = taskbarButton.getBoundingClientRect();
            winEl.style.top = `${buttonRect.top + (buttonRect.height / 2)}px`;
            winEl.style.left = `${buttonRect.left + (buttonRect.width / 2)}px`;
            winEl.style.width = `0px`;
            winEl.style.height = `0px`;
        }
        
        winEl.style.display = 'flex';
        app.minimized = false;

        setTimeout(() => {
            winEl.classList.remove('minimized');

            if (app.maximized) {
                winEl.style.top = winEl.style.left = winEl.style.width = winEl.style.height = '';
                winEl.classList.add('maximized');
            } else if (app.originalRect) {
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

        // MUDANÇA: Verifica o status de carregando ou animando
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
            
            winEl.style.top = winEl.style.left = winEl.style.width = winEl.style.height = '';
            app.maximized = true;
            winEl.classList.add('maximized');
        }

        setTimeout(() => {
            winEl.classList.remove('window-animated');
            app.isAnimating = false;
        }, this.animationDuration);
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