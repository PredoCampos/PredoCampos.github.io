/**
 * @file GridManager.js
 * @description Gerencia o grid, com a lógica de colisão de ícones
 * reescrita do zero para ser clara, robusta e fiel às regras de negócio.
 */
export class GridManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.state = soInstance.state;
    }

    initializeIconPositions() {
        const { grid: gridState } = this.state;
        
        if (gridState.ocupado.size > 0) {
            console.log("Layout de ícones carregado. Reposicionando...");
            this.repositionAllIcons();
        } else {
            console.log("Nenhum layout salvo. Usando posições padrão.");
            const iconOrder = {
                'internet': { col: 0, row: 0 },
                'arquivos': { col: 0, row: 1 },
                'notas': { col: 0, row: 2 },
                'calculadora': { col: 0, row: 3 },
                'lixo': { col: gridState.cols - 1, row: gridState.rows - 1 }
            };
    
            const icons = document.querySelectorAll('.desktop-icon');
    
            icons.forEach(icon => {
                const appName = icon.dataset.app;
                let pos = iconOrder[appName];
    
                if (!pos || pos.col >= gridState.cols || pos.row >= gridState.rows) {
                    pos = this._findFirstFreePosition();
                }
                
                this._placeIconAt(icon, pos.col, pos.row, true);
            });
            this._saveIconPositions();
        }
    }

    startIconAnimation() {
        const icons = document.querySelectorAll('.desktop-icon');
        const staggerDelay = 75;

        console.log('Iniciando animação de carregamento dos ícones...');
        icons.forEach((icon, index) => {
            setTimeout(() => {
                icon.classList.add('visible');
            }, index * staggerDelay);
        });
    }

    recalculate() {
        this._calculateDimensions();
        this._updateLayoutCSS();
        this.repositionAllIcons();
    }
    
    snapToGrid(icon) {
        const { grid } = this.state;
        const appName = icon.dataset.app;

        const oldKey = this._findKeyForApp(appName);
        if (oldKey) {
            grid.ocupado.delete(oldKey);
        }

        let col = Math.round((parseInt(icon.style.left) - grid.startX) / grid.cellWidth);
        let row = Math.round((parseInt(icon.style.top) - grid.startY) / grid.cellHeight);

        col = Math.max(0, Math.min(col, grid.cols - 1));
        row = Math.max(0, Math.min(row, grid.rows - 1));
        
        const targetKey = `${col},${row}`;
        
        if (grid.ocupado.has(targetKey)) {
            // MUDANÇA: Chama o novo "roteador" de lógica de colisão.
            this._handleCollision(col, row, icon);
        } else {
            this._placeIconAt(icon, col, row);
        }
    }
    
    /**
     * NOVO: Ponto de entrada que roteia para a lógica de colisão correta
     * com base na coluna.
     */
    _handleCollision(col, row, draggedIcon) {
        const { grid } = this.state;
        const isLastColumn = col === grid.cols - 1;

        if (isLastColumn) {
            this._handleLastColumnCollision(col, row, draggedIcon);
        } else {
            this._handleNormalColumnCollision(col, row, draggedIcon);
        }
    }

    /**
     * NOVO: Implementa as Regras 2 e 3 (Efeito Dominó para Baixo com Transbordamento).
     */
    _handleNormalColumnCollision(col, row, draggedIcon) {
        const iconToDisplaceName = this.state.grid.ocupado.get(`${col},${row}`);
        const iconToDisplace = this._findIconElement(iconToDisplaceName);

        // Coloca o ícone arrastado na posição de destino.
        this._placeIconAt(draggedIcon, col, row);

        // Inicia o efeito dominó com o ícone que foi deslocado.
        if (iconToDisplace) {
            this._rippleDown(col, row + 1, iconToDisplace);
        }
    }

    /**
     * NOVO: Lógica recursiva de Efeito Dominó para Baixo.
     */
    _rippleDown(col, row, iconToMove) {
        const { grid } = this.state;

        // Condição de parada: Transbordamento de Coluna (Regra 3)
        if (row >= grid.rows) {
            this._handleColumnWrap(col + 1, iconToMove);
            return;
        }

        const targetKey = `${col},${row}`;

        // Se a célula de destino estiver vazia, a cascata termina.
        if (!grid.ocupado.has(targetKey)) {
            this._placeIconAt(iconToMove, col, row);
            return;
        }

        // Se estiver ocupada, continua o efeito dominó.
        const nextIconToDisplaceName = grid.ocupado.get(targetKey);
        const nextIconToDisplace = this._findIconElement(nextIconToDisplaceName);

        this._placeIconAt(iconToMove, col, row);
        
        if (nextIconToDisplace) {
            this._rippleDown(col, row + 1, nextIconToDisplace);
        }
    }
    
    /**
     * NOVO: Lida com a Regra 3 (Transbordamento para a próxima coluna).
     */
    _handleColumnWrap(col, iconToMove) {
        const { grid } = this.state;

        // Se não houver mais colunas, não faz nada.
        if (col >= grid.cols) {
            // Idealmente, encontrar qualquer outro lugar, mas por segurança, paramos.
            console.warn("Grid cheio, ícone não pode ser reposicionado:", iconToMove.dataset.app);
            return;
        }

        // Tenta colocar na primeira linha da nova coluna, iniciando um novo dominó se necessário.
        this._rippleDown(col, 0, iconToMove);
    }

    /**
     * NOVO: Implementa a Regra 4 (Lógica complexa da última coluna).
     */
    _handleLastColumnCollision(col, row, draggedIcon) {
        const { grid } = this.state;
        const isLastCell = row === grid.rows - 1;

        // Regra 4.1: Caso único da última célula da grade.
        if (isLastCell) {
            const iconToDisplaceUp = this._findIconElement(this.state.grid.ocupado.get(`${col},${row-1}`));
            this._placeIconAt(draggedIcon, col, row - 1);
            if(iconToDisplaceUp) {
                this._rippleUp(col, row - 2, iconToDisplaceUp);
            }
            return;
        }
        
        // Regra 4.2: Colisões gerais na última coluna.
        const iconToDisplace = this._findIconElement(this.state.grid.ocupado.get(`${col},${row}`));
        this._placeIconAt(draggedIcon, col, row);

        // Prioridade para Baixo: Verifica se há espaço abaixo.
        let hasSpaceBelow = false;
        for (let r = row + 1; r < grid.rows; r++) {
            if (!grid.ocupado.has(`${col},${r}`)) {
                hasSpaceBelow = true;
                break;
            }
        }

        if (hasSpaceBelow) {
            this._rippleDown(col, row + 1, iconToDisplace);
        } else {
            // Recurso para Cima: Se não há espaço, empurra para cima.
            this._rippleUp(col, row - 1, iconToDisplace);
        }
    }

    /**
     * NOVO: Lógica recursiva de Efeito Dominó para Cima.
     */
    _rippleUp(col, row, iconToMove) {
        const { grid } = this.state;
        
        // Condição de parada: Transbordamento Reverso (Regra 4.3)
        if (row < 0) {
            this._handleReverseWrap(col - 1, iconToMove);
            return;
        }

        const targetKey = `${col},${row}`;

        if (!grid.ocupado.has(targetKey)) {
            this._placeIconAt(iconToMove, col, row);
            return;
        }

        const nextIconToDisplaceName = grid.ocupado.get(targetKey);
        const nextIconToDisplace = this._findIconElement(nextIconToDisplaceName);
        
        this._placeIconAt(iconToMove, col, row);
        
        if (nextIconToDisplace) {
            this._rippleUp(col, row - 1, nextIconToDisplace);
        }
    }

    /**
     * NOVO: Lida com a Regra 4.3 (Transbordamento Reverso).
     */
    _handleReverseWrap(col, iconToMove) {
        const { grid } = this.state;
        if (col < 0) {
            console.warn("Grid cheio, ícone não pode ser reposicionado:", iconToMove.dataset.app);
            return;
        }
        // Tenta colocar na última linha da coluna anterior, iniciando um dominó para cima se necessário.
        this._rippleUp(col, grid.rows - 1, iconToMove);
    }
    
    // MÉTODOS AUXILIARES (sem alterações, mas mantidos por serem essenciais)
    _placeIconAt(icon, col, row, isInitializing = false) {
        const key = `${col},${row}`;
        const coords = this._getCoordsFromGridKey(key);
        icon.style.left = `${coords.x}px`;
        icon.style.top = `${coords.y}px`;
        this.state.grid.ocupado.set(key, icon.dataset.app);

        if (!isInitializing) {
            this._saveIconPositions();
        }
    }
    
    repositionAllIcons() {
        this.state.grid.ocupado.forEach((appName, key) => {
            const icon = this._findIconElement(appName);
            if(icon) {
                 const coords = this._getCoordsFromGridKey(key);
                 icon.style.left = `${coords.x}px`;
                 icon.style.top = `${coords.y}px`;
            }
        });
    }

    _saveIconPositions() {
        const iconPositions = Array.from(this.state.grid.ocupado.entries());
        this.so.persistenceManager.save({ iconPositions: iconPositions });
    }

    _calculateDimensions() {
        const { grid: gridConfig } = this.config;
        const { device, grid: gridState } = this.state;
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const taskbarElement = document.querySelector(this.config.selectors.taskbar);
        const taskbarStyle = getComputedStyle(taskbarElement);
        gridState.taskbarHeight = parseInt(taskbarStyle.height, 10);
        
        const marginPercentage = device.isMobile ? gridConfig.marginPercentageMobile : gridConfig.marginPercentage;
        const iconBaseSize = device.isMobile ? gridConfig.iconBaseSizeMobile : gridConfig.iconBaseSize;

        gridState.margin = Math.floor(Math.min(screenW, screenH) * marginPercentage);

        const safetyMarginBottom = 15;
        const availableW = screenW - (gridState.margin * 2);
        const availableH = screenH - gridState.taskbarHeight - (gridState.margin * 2) - safetyMarginBottom;

        const idealCellWidth = iconBaseSize + 20;
        const idealCellHeight = iconBaseSize + 30;

        gridState.cols = Math.max(1, Math.floor(availableW / idealCellWidth));
        gridState.rows = Math.max(1, Math.floor(availableH / idealCellHeight));

        gridState.cellWidth = Math.floor(availableW / gridState.cols);
        gridState.cellHeight = Math.floor(availableH / gridState.rows);
        
        const totalGridWidth = gridState.cols * gridState.cellWidth;
        const leftoverW = availableW - totalGridWidth;
        
        gridState.startX = gridState.margin + Math.floor(leftoverW / 2);
        gridState.startY = gridState.margin;
    }
    
    _updateLayoutCSS() {
        const { selectors } = this.config;
        const taskbarHeight = `${this.state.grid.taskbarHeight}px`;
        const desktopHeight = `calc(100vh - ${taskbarHeight})`;
        document.querySelector(selectors.desktop).style.height = desktopHeight;
        document.querySelector(selectors.windowsContainer).style.height = desktopHeight;
    }

    _getCoordsFromGridKey(key) {
        const { grid } = this.state;
        const [col, row] = key.split(',').map(Number);
        
        let iconWrapperWidth;
        if (this.so.state.device.isMobile) {
            iconWrapperWidth = 80;
        } else {
            iconWrapperWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-icon-wrapper'));
        }
        
        const x = grid.startX + (col * grid.cellWidth) + (grid.cellWidth - iconWrapperWidth) / 2;
        const y = grid.startY + (row * grid.cellHeight);
        return { x, y };
    }

    _findKeyForApp(appName) {
        for (const [key, name] of this.state.grid.ocupado.entries()) {
            if (name === appName) return key;
        }
        return null;
    }

    _findIconElement(appName) {
        return document.querySelector(`.desktop-icon[data-app="${appName}"]`);
    }
    
    _findFirstFreePosition() {
        for (let c = 0; c < this.state.grid.cols; c++) {
            for (let r = 0; r < this.state.grid.rows; r++) {
                if (!this.state.grid.ocupado.has(`${c},${r}`)) return { col: c, row: r };
            }
        }
        return { col: 0, row: 0 };
    }
}