// assets/js/modules/deviceDetector.js
// Gerencia a detecção de dispositivo (mobile, touch) e aplica configurações específicas.

import { CONFIG } from './config.js'; // Importa as configurações globais

export class DeviceDetector {
    constructor() {
        this.detect();
    }

    /**
     * Detecta se o dispositivo é mobile ou possui capacidade de toque.
     * Atualiza as propriedades CONFIG.isMobile e CONFIG.isTouch.
     */
    detect() {
        // Detecta se tem suporte a touch
        CONFIG.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Detecta se é mobile baseado em tamanho de tela e user agent
        const isMobileSize = window.innerWidth <= 768 || window.innerHeight <= 768;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        CONFIG.isMobile = CONFIG.isTouch && (isMobileSize || isMobileUA);
        
        console.log('DeviceDetector: Dispositivo detectado:', {
            isMobile: CONFIG.isMobile,
            isTouch: CONFIG.isTouch,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight
        });
        
        // Aplica configurações específicas para mobile se necessário
        if (CONFIG.isMobile) {
            this.applyMobileConfig();
        }
    }

    /**
     * Aplica configurações e previne comportamentos padrão em dispositivos móveis.
     * Modifica estilos do corpo e ajusta configurações do grid.
     */
    applyMobileConfig() {
        // Previne zoom no duplo toque (melhor controle via CSS viewport ou JS)
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= CONFIG.DOUBLE_TAP_THRESHOLD) { // Usa a constante do CONFIG
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
        
        // Remove scroll da página principal (já tratado no CSS base, mas reforça)
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        
        // Ajusta configurações do grid para mobile (usando percentagens menores)
        CONFIG.gridMarginPercentage = 0.02; // Margem menor no mobile
        CONFIG.iconSize = 60; // Ícones menores
        
        console.log('DeviceDetector: Configurações mobile aplicadas.');
    }
}