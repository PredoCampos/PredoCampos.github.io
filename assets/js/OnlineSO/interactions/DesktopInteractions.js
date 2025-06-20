/**
 * @file DesktopInteractions.js
 * @description Lida com interações de MOUSE, herdando a lógica comum de BaseInteractions.
 */

import { BaseInteractions } from './BaseInteractions.js';

export class DesktopInteractions extends BaseInteractions {
    constructor(soInstance) {
        super(soInstance); // Chama o construtor da classe pai
    }

    /**
     * Inicializa os listeners específicos para desktop.
     */
    initialize() {
        super.initialize(); // Executa a inicialização comum da classe pai

        document.querySelectorAll('.desktop-icon').forEach(icon => this._setupIconListeners(icon));

        const startButton = document.querySelector(this.so.config.selectors.menuButton);
        if (startButton) {
            startButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.mm.toggle();
            });
        }

        if (this.contextMenu) {
            this._setupDesktopContextMenu();
        }
    }

    /**
     * Configura o clique com o botão direito para abrir o menu de contexto no desktop.
     */
    _setupDesktopContextMenu() {
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

            if (x + menuWidth > screenWidth) x = screenWidth - menuWidth - 5;
            if (y + menuHeight > screenHeight) y = screenHeight - menuHeight - 5;

            this.contextMenu.style.top = `${y}px`;
            this.contextMenu.style.left = `${x}px`;
            this.contextMenu.classList.remove('hidden');
        });

        document.addEventListener('mousedown', e => {
            if (this.contextMenu && !this.contextMenu.classList.contains('hidden')) {
                if (!this.contextMenu.contains(e.target)) {
                    this.contextMenu.classList.add('hidden');
                }
            }
        });
    }

    /**
     * Implementação específica para desktop: single e double click.
     * @param {HTMLElement} icon - O elemento do ícone.
     */
    _setupIconListeners(icon) {
        const appName = icon.dataset.app;

        let clickTimer = null;
        let clickCount = 0;
        const dblClickSpeed = 300;

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            // Somente processa o clique se não estiver em modo de arrastar.
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

    /**
     * Implementação específica para desktop: usa 'click' e 'dblclick'.
     * @param {HTMLElement} windowEl - O elemento da janela.
     */
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

    /**
     * MUDANÇA: Lógica de arrastar janela agora usa o método da classe base
     * para restringir o movimento aos limites da tela.
     */
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
            if (!isDragging) return;
            
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;

            // Usa o método da classe base para obter as coordenadas corrigidas
            const constrained = this._getConstrainedCoordinates(targetEl, newX, newY);

            targetEl.style.left = `${constrained.x}px`;
            targetEl.style.top = `${constrained.y}px`;
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            
            targetEl.classList.remove('dragging');
            isDragging = false;
            
            setTimeout(() => {
                this.so.state.ui.isDragging = false;
            }, 50);
            
            document.removeEventListener('mousemove', onMouseMove);
        };

        handleEl.addEventListener('mousedown', onMouseDown);
    }
    
    /**
     * MUDANÇA: Lógica de arrastar ícone restaurada para o comportamento original,
     * mais robusto, que previne o arraste acidental em um clique simples.
     */
    _makeIconDraggable(targetEl, handleEl, options = {}) {
        let isDragging = false;
        let offsetX, offsetY;
        let startX, startY;
        const moveThreshold = 5; // Pixels que o mouse deve mover para iniciar o arraste

        const onMouseDown = (e) => {
            if (e.button !== 0) return;
            e.preventDefault();

            startX = e.clientX;
            startY = e.clientY;
            offsetX = e.clientX - targetEl.offsetLeft;
            offsetY = e.clientY - targetEl.offsetTop;

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        };

        const onMouseMove = (e) => {
            if (!isDragging) {
                const deltaX = Math.abs(e.clientX - startX);
                const deltaY = Math.abs(e.clientY - startY);
                // Só inicia o arraste se o mouse se mover mais que o threshold
                if (deltaX > moveThreshold || deltaY > moveThreshold) {
                    isDragging = true;
                    this.so.state.ui.isDragging = true;
                    targetEl.classList.add('dragging');
                } else {
                    return; // Não faz nada se não atingiu o threshold
                }
            }

            // Lógica de arrastar, que agora só executa se isDragging for true
            const newX = e.clientX - offsetX;
            const newY = e.clientY - offsetY;
            targetEl.style.left = `${newX}px`;
            targetEl.style.top = `${newY}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            
            if (isDragging) {
                targetEl.classList.remove('dragging');
                if (options.onDragEnd) {
                    options.onDragEnd(targetEl);
                }
            }

            // Reseta o estado de 'isDragging' de forma segura após o evento
            setTimeout(() => {
                this.so.state.ui.isDragging = false;
                isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('mousedown', onMouseDown);
    }
}