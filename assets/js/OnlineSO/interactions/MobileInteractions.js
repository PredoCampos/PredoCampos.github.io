/**
 * @file MobileInteractions.js
 * @description Lida com interações de toque, agora com restrição de limites
 * para o arraste de janelas, garantindo consistência com o desktop.
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
        
        // Listener de toque para interagir com o app (abrir/minimizar/restaurar)
        // Usamos um método que combina detecção de toque simples e evita conflito com o arraste
        let touchStartTime = 0;
        let startPos = null;

        icon.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            if (e.touches.length === 1) {
                startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }, { passive: true });

        icon.addEventListener('touchend', (e) => {
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            if (e.changedTouches.length === 1 && startPos) {
                const endPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
                const deltaX = Math.abs(endPos.x - startPos.x);
                const deltaY = Math.abs(endPos.y - startPos.y);

                // Considera um "toque" se durou pouco e não moveu muito
                if (touchDuration < 200 && deltaX < 10 && deltaY < 10) {
                     if (!this.so.state.ui.isDragging) {
                        e.preventDefault();
                        this._selectIcon(icon);
                        this.wm.interact(appName);
                     }
                }
            }
        });
        
        // A lógica de clique longo para arrastar continua a mesma
        this._makeIconDraggable(icon, icon, {
            onDragEnd: (el) => this.gm.snapToGrid(el)
        });
    }

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
        
        // Adiciona o arraste com limite de borda para as janelas
        this._makeWindowDraggable(windowEl, header, {
            canDrag: () => !this.so.state.windows.abertas.get(appName)?.maximized
        });
    }

    _makeIconDraggable(targetEl, handleEl, options = {}) {
        let longPressTimer = null;
        let isDragging = false;
        let longPressActivated = false;
        let offsetX, offsetY;

        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            e.preventDefault();

            longPressActivated = false;
            isDragging = false;
            
            const touch = e.touches[0];
            offsetX = touch.clientX - targetEl.offsetLeft;
            offsetY = touch.clientY - targetEl.offsetTop;

            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd, { once: true });

            longPressTimer = setTimeout(() => {
                longPressActivated = true;
                if (navigator.vibrate) navigator.vibrate(50);
                targetEl.classList.add('dragging'); 
            }, 400);
        };

        const onTouchMove = (e) => {
            e.preventDefault();
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            if (longPressActivated) {
                isDragging = true;
                this.so.state.ui.isDragging = true;
                
                const touch = e.touches[0];
                targetEl.style.left = `${touch.clientX - offsetX}px`;
                targetEl.style.top = `${touch.clientY - offsetY}px`;
            }
        };

        const onTouchEnd = () => {
            clearTimeout(longPressTimer);
            document.removeEventListener('touchmove', onTouchMove);
            targetEl.classList.remove('dragging');

            if (isDragging && options.onDragEnd) {
                options.onDragEnd(targetEl);
            }
            
            setTimeout(() => {
                this.so.state.ui.isDragging = false;
                isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('touchstart', onTouchStart, { passive: false });
    }
    
    _makeWindowDraggable(targetEl, handleEl, options = {}) {
        let offsetX, offsetY;
        let isDragging = false;
        const dragThreshold = 10; // Um pouco maior para toque

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
            
            // --- MUDANÇA AQUI: Lógica de verificação de limites para toque ---
            let newLeft = touch.clientX - offsetX;
            let newTop = touch.clientY - offsetY;

            const maxLeft = window.innerWidth - targetEl.offsetWidth;
            const maxTop = window.innerHeight - this.so.state.grid.taskbarHeight - targetEl.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            targetEl.style.left = `${newLeft}px`;
            targetEl.style.top = `${newTop}px`;
        };

        const onTouchEnd = () => {
            document.removeEventListener('touchmove', onTouchMove);
            if (isDragging) {
                targetEl.classList.remove('dragging');
            }
            setTimeout(() => {
                isDragging = false;
                this.so.state.ui.isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('touchstart', onTouchStart, { passive: false });
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