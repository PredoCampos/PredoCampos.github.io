/**
 * @file DesktopInteractions.js
 * @description Lida com interações de mouse, incluindo o clique direito para o menu de contexto.
 */
export class DesktopInteractions {
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
        this.desktopEl.addEventListener('click', () => this._clearIconSelection());
        this._observeNewWindows();

        const startButton = document.querySelector(this.so.config.selectors.menuButton);
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.mm.toggle();
            });
        }

        if (this.contextMenu) {
            this._setupContextMenuListeners();
        }
    }

    /**
     * Configura todos os eventos do menu de contexto.
     */
    _setupContextMenuListeners() {
        this.desktopEl.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            this.mm.close();

            this.contextMenu.targetElement = e.target;

            const menuWidth = this.contextMenu.offsetWidth;
            const menuHeight = this.contextMenu.offsetHeight;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            let x = e.clientX;
            let y = e.clientY;

            if (x + menuWidth > screenWidth) {
                x = screenWidth - menuWidth - 5;
            }
            if (y + menuHeight > screenHeight) {
                y = screenHeight - menuHeight - 5;
            }

            this.contextMenu.style.top = `${y}px`;
            this.contextMenu.style.left = `${x}px`;
            this.contextMenu.classList.remove('hidden');
        });

        document.addEventListener('click', e => {
            if (this.contextMenu && !this.contextMenu.classList.contains('hidden')) {
                if (!this.contextMenu.contains(e.target)) {
                    this.contextMenu.classList.add('hidden');
                }
            }
        });

        this.contextMenu.addEventListener('click', e => {
            const actionItem = e.target.closest('.context-menu-item[data-action]');
            if (!actionItem) return;

            const action = actionItem.dataset.action;

            // MUDANÇA: Adicionado o case para a ação 'reset-layout'
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

            this.contextMenu.classList.add('hidden');
        });
    }
    
    _setupIconListeners(icon) {
        const appName = icon.dataset.app;
        
        let clickTimer = null;
        let clickCount = 0;
        const dblClickSpeed = 300; 

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.so.state.ui.isDragging) return;
            clickCount++;
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    this._selectIcon(icon);
                    clickCount = 0;
                }, dblClickSpeed);
            } else if (clickCount === 2) {
                clearTimeout(clickTimer);
                this.wm.interact(appName);
                clickCount = 0;
            }
        });
        
        this._makeIconDraggable(icon, icon, {
            onDragEnd: (el) => this.gm.snapToGrid(el)
        });
    }

    _makeWindowInteractive(windowEl) {
        const appName = windowEl.dataset.app;
        const header = windowEl.querySelector('.window-header');

        windowEl.addEventListener('mousedown', () => this.wm.focus(appName), { capture: true });

        windowEl.querySelector('.close-btn').addEventListener('click', (e) => { e.stopPropagation(); this.wm.close(appName); });
        windowEl.querySelector('.minimize-btn').addEventListener('click', (e) => { e.stopPropagation(); this.wm.minimize(appName); });
        windowEl.querySelector('.maximize-btn').addEventListener('click', (e) => { e.stopPropagation(); this.wm.toggleMaximize(appName); });
        header.addEventListener('dblclick', () => this.wm.toggleMaximize(appName));
        
        this._makeWindowDraggable(windowEl, header, {
             canDrag: () => !this.so.state.windows.abertas.get(appName)?.maximized
        });
    }

    _makeIconDraggable(targetEl, handleEl, options = {}) {
        let longPressTimer = null;
        let isDragging = false;
        let longPressActivated = false;
        let offsetX, offsetY;

        const onMouseDown = (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            longPressActivated = false;
            isDragging = false;
            offsetX = e.clientX - targetEl.offsetLeft;
            offsetY = e.clientY - targetEl.offsetTop;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
            
            longPressTimer = setTimeout(() => {
                longPressActivated = true;
                targetEl.classList.add('dragging'); 
            }, 400);
        };

        const onMouseMove = (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            if (longPressActivated) {
                isDragging = true;
                this.so.state.ui.isDragging = true;
                targetEl.style.left = `${e.clientX - offsetX}px`;
                targetEl.style.top = `${e.clientY - offsetY}px`;
            }
        };

        const onMouseUp = () => {
            clearTimeout(longPressTimer);
            document.removeEventListener('mousemove', onMouseMove);
            targetEl.classList.remove('dragging');
            if (isDragging && options.onDragEnd) {
                options.onDragEnd(targetEl);
            }
            setTimeout(() => {
                this.so.state.ui.isDragging = false;
                isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('mousedown', onMouseDown);
    }
    
    _makeWindowDraggable(targetEl, handleEl, options = {}) {
        let offsetX, offsetY;
        let isDragging = false;

        const onMouseDown = (e) => {
            if (e.button !== 0 || (options.canDrag && !options.canDrag())) return;
            
            isDragging = true;
            this.so.state.ui.isDragging = true;
            targetEl.classList.add('dragging');

            offsetX = e.clientX - targetEl.offsetLeft;
            offsetY = e.clientY - targetEl.offsetTop;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        };

        const onMouseMove = (e) => {
            if (isDragging) {
                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;

                const maxLeft = window.innerWidth - targetEl.offsetWidth;
                const maxTop = window.innerHeight - this.so.state.grid.taskbarHeight - targetEl.offsetHeight;

                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));
                
                targetEl.style.left = `${newLeft}px`;
                targetEl.style.top = `${newTop}px`;
            }
        };

        const onMouseUp = () => {
            if (isDragging) {
                targetEl.classList.remove('dragging');
                isDragging = false;
                
                setTimeout(() => {
                    this.so.state.ui.isDragging = false;
                }, 50);
            }
            document.removeEventListener('mousemove', onMouseMove);
        };

        handleEl.addEventListener('mousedown', onMouseDown);
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