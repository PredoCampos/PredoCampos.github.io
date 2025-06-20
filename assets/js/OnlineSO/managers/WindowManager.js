/**
 * @file WindowManager.js
 * @description Gerencia o ciclo de vida das janelas, com pré-carregamento
 * de apps para uma experiência de usuário fluida.
 */
import { capitalize } from '../utils.js';
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
        if (this.state.windows.abertas.has(appName)) {
            this.interact(appName);
            return;
        }

        this.state.windows.abertas.set(appName, { status: 'loading' });
        if (this.loadIndicator) this.loadIndicator.classList.remove('hidden');
        document.body.classList.add('app-loading');

        const randomDelay = Math.random() * (1500 - 500) + 500;
        
        const delayPromise = new Promise(resolve => setTimeout(resolve, randomDelay));
        const appModulePromise = this.so.appRunner.load(appName);

        Promise.all([appModulePromise, delayPromise])
            .then(([appModule, _]) => {
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
                
                this.so.appRunner.run(appModule, windowEl.querySelector('.window-content'));
                
                this.so.taskManager.add(appName);
                this.focus(appName);
                console.log(`Aplicativo '${appName}' aberto após ${randomDelay.toFixed(0)}ms.`);
            })
            .catch(error => {
                console.error(`Não foi possível concluir a abertura de '${appName}':`, error);
                if (this.loadIndicator) this.loadIndicator.classList.add('hidden');
                document.body.classList.remove('app-loading');
                this.state.windows.abertas.delete(appName);
            });
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
    
    /**
     * MUDANÇA: Lógica corrigida para lidar corretamente com aplicativos que
     * ainda não foram abertos.
     * @param {string} appName 
     * @returns 
     */
    interact(appName) {
        const app = this.state.windows.abertas.get(appName);

        // 1. Se o aplicativo não existe no mapa de estado, chama open() para criá-lo.
        if (!app) {
            this.open(appName);
            return;
        }

        // 2. Se o aplicativo já existe, mas está carregando ou animando, não faz nada.
        if (app.status === 'loading' || app.isAnimating) {
            return;
        }

        // 3. Se o aplicativo existe e está estável, interage com ele (minimiza/restaura/foca).
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
    
    _createWindowElement(appName) {
        const { selectors } = this.config;
        const { windows: winState } = this.state;
        const container = document.querySelector(selectors.windowsContainer);
        const windowId = `window-${winState.proximoId++}`;
        const iconPath = (APP_ICONS[appName] || APP_ICONS.default).small;
        
        const winEl = this.so.uiFactory.createWindowElement(appName, iconPath, windowId);

        const { x, y, width, height } = this._calculateWindowInitialRect(appName);
        winEl.style.left = `${x}px`;
        winEl.style.top = `${y}px`;
        winEl.style.width = `${width}px`;
        winEl.style.height = `${height}px`;

        container.appendChild(winEl);
        return winEl;
    }

    _calculateWindowInitialRect(appName) {
        const { window: winConfig } = this.config;
        const { windows: winState, device, grid } = this.state;
        
        const appSpecificConfig = APP_CONFIG[appName];
        let width = appSpecificConfig?.defaultWidth || winConfig.defaultWidth;
        let height = appSpecificConfig?.defaultHeight || winConfig.defaultHeight;

        if (device.isMobile) {
            width = Math.min(width, window.innerWidth - 20);
            height = Math.min(height, window.innerHeight - grid.taskbarHeight - 40);
        }
        
        const openWindowsIndex = winState.abertas.size - 1; 
        let x, y;

        if (device.isMobile) {
            const startY = 15;
            const yIncrement = 25;
            
            x = (window.innerWidth - width) / 2;
            y = startY + (openWindowsIndex * yIncrement);

            y = Math.min(y, window.innerHeight - height - grid.taskbarHeight - 5);

        } else {
            if (openWindowsIndex === 0) {
                x = (window.innerWidth - width) / 2;
                y = 20;
            } else {
                const openWindows = Array.from(winState.abertas.values());
                const lastWindowApp = openWindows[openWindowsIndex - 1];

                if (lastWindowApp && lastWindowApp.element) {
                    const lastEl = lastWindowApp.element;
                    const lastX = parseInt(lastEl.style.left, 10);
                    const lastY = parseInt(lastEl.style.top, 10);
                    
                    x = lastX + winConfig.offsetIncrement;
                    y = lastY + winConfig.offsetIncrement;

                    if (x + width > window.innerWidth - 20 || y + height > window.innerHeight - grid.taskbarHeight - 20) {
                        x = 20;
                        y = 20;
                    }
                } else {
                    x = 20;
                    y = 20;
                }
            }
        }
        
        return { x, y, width, height };
    }
}