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
import { DesktopInteractions } from './interactions/DesktopInteractions.js';
import { MobileInteractions } from './interactions/MobileInteractions.js';
// MUDANÇA: Importa a nova fábrica de UI.
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

        // MUDANÇA: Instancia a fábrica junto com os outros gerenciadores.
        this.uiFactory = new UIFactory();
        this.gridManager = new GridManager(this);
        this.windowManager = new WindowManager(this);
        this.taskManager = new TaskManager(this);
        this.appRunner = new AppRunner(this);
        this.menuManager = new MenuManager(this);

        this.gridManager.recalculate();
        this.gridManager.initializeIconPositions();

        this._startClock();

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

    _startClock() {
        const clockElement = document.querySelector(this.config.selectors.taskbarClock);
        const dateElement = document.querySelector(this.config.selectors.taskbarData);

        if (!clockElement || !dateElement) {
            console.warn("Elementos de relógio ou data não encontrados na taskbar.");
            return;
        }

        const updateDateTime = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            clockElement.textContent = `${hours}:${minutes}`;

            const day = now.getDate().toString().padStart(2, '0');
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const year = now.getFullYear();
            dateElement.textContent = `${day}/${month}/${year}`;
        };

        updateDateTime();
        setInterval(updateDateTime, 10000);
    }

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