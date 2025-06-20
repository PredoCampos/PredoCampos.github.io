/**
 * @file SistemaOperacional.js
 * @description Classe principal que orquestra todo o sistema operacional.
 */

import { STATIC_CONFIG } from './config.js';
import { detectDevice, applyMobileFixes } from './utils.js';
import { GridManager } from './managers/GridManager.js';
import { WindowManager } from './managers/WindowManager.js';
import { TaskManager } from './managers/TaskManager.js';
import { AppRunner } from './managers/AppRunner.js';
import { MenuManager } from './managers/MenuManager.js';
import { PersistenceManager } from './managers/PersistenceManager.js';
// MUDANÇA: Importa o novo ClockManager
import { ClockManager } from './managers/ClockManager.js';
import { DesktopInteractions } from './interactions/DesktopInteractions.js';
import { MobileInteractions } from './interactions/MobileInteractions.js';
import { UIFactory } from './ui/UIFactory.js';


export class SistemaOperacional {
    constructor() {
        /** @type {object} Configurações estáticas do sistema. */
        this.config = STATIC_CONFIG;

        this.persistenceManager = new PersistenceManager();

        /** @type {object} Armazena o estado dinâmico da aplicação. */
        this.state = {
            device: detectDevice(),
            grid: {
                ocupado: new Map(),
                taskbarHeight: 0, margin: 0, cellWidth: 0, cellHeight: 0,
                startX: 0, startY: 0, cols: 0, rows: 0,
                width: 0, height: 0, visualizer: null
            },
            windows: {
                abertas: new Map(),
                proximoId: 1,
                zIndexAtual: this.config.maxZIndex
            },
            ui: {
                isDragging: false
            }
        };

        this._initialize();
    }

    _initialize() {
        this._loadState();

        if (this.state.device.isMobile) {
            applyMobileFixes();
        }

        this.uiFactory = new UIFactory();
        this.gridManager = new GridManager(this);
        this.windowManager = new WindowManager(this);
        this.taskManager = new TaskManager(this);
        this.appRunner = new AppRunner(this);
        this.menuManager = new MenuManager(this);
        // MUDANÇA: Instancia e inicia o ClockManager
        this.clockManager = new ClockManager(this);
        this.clockManager.start();

        this.gridManager.recalculate();
        this.gridManager.initializeIconPositions();

        if (this.state.device.isMobile) {
            this.interactions = new MobileInteractions(this);
        } else {
            this.interactions = new DesktopInteractions(this);
        }
        this.interactions.initialize();

        this._setupEventListeners();
    }
    
    _loadState() {
        const savedState = this.persistenceManager.load();
        if (!savedState) return;

        if (savedState.iconPositions) {
            this.state.grid.ocupado = new Map(savedState.iconPositions);
        }
    }

    // MUDANÇA: O método _startClock() foi removido daqui.

    _setupEventListeners() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.gridManager.recalculate();
            }, 250);
        });
    }
}