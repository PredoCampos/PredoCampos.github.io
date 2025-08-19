/**
 * @file utils.js
 * @description Funções utilitárias puras e reutilizáveis.
 */

/**
 * Capitaliza a primeira letra de uma string.
 */
export function capitalize(text) {
    if (typeof text !== 'string' || text.length === 0) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Detecta o tipo de dispositivo (mobile/desktop, touch).
 * @returns {{isMobile: boolean, isTouch: boolean}}
 */
export function detectDevice() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileSize = window.innerWidth <= 768 || window.innerHeight <= 768;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isMobile = isTouch && (isMobileSize || isMobileUA);

    console.log(`Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'}, Touch: ${isTouch}`);
    return { isMobile, isTouch };
}

/**
 * Aplica correções de CSS e eventos para evitar comportamentos
 * indesejados em dispositivos móveis (zoom, scroll).
 */
export function applyMobileFixes() {
    // Previne zoom por duplo toque
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) e.preventDefault();
        lastTouchEnd = now;
    }, { passive: false });

    // Trava o scroll da página
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    console.log('Correções de ambiente mobile aplicadas.');
}