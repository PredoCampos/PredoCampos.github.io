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
     * Implementação específica para desktop: usa eventos de mouse.
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
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
            targetEl.style.left = `${newLeft}px`;
            targetEl.style.top = `${newTop}px`;
        };

        const onMouseUp = () => {
            if (!isDragging) return;
            targetEl.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            setTimeout(() => {
                this.so.state.ui.isDragging = false;
                isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('mousedown', onMouseDown);
    }
    
    _makeIconDraggable(targetEl, handleEl, options = {}) {
        let isDragging = false;
        let offsetX, offsetY;

        const onMouseDown = (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            offsetX = e.clientX - targetEl.offsetLeft;
            offsetY = e.clientY - targetEl.offsetTop;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp, { once: true });
        };

        const onMouseMove = (e) => {
            if (!isDragging) {
                // Inicia o arraste somente após um pequeno movimento
                isDragging = true;
                this.so.state.ui.isDragging = true;
                targetEl.classList.add('dragging');
            }
            targetEl.style.left = `${e.clientX - offsetX}px`;
            targetEl.style.top = `${e.clientY - offsetY}px`;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            targetEl.classList.remove('dragging');
            if (isDragging) {
                if (options.onDragEnd) {
                    options.onDragEnd(targetEl);
                }
            }
            setTimeout(() => {
                this.so.state.ui.isDragging = false;
                isDragging = false;
            }, 50);
        };

        handleEl.addEventListener('mousedown', onMouseDown);
    }
}