/**
 * @file MobileInteractions.js
 * @description Lida com interações de toque, com tolerância de movimento para o arraste de ícones.
 */
export class MobileInteractions {
    constructor(soInstance) {
        this.so = soInstance;
        this.wm = soInstance.windowManager;
        this.gm = soInstance.gridManager;
        this.mm = soInstance.menuManager;
        this.contextMenu = document.getElementById('context-menu');
        this.desktopEl = document.querySelector(this.so.config.selectors.desktop);
    }

    initialize() {
        document.querySelectorAll('.desktop-icon').forEach(icon => this._setupIconListeners(icon));
        this._observeNewWindows();

        const startButton = document.querySelector(this.so.config.selectors.menuButton);
        if (startButton) {
            startButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mm.toggle();
            });
        }
        
        if (this.contextMenu) {
            this._setupContextMenuListeners();
        }
    }

    _setupContextMenuListeners() {
        let longPressTimer = null;
        let touchStartX, touchStartY;
        const LONG_PRESS_DURATION = 500;
        const MOVE_THRESHOLD = 15;

        this.desktopEl.addEventListener('contextmenu', e => {
            e.preventDefault();
        });

        this.desktopEl.addEventListener('touchstart', e => {
            if (e.touches.length !== 1 || e.target !== this.desktopEl) {
                return;
            }

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
        });

        this.desktopEl.addEventListener('touchmove', e => {
            if (!longPressTimer) return;

            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

            if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        this.desktopEl.addEventListener('touchend', e => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
        
        this.contextMenu.addEventListener('touchend', e => {
            e.preventDefault();
            const actionItem = e.target.closest('.context-menu-item[data-action]');
            if (!actionItem) return;

            const action = actionItem.dataset.action;
            this.contextMenu.classList.add('hidden');

            switch(action) {
                case 'refresh':
                    window.location.reload();
                    break;
                case 'reset-layout':
                    this.so.persistenceManager.clear();
                    window.location.reload();
                    break;
                case 'open-cmd':
                    this.so.windowManager.open('cmd');
                    break;
                case 'inspect':
                    console.log('Elemento Inspecionado:', this.contextMenu.targetElement);
                    break;
            }
        });

        document.addEventListener('touchstart', e => {
             if (!this.contextMenu.classList.contains('hidden')) {
                if (!this.contextMenu.contains(e.target)) {
                    this.contextMenu.classList.add('hidden');
                }
            }
        }, { passive: true });
    }

    _openContextMenu(x, y, target) {
        this.contextMenu.targetElement = target;

        const menuWidth = this.contextMenu.offsetWidth;
        const menuHeight = this.contextMenu.offsetHeight;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        if (x + menuWidth > screenWidth) {
            x = screenWidth - menuWidth - 5;
        }
        if (y + menuHeight > screenHeight) {
            y = screenHeight - menuHeight - 5;
        }

        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.classList.remove('hidden');
    }
    
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
            const touchEndTime = Date.now();
            const touchDuration = touchEndTime - touchStartTime;
            
            if (e.changedTouches.length === 1 && startPos) {
                const endPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
                const deltaX = Math.abs(endPos.x - startPos.x);
                const deltaY = Math.abs(endPos.y - startPos.y);

                if (touchDuration < 200 && deltaX < 10 && deltaY < 10) {
                     if (!this.so.state.ui.isDragging) {
                        e.preventDefault();
                        if (this.contextMenu) this.contextMenu.classList.add('hidden');
                        
                        this._selectIcon(icon);
                        this.wm.interact(appName);
                     }
                }
            }
        });
        
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
        
        this._makeWindowDraggable(windowEl, header, {
            canDrag: () => !this.so.state.windows.abertas.get(appName)?.maximized
        });
    }

    /**
     * MUDANÇA: Lógica de arrastar ícones agora tem tolerância de movimento.
     */
    _makeIconDraggable(targetEl, handleEl, options = {}) {
        let longPressTimer = null;
        let isDragging = false;
        let longPressActivated = false;
        let touchStartX, touchStartY;
        let offsetX, offsetY;
        const MOVE_THRESHOLD = 15;

        const onTouchStart = (e) => {
            if (e.touches.length !== 1) return;
            e.preventDefault();
            e.stopPropagation(); // Impede que o toque no ícone feche o menu de contexto

            longPressActivated = false;
            isDragging = false;
            
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
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
            
            // Se o timer já disparou (long press ativado), move o ícone
            if (longPressActivated) {
                isDragging = true;
                this.so.state.ui.isDragging = true;
                
                const touch = e.touches[0];
                targetEl.style.left = `${touch.clientX - offsetX}px`;
                targetEl.style.top = `${touch.clientY - offsetY}px`;
            } else if (longPressTimer) {
                // Se o timer ainda não disparou, verifica se o movimento excedeu o limite
                const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
                const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

                if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
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