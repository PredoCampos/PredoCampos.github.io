/**
 * @file config.js
 * @description Centraliza todas as configurações estáticas, seletores e
 * o mapa de ícones do sistema.
 */

export const STATIC_CONFIG = {
    // Configurações de Janela
    window: {
        defaultWidth: 640,
        defaultHeight: 480,
        offsetIncrement: 30,
    },
    
    // Configurações de Grid e Ícones
    grid: {
        taskbarPercentage: 0.10,
        marginPercentage: 0.05,
        marginPercentageMobile: 0.02,
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

/**
 * MUDANÇA: Novo objeto para configurações específicas de cada aplicativo.
 * Permite definir características únicas, como as dimensões padrão.
 */
export const APP_CONFIG = {
    'calculadora': {
        defaultWidth: 280,
        defaultHeight: 450,
        resizable: false
    },
    'notas': {
        defaultWidth: 500,
        defaultHeight: 400,
        resizable: true
    },
    'cmd': {
        defaultWidth: 640,
        defaultHeight: 320,
        resizable: true
    },
    // Aplicativos sem configuração aqui usarão o padrão de STATIC_CONFIG.
};


// Mapa de ícones para ser usado em todo o sistema
export const APP_ICONS = {
    'internet': {
        large: 'assets/images/so/internet.png',
        small: 'assets/images/so/internet-small.png'
    },
    'arquivos': {
        large: 'assets/images/so/explorer.png',
        small: 'assets/images/so/explorer-small.png'
    },
    'notas': {
        large: 'assets/images/so/notes.png',
        small: 'assets/images/so/notes-small.png'
    },
    'calculadora': {
        large: 'assets/images/so/calculadora.png',
        small: 'assets/images/so/calculadora-small.png'
    },
    'cobra': {
        large: 'assets/images/so/snake.png',
        small: 'assets/images/so/snake-small.png'
    },
    'lixo': {
        large: 'assets/images/so/lixo.png',
        small: 'assets/images/so/lixo-small.png'
    },
    'cmd': {
        large: 'assets/images/so/cmd.png',
        small: 'assets/images/so/cmd-small.png'
    },
    'help': {
        large: 'assets/images/so/help.png',
        small: 'assets/images/so/help-small.png'
    },
    'default': {
        large: 'assets/images/so/default-icon.png',
        small: 'assets/images/so/default-icon-small.png'
    }
};