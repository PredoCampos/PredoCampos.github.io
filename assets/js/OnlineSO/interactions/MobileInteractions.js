/**
 * @file MobileInteractions.js
 * @description Lida com todas as interações do usuário via toque.
 */
export class MobileInteractions {
    constructor(soInstance) {
        this.so = soInstance;
        this.wm = soInstance.windowManager;
        this.gm = soInstance.gridManager;
    }

    initialize() {
        document.querySelectorAll('.desktop-icon').forEach(icon => this._setupIconListeners(icon));
        document.querySelector(this.so.config.selectors.desktop).addEventListener('touchstart', () => this._clearIconSelection());
        this._observeNewWindows();
    }

    _setupIconListeners(icon) {
        const appName = icon.dataset.app;
        let longPressTimer = null;
        let isLongPress = false;
        let startPos = null;

        icon.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            startPos = { x: touch.clientX, y: touch.clientY };
            isLongPress = false;

            longPressTimer = setTimeout(() => {
                isLongPress = true;
                if (navigator.vibrate) navigator.vibrate(50);
                // Inicia o arraste programaticamente
                this._makeDraggable(icon, icon, {
                    onDragEnd: (el) => this.gm.snapToGrid(el)
                }).start(e);
            }, 500);
        }, { passive: false });

        icon.addEventListener('touchmove', (e) => {
            if (longPressTimer && startPos) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - startPos.x);
                const deltaY = Math.abs(touch.clientY - startPos.y);
                if (deltaX > 10 || deltaY > 10) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }
        }, { passive: false });

        icon.addEventListener('touchend', (e) => {
            e.preventDefault();
            clearTimeout(longPressTimer);
            if (!isLongPress && !this.so.state.ui.isDragging) {
                this._selectIcon(icon);
                this.wm.interact(appName);
            }
        }, { passive: false });
    }

    _makeWindowInteractive(windowEl) {
        const appName = windowEl.dataset.app;
        const header = windowEl.querySelector('.window-header');

        windowEl.addEventListener('touchstart', () => this.wm.focus(appName), { capture: true });

        // Delega para touchend para evitar "toque fantasma"
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
        
        // Configura o arrastar para a janela
        this._makeDraggable(windowEl, header, {
            canDrag: () => !this.so.state.windows.abertas.get(appName)?.maximized,
            longPress: 300 // Janelas precisam de um toque longo mais curto
        });
    }

    _makeDraggable(targetEl, handleEl, options = {}) {
        let isDragging = false, offsetX, offsetY, longPressTimer = null, startPos = null;

        const startDrag = (e) => {
            if (options.canDrag && !options.canDrag()) return;
            
            isDragging = true;
            this.so.state.ui.isDragging = true;
            targetEl.classList.add('dragging');
            const touch = e.touches[0];
            offsetX = touch.clientX - targetEl.offsetLeft;
            offsetY = touch.clientY - targetEl.offsetTop;

            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd, { once: true });
        };

        const onTouchStart = (e) => {
            if(e.touches.length !== 1) return;
            const touch = e.touches[0];
            startPos = { x: touch.clientX, y: touch.clientY };

            longPressTimer = setTimeout(() => {
                if (navigator.vibrate) navigator.vibrate(50);
                startDrag(e);
            }, options.longPress || 500);
        };

        const onTouchMove = (e) => {
            if (longPressTimer && startPos) {
                 const touch = e.touches[0];
                 const deltaX = Math.abs(touch.clientX - startPos.x);
                 const deltaY = Math.abs(touch.clientY - startPos.y);
                 if (deltaX > 10 || deltaY > 10) clearTimeout(longPressTimer);
            }
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            targetEl.style.left = `${touch.clientX - offsetX}px`;
            targetEl.style.top = `${touch.clientY - offsetY}px`;
        };

        const onTouchEnd = () => {
            clearTimeout(longPressTimer);
            if (!isDragging) return;

            isDragging = false;
            this.so.state.ui.isDragging = false;
            targetEl.classList.remove('dragging');
            document.removeEventListener('touchmove', onTouchMove);

            if (options.onDragEnd) options.onDragEnd(targetEl);
        };

        handleEl.addEventListener('touchstart', onTouchStart, { passive: false });

        return { start: startDrag }; // Para iniciar o arraste programaticamente
    }

    _selectIcon(icon) {
        this._clearIconSelection();
        icon.classList.add('selected');
    }
    _clearIconSelection() {
        document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
    }

    _observeNewWindows() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('window')) {
                        this._makeWindowInteractive(node);
                    }
                });
            });
        });
        const container = document.querySelector(this.so.config.selectors.windowsContainer);
        observer.observe(container, { childList: true });
    }
}