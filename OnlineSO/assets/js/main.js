// assets/js/main.js
// Ponto de entrada principal do Sistema Operacional.
// Este arquivo carrega e inicializa os módulos da aplicação.

console.log('🚀 Inicializando Sistema Operacional...');

// Importa os módulos que serão utilizados para construir o SO
import { CONFIG } from './modules/config.js';
import { capitalizeText, debounce } from './modules/utils.js';
import { DeviceDetector } from './modules/deviceDetector.js';
import { GridManager } from './managers/gridManager.js';
import { WindowManager } from './managers/windowManager.js';
import { IconManager } from './managers/iconManager.js';
import { TaskbarManager } from './managers/taskbarManager.js';

class SistemaOperacional {
    constructor() {
        console.log('SO Constructor: Instanciando módulos principais...');

        this.deviceDetector = new DeviceDetector();
        this.gridManager = new GridManager(CONFIG);
        this.windowManager = new WindowManager(CONFIG, capitalizeText);
        this.taskbarManager = new TaskbarManager(CONFIG, capitalizeText, this.windowManager);
        this.iconManager = new IconManager(CONFIG, this.gridManager, this.windowManager);
    }

    // Método para iniciar o SO após todos os módulos estarem prontos
    async init() {
        console.log('Sistema Operacional pronto para iniciar!');
        
        // 1. Calcular dimensões iniciais do grid e criar visualização
        this.gridManager.calculateGridDimensions();
        this.gridManager.createGridVisualization();

        // 2. Inicializar posições dos ícones (precisamos dos ícones do DOM)
        const desktopIcons = document.querySelectorAll('.desktop-icon');
        this.gridManager.initializeIconPositions(desktopIcons);

        // 3. Configurar eventos dos ícones (cliques, arrastar) através do IconManager
        this.iconManager.setupDesktopIconEvents();

        // 4. Configurar evento de redimensionamento da janela (agora usando GridManager)
        window.addEventListener('resize', debounce(() => {
            this.gridManager.recalculateGrid();
        }, 250));

        // 5. O TaskbarManager já inicia o relógio e configura seus eventos no construtor.
        // E ele se registra para ouvir os eventos do WindowManager.

        console.log('🎯 Sistema Operacional inicializado com sucesso!');
    }
}

// Garante que o DOM esteja completamente carregado antes de inicializar o SO
document.addEventListener('DOMContentLoaded', async () => {
    window.SO = new SistemaOperacional();
    window.SO.init(); // Inicia o sistema operacional
});