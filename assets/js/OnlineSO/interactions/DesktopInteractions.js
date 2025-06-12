/**
 * @file DesktopInteractions.js
 * @description Lida com interações de mouse, com um sistema de detecção de
 * duplo clique manual para maior confiabilidade.
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
    
    /**
     * @private
     * Reescrito com um detector de duplo clique manual para ser mais robusto.
     */
    _setupIconListeners(icon) {
        const appName = icon.dataset.app;
        
        // Variáveis para controlar a detecção de clique/duplo clique
        let clickTimer = null;
        let clickCount = 0;
        const dblClickSpeed = 300; // Tempo em ms para considerar um duplo clique

        // Substitui os listeners de 'click' e 'dblclick' por um único listener inteligente
        icon.addEventListener('click', (e) => {
            e.stopPropagation();

            // Se um arraste acabou de acontecer, ignora o evento de clique residual
            if (this.so.state.ui.isDragging) return;

            clickCount++;

            if (clickCount === 1) {
                // No primeiro clique, inicia um temporizador.
                clickTimer = setTimeout(() => {
                    // Se o tempo esgotar, foi um clique simples.
                    // Ação de clique simples: selecionar o ícone.
                    this._selectIcon(icon);
                    clickCount = 0; // Reseta a contagem
                }, dblClickSpeed);
            } else if (clickCount === 2) {
                // Se o segundo clique chegar antes do tempo esgotar, é um duplo clique.
                clearTimeout(clickTimer); // Cancela a ação de clique simples
                
                // Ação de duplo clique: interagir com o app (abrir/minimizar/restaurar).
                this.wm.interact(appName);
                clickCount = 0; // Reseta a contagem
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
            
            targetEl.style.left = `${e.clientX - offsetX}px`;
            targetEl.style.top = `${e.clientY - offsetY}px`;
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