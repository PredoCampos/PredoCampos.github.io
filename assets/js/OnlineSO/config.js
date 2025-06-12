/**
 * @file config.js
 * @description Centraliza todas as configurações estáticas e seletores do sistema.
 */

export const STATIC_CONFIG = {
    // Configurações de Janela
    window: {
        defaultWidth: 400,
        defaultHeight: 300,
        offsetIncrement: 30,
    },
    
    // Configurações de Grid e Ícones
    grid: {
        taskbarPercentage: 0.10,        // 10% do lado menor da tela para a taskbar
        marginPercentage: 0.05,         // 5% de margem
        marginPercentageMobile: 0.02,   // 2% de margem no mobile
        iconBaseSize: 96,
        iconBaseSizeMobile: 65,
    },

    // Outras configs
    maxZIndex: 1000,
    
    // Seletores do DOM
    selectors: {
        desktop: '#desktop',
        windowsContainer: '#windows-container',
        taskbar: '.taskbar',
        taskbarApps: '#taskbar-apps',
        taskbarClock: '#taskbar-clock',
        taskbarData: '#taskbar-data',
        menuButton: '#menu-button'
    }
};