/**
 * @file MobileInteractions.js
 * @description Lida com interações de TOQUE, herdando a lógica comum de BaseInteractions.
 */

import { BaseInteractions } from './BaseInteractions.js';

export class MobileInteractions extends BaseInteractions {
    constructor(soInstance) {
        super(soInstance); // Chama o construtor da classe pai
    }

    /**
     * Inicializa os listeners específicos para mobile.
     */
    initialize() {
        super.initialize(); // Executa a inicialização comum da classe pai

        document.querySelectorAll('.desktop-icon').forEach(icon => this._setupIconListeners(icon));

        const startButton = document.querySelector(this.so.config.selectors.menuButton);
        if (startButton) {
            startButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mm.toggle();
            });
        }
        
        if (this.contextMenu) {
            this._setupMobileContextMenu();
        }
    }

    /**
     * Configura o toque longo para abrir o menu de contexto no mobile.
     */
    _setupMobileContextMenu() {
        let longPressTimer = null;
        let touchStartX, touchStartY;
        const LONG_PRESS_DURATION = 500;
        const MOVE_THRESHOLD = 15;

        this.desktopEl.addEventListener('contextmenu', e => e.preventDefault());

        const onTouchStart = (e) => {
            if (e.touches.length !== 1 || e.target !== this.desktopEl) return;
            this._clearIconSelection();
            this.mm.close();
            this.contextMenu.classList.add('hidden');
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            longPressTimer = setTimeout(() => {
                e.preventDefault();
                this._openContextMenu(touchStartX, touchStartY, e.target);
                longPressTimer = null;
            }, LONG_PRESS_DURATION);
        };

        const onTouchMove = (e) => {
            if (!longPressTimer) return;
            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
            if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        const onTouchEnd = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        this.desktopEl.addEventListener('touchstart', onTouchStart);
        this.desktopEl.addEventListener('touchmove', onTouchMove);
        this.desktopEl.addEventListener('touchend', onTouchEnd);
        
        document.addEventListener('touchstart', e => {
             if (!this.contextMenu.classList.contains('hidden') && !this.contextMenu.contains(e.target)) {
                this.contextMenu.classList.add('hidden');
            }
        }, { passive: true });
    }
    
    _openContextMenu(x, y, target) {
        this.contextMenu.targetElement = target;
        const menuWidth = this.contextMenu.offsetWidth;
        const menuHeight = this.contextMenu.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        if (x + menuWidth > screenWidth) x = screenWidth - menuWidth - 5;
        if (y + menuHeight > screenHeight) y = screenHeight - menuHeight - 5;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.classList.remove('hidden');
    }

    /**
     * Implementação específica para mobile: toque simples.
     * @param {HTMLElement} icon - O elemento do ícone.
     */
    _setupIconListeners(icon) {
        const appName = icon.dataset.app;
        let touchStartTime = 0;
        let startPos = null;

        icon.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            if (e.touches.length === 1) {
                startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }, { passive: true });

        icon.addEventListener('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            if (e.changedTouches.length === 1 && startPos) {
                const endPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
                const deltaX = Math.abs(endPos.x - startPos.x);
                const deltaY = Math.abs(endPos.y - startPos.y);

                if (touchDuration < 200 && deltaX < 10 && deltaY < 10 && !this.so.state.ui.isDragging) {
                    e.preventDefault();
                    if (this.contextMenu) this.contextMenu.classList.add('hidden');
                    this._selectIcon(icon);
                    this.wm.interact(appName);
                }
            }
        });

        this._makeIconDraggable(icon, icon, {
            onDragEnd: (el) => this.gm.snapToGrid(el)
        });
    }

    /**
     * Implementação específica para mobile: usa 'touchend'.
     * @param {HTMLElement} windowEl - O elemento da janela.
     */
    _makeWindowInteractive(windowEl) {
        const appName = windowEl.dataset.app;
        const header = windowEl.querySelector('.window-header');

        windowEl.addEventListener('touchstart', () => this.wm.focus(appName), { capture: true, passive: true });

        const setupTouchendListener = (selector, action) => {
             windowEl.querySelector(selector).addEventListener('touchend', (e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 action();
             });
        };

        setupTouchendListener('.close-btn', () => this.wm.close(appName));
        setupTouchendListener('.minimize-btn', () => this.wm.minimize(appName));
        setupTouchendListener('.maximize-btn', () => this.wm.toggleMaximize(appName));
        
        this._makeWindowDraggable(windowEl, header, {
            canDrag: () => !this.so.state.windows.abertas.get(appName)?.maximized
        });
    }
    
    /**
     * Implementação específica para mobile: usa eventos de toque.
     */
    _makeWindowDraggable(targetEl, handleEl, options = {}) {
        let offsetX, offsetY;
        let isDragging = false;

        const onTouchStart = (e) => {
            if (e.touches.length !== 1 || (options.canDrag && !options.canDrag())) return;
            const touch = e.touches[0];
            offsetX = touch.clientX - targetEl.offsetLeft;
            offsetY = touch.clientY - targetEl.offsetTop;
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd, { once: true });
        };

        const onTouchMove = (e) => {
            e.preventDefault();
            if (!isDragging) {
                isDragging = true;
                this.so.state.ui.isDragging = true;
                targetEl.classList.add('dragging');
            }
            const touch = e.touches[0];
            let newLeft = touch.clientX - offsetX;
            let newTop = touch.clientY - offsetY;
            targetEl.style.left = `${newLeft}px`;
            targetEl.style.top = `${newTop}px`;
        };

        const onTouchEnd = () => {
            document.removeEventListener('touchmove', onTouchMove);
            if (isDragging) targetEl.classList.remove('dragging');
            setTimeout(() => {
                isDragging = false;
                this.so.state.ui.isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('touchstart', onTouchStart, { passive: false });
    }
    
    _makeIconDraggable(targetEl, handleEl, options = {}) {
        let isDragging = false;
        let offsetX, offsetY;

        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            const touch = e.touches[0];
            offsetX = touch.clientX - targetEl.offsetLeft;
            offsetY = touch.clientY - targetEl.offsetTop;
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd, { once: true });
        };

        const onTouchMove = (e) => {
            e.preventDefault();
            if (!isDragging) {
                isDragging = true;
                this.so.state.ui.isDragging = true;
                targetEl.classList.add('dragging');
                if (navigator.vibrate) navigator.vibrate(50);
            }
            const touch = e.touches[0];
            targetEl.style.left = `${touch.clientX - offsetX}px`;
            targetEl.style.top = `${touch.clientY - offsetY}px`;
        };

        const onTouchEnd = () => {
            document.removeEventListener('touchmove', onTouchMove);
            targetEl.classList.remove('dragging');
            if (isDragging && options.onDragEnd) {
                options.onDragEnd(targetEl);
            }
            setTimeout(() => {
                isDragging = false;
                this.so.state.ui.isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('touchstart', onTouchStart, { passive: false });
    }
}