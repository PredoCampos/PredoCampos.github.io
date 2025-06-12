/**
 * @file DesktopInteractions.js
 * @description Lida com interações de mouse, agora impedindo que janelas
 * sejam arrastadas para fora da área visível.
 */
export class DesktopInteractions {
    constructor(soInstance) {
        this.so = soInstance;
        this.wm = soInstance.windowManager;
        this.gm = soInstance.gridManager;
    }

    initialize() {
        document.querySelectorAll('.desktop-icon').forEach(icon => this._setupIconListeners(icon));
        document.querySelector(this.so.config.selectors.desktop).addEventListener('click', () => this._clearIconSelection());
        this._observeNewWindows();
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
    
    /**
     * @private
     * Lógica de arrastar para JANELAS, agora com verificação de limites.
     */
    _makeWindowDraggable(targetEl, handleEl, options = {}) {
        let offsetX, offsetY;
        let isDragging = false;
        const dragThreshold = 5;

        const onMouseDown = (e) => {
            if (e.button !== 0 || (options.canDrag && !options.canDrag())) return;
            
            offsetX = e.clientX - targetEl.offsetLeft;
            offsetY = e.clientY - targetEl.offsetTop;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        };

        const onMouseMove = (e) => {
            if (!isDragging) {
                const deltaX = Math.abs(e.clientX - (targetEl.offsetLeft + offsetX));
                const deltaY = Math.abs(e.clientY - (targetEl.offsetTop + offsetY));
                if (deltaX < dragThreshold && deltaY < dragThreshold) return;
                
                isDragging = true;
                this.so.state.ui.isDragging = true;
                targetEl.classList.add('dragging');
            }
            
            // --- MUDANÇA AQUI: Lógica de verificação de limites ---
            
            // 1. Calcula a nova posição ideal
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;

            // 2. Define os limites da área de trabalho
            const maxLeft = window.innerWidth - targetEl.offsetWidth;
            const maxTop = window.innerHeight - this.so.state.grid.taskbarHeight - targetEl.offsetHeight;

            // 3. Garante que a nova posição não ultrapasse os limites
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            
            // 4. Aplica a posição corrigida
            targetEl.style.left = `${newLeft}px`;
            targetEl.style.top = `${newTop}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            
            if (isDragging) {
                targetEl.classList.remove('dragging');
            }
            
            setTimeout(() => {
                isDragging = false;
                this.so.state.ui.isDragging = false;
            }, 50);
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