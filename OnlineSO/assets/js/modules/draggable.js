// assets/js/modules/draggable.js
// Módulo para adicionar funcionalidade de arrastar (drag-and-drop) a elementos HTML,
// com suporte unificado para eventos de mouse e toque.

import { CONFIG } from './config.js'; // Para usar CONFIG.isTouch, LONG_PRESS_THRESHOLD, TOUCH_MOVE_THRESHOLD

export class Draggable {
    /**
     * Torna um elemento arrastável.
     * @param {HTMLElement} elementToDrag - O elemento que será arrastado.
     * @param {HTMLElement} [handleElement] - O elemento que iniciará o arraste (opcional, defaults to elementToDrag).
     * @param {Function} [onDragEndCallback] - Função a ser chamada no final do arraste, recebe {x, y} da nova posição.
     * @param {boolean} [isWindow=false] - Define se o elemento é uma janela (afeta o threshold do long press e limites).
     */
    static makeDraggable(elementToDrag, handleElement = elementToDrag, onDragEndCallback = null, isWindow = false) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;
        let startX = 0;
        let startY = 0;
        let longPressTimer = null;

        const startEvent = CONFIG.isTouch ? 'touchstart' : 'mousedown';
        const moveEvent = CONFIG.isTouch ? 'touchmove' : 'mousemove';
        const endEvent = CONFIG.isTouch ? 'touchend' : 'mouseup';

        const LONG_PRESS_THRESHOLD = isWindow ? CONFIG.LONG_PRESS_THRESHOLD_WINDOW_HEADER : CONFIG.LONG_PRESS_THRESHOLD_ICON;

        handleElement.addEventListener(startEvent, (e) => {
            if (!CONFIG.isTouch && e.button !== 0) return; // Apenas botão esquerdo do mouse

            // Previne seleção de texto no desktop
            if (!CONFIG.isTouch) {
                e.preventDefault();
            }

            const clientX = CONFIG.isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = CONFIG.isTouch ? e.touches[0].clientY : e.clientY;

            const rect = elementToDrag.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;

            startX = clientX;
            startY = clientY;

            // Inicia o timer para "long press" (apenas para touch)
            if (CONFIG.isTouch) {
                longPressTimer = setTimeout(() => {
                    isDragging = true;
                    elementToDrag.classList.add('dragging');
                    elementToDrag.style.zIndex = CONFIG.maxZIndex + 1; // Coloca em z-index alto durante o arraste
                    
                    // Feedback tátil
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    console.log(`Draggable: Início do arraste (long press) para ${elementToDrag.id || elementToDrag.className}`);
                }, LONG_PRESS_THRESHOLD);
            } else {
                // Para desktop, o arraste começa imediatamente
                isDragging = true;
                elementToDrag.classList.add('dragging');
                elementToDrag.style.zIndex = CONFIG.maxZIndex + 1;
                console.log(`Draggable: Início do arraste (mousedown) para ${elementToDrag.id || elementToDrag.className}`);
            }

        }, { passive: false }); // Usar passive: false para permitir preventDefault

        document.addEventListener(moveEvent, (e) => {
            if (!isDragging) {
                // Se não está arrastando, mas é touch e o timer está ativo,
                // verifica se o movimento excede o threshold para cancelar o long press.
                if (CONFIG.isTouch && longPressTimer) {
                    const clientX = e.touches[0].clientX;
                    const clientY = e.touches[0].clientY;
                    const deltaX = Math.abs(clientX - startX);
                    const deltaY = Math.abs(clientY - startY);

                    if (deltaX > CONFIG.TOUCH_MOVE_THRESHOLD || deltaY > CONFIG.TOUCH_MOVE_THRESHOLD) {
                        clearTimeout(longPressTimer);
                        longPressTimer = null;
                        // Se o movimento cancelou o long press, não deve iniciar arraste
                        // Mas permite o comportamento padrão do scroll, se não for um arrastar válido.
                    }
                }
                return;
            }

            e.preventDefault(); // Previne o scroll da página durante o arraste

            const clientX = CONFIG.isTouch ? e.touches[0].clientX : e.clientX;
            const clientY = CONFIG.isTouch ? e.touches[0].clientY : e.clientY;

            let newX = clientX - offsetX;
            let newY = clientY - offsetY;

            // Limitar o arraste dentro da tela (e acima da taskbar para ícones/janelas)
            const maxX = window.innerWidth - elementToDrag.offsetWidth;
            const maxY = window.innerHeight - CONFIG.taskbarHeight - elementToDrag.offsetHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            elementToDrag.style.left = `${newX}px`;
            elementToDrag.style.top = `${newY}px`;
        }, { passive: false }); // Usar passive: false para permitir preventDefault

        document.addEventListener(endEvent, () => {
            // Limpa o timer de long press se ele ainda estiver ativo (e.g., toque curto)
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }

            if (!isDragging) return; // Não estava arrastando, então nada a fazer

            isDragging = false;
            elementToDrag.classList.remove('dragging');
            elementToDrag.style.zIndex = 'auto'; // Volta para z-index normal

            console.log(`Draggable: Fim do arraste para ${elementToDrag.id || elementToDrag.className}`);

            // Chama o callback se fornecido, passando a posição final
            if (onDragEndCallback) {
                onDragEndCallback({
                    x: elementToDrag.offsetLeft,
                    y: elementToDrag.offsetTop
                });
            }
        });
    }
}