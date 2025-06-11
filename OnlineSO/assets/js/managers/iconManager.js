// assets/js/managers/iconManager.js
// Gerencia as interações e o estado dos ícones do desktop.

import { CONFIG } from '../modules/config.js';
import { Draggable } from '../modules/draggable.js'; // Usaremos o Draggable
import { capitalizeText } from '../modules/utils.js'; // Para capitalizar nomes de apps

export class IconManager {
    /**
     * @param {object} config - O objeto de configurações globais.
     * @param {object} gridManager - Instância do GridManager.
     * @param {object} windowManager - Instância do WindowManager (ainda a ser criada, mas passaremos aqui).
     */
    constructor(config, gridManager, windowManager) {
        this.config = config;
        this.gridManager = gridManager;
        this.windowManager = windowManager; // Será instanciado e passado para cá

        this.isDraggingIcon = false; // Flag para controlar se um ícone está sendo arrastado
    }

    /**
     * Configura todos os ouvintes de eventos para os ícones do desktop.
     */
    setupDesktopIconEvents() {
        const desktopIcons = document.querySelectorAll('.desktop-icon');
        const desktopElement = document.querySelector(this.config.desktopSelector);

        desktopIcons.forEach(icon => {
            // Configura o ícone para ser arrastável
            Draggable.makeDraggable(icon, icon, (newPos) => {
                this.isDraggingIcon = false; // Garante que a flag é resetada após o arraste
                this.gridManager.snapIconToGrid(icon, newPos);
            }, false); // isWindow = false

            // Eventos para interação (clique simples e duplo clique/toque)
            if (this.config.isMobile) {
                this.setupMobileIconEvents(icon);
            } else {
                this.setupDesktopMouseEvents(icon);
            }
        });

        // Clicar no desktop limpa a seleção de ícones
        if (desktopElement) {
            desktopElement.addEventListener(this.config.isMobile ? 'touchstart' : 'click', (e) => {
                // Garante que o clique não veio de um ícone arrastável
                if (!this.isDraggingIcon && !e.target.closest('.desktop-icon')) {
                    this.clearIconSelection();
                }
            });
        }
    }

    /**
     * Configura eventos de mouse para ícones no desktop (não mobile).
     * @param {HTMLElement} icon - O elemento DOM do ícone.
     */
    setupDesktopMouseEvents(icon) {
        icon.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Evita que o evento de clique no desktop seja disparado
            if (this.isDraggingIcon) return; // Não abre se ainda estiver arrastando
            
            this.openAppFromIcon(icon);
        });

        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Evita que o evento de clique no desktop seja disparado
            if (!this.isDraggingIcon) {
                this.selectIcon(icon);
            }
        });

        // Flag para controlar o estado de arraste do ícone para evitar abertura indesejada
        icon.addEventListener('mousedown', () => {
            this.isDraggingIcon = true;
            setTimeout(() => { // Pequeno delay para garantir que o drag começou antes do click/dblclick
                this.isDraggingIcon = false;
            }, 150); // Ajuste o tempo conforme necessário
        });
    }

    /**
     * Configura eventos de toque para ícones em dispositivos móveis.
     * @param {HTMLElement} icon - O elemento DOM do ícone.
     */
    setupMobileIconEvents(icon) {
        let touchTimer = null;
        let isLongPress = false;
        const iconManager = this; // Manter o contexto do IconManager

        icon.addEventListener('touchstart', (e) => {
            // Se já estamos arrastando, ou se múltiplos toques, ignora
            if (iconManager.isDraggingIcon || e.touches.length > 1) {
                e.preventDefault(); // Previne zoom
                return;
            }

            // Inicia um timer para detectar long press (para arrastar)
            touchTimer = setTimeout(() => {
                isLongPress = true;
                iconManager.isDraggingIcon = true; // Define a flag de arraste
                // O Draggable.makeDraggable já lida com o início do arraste visual e feedback tátil
                console.log(`IconManager: Long press detectado para ${icon.dataset.app}.`);
            }, CONFIG.LONG_PRESS_THRESHOLD_ICON); // Usando a constante do CONFIG

            iconManager.selectIcon(icon); // Seleciona no touchstart (como no Windows Mobile)
            e.stopPropagation(); // Impede que o touchstart se propague para o desktop
        }, { passive: false }); // Permite e.preventDefault()

        icon.addEventListener('touchend', (e) => {
            if (touchTimer) {
                clearTimeout(touchTimer);
                touchTimer = null;
            }

            if (!isLongPress && !iconManager.isDraggingIcon) {
                // É um toque rápido (como um clique) e não iniciou arraste
                this.openAppFromIcon(icon);
                console.log(`IconManager: Toque rápido para abrir ${icon.dataset.app}.`);
            }
            
            isLongPress = false; // Reseta a flag de long press
            // A flag isDraggingIcon é resetada pelo callback do Draggable.makeDraggable no touchend
            e.stopPropagation();
        }, { passive: false });

        icon.addEventListener('touchmove', (e) => {
            // Se houver um movimento significativo antes do long press, cancela o timer
            if (touchTimer && e.touches.length === 1) {
                const touch = e.touches[0];
                const deltaX = Math.abs(touch.clientX - icon.getBoundingClientRect().left); // Usa a posição inicial do toque
                const deltaY = Math.abs(touch.clientY - icon.getBoundingClientRect().top);
                
                // Se o movimento excede o threshold, cancela o long press para não iniciar o arraste acidentalmente.
                if (deltaX > CONFIG.TOUCH_MOVE_THRESHOLD || deltaY > CONFIG.TOUCH_MOVE_THRESHOLD) {
                    clearTimeout(touchTimer);
                    touchTimer = null;
                }
            }
            // Não chame e.preventDefault() aqui para permitir o Draggable.js fazer isso
        }, { passive: false });
    }

    /**
     * Abre um aplicativo a partir de um ícone.
     * @param {HTMLElement} iconElement - O elemento DOM do ícone.
     */
    openAppFromIcon(iconElement) {
        const appName = iconElement.dataset.app;
        if (appName && this.windowManager) {
            console.log(`IconManager: Interagindo com o aplicativo: ${appName}`);
            this.windowManager.interactWithApplication(appName);
        } else {
            console.warn(`IconManager: Nome do aplicativo não definido para o ícone ou WindowManager não disponível.`);
        }
    }

    /**
     * Seleciona um ícone, adicionando a classe 'selected' e desmarcando outros.
     * @param {HTMLElement} iconElement - O elemento DOM do ícone a ser selecionado.
     */
    selectIcon(iconElement) {
        this.clearIconSelection();
        iconElement.classList.add('selected');
        console.log(`IconManager: Ícone ${iconElement.dataset.app} selecionado.`);
    }

    /**
     * Limpa a seleção de todos os ícones do desktop.
     */
    clearIconSelection() {
        const selectedIcons = document.querySelectorAll('.desktop-icon.selected');
        selectedIcons.forEach(icon => {
            icon.classList.remove('selected');
        });
    }
}