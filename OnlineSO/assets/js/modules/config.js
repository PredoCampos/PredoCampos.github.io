// assets/js/modules/config.js
// Define configurações e constantes globais para a aplicação.

export const CONFIG = {
    // Configurações de janela
    windowDefaultWidth: 400,
    windowDefaultHeight: 300,
    windowOffsetIncrement: 30,
    maxZIndex: 1000,
    
    // Configurações do grid responsivo
    taskbarPercentage: 0.10, // 10% do menor lado da tela
    gridMarginPercentage: 0.05, // 5% de margem em cada direção
    iconSize: 80, // Tamanho base do ícone
    
    // Detecção de dispositivo (valores iniciais, serão atualizados pelo DeviceDetector)
    isMobile: false,
    isTouch: false,
    
    // Configurações calculadas dinamicamente (serão atualizadas por outros módulos)
    taskbarHeight: 0,
    gridMargin: 0,
    gridSize: 0,
    gridStartX: 0,
    gridStartY: 0,
    maxColunas: 0,
    maxLinhas: 0,
    gridWidth: 0,
    gridHeight: 0,
    
    // Seletores (constantes de DOM para evitar strings mágicas)
    desktopSelector: '#desktop',
    windowsContainerSelector: '#windows-container',
    taskbarAppsSelector: '#taskbar-apps',
    taskbarClockSelector: '#taskbar-clock',
    taskbarDataSelector: '#taskbar-data',
    menuButtonSelector: '#menu-button',
    
    // Outras constantes
    LONG_PRESS_THRESHOLD_ICON: 500, // ms
    LONG_PRESS_THRESHOLD_WINDOW_HEADER: 300, // ms
    TOUCH_MOVE_THRESHOLD: 10, // pixels
    DOUBLE_TAP_THRESHOLD: 300, // ms
};

// Se precisar adicionar outras constantes que não sejam configurações de inicialização,
// elas podem vir aqui ou em um módulo 'constants.js' separado, se ficar muito grande.