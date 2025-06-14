/**
 * @file GridManager.js
 * @description Gerencia o grid, com a lógica de animação dos ícones separada
 * e com cálculos de dimensão ajustados para mobile.
 */
export class GridManager {
    constructor(soInstance) {
        this.so = soInstance;
        this.config = soInstance.config;
        this.state = soInstance.state;
    }

    /**
     * Posiciona os ícones na sua devida posição, mas os mantém invisíveis.
     */
    initializeIconPositions() {
        const { grid: gridState } = this.state;
        gridState.ocupado.clear();
        
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
            
            // Apenas posiciona o ícone. Ele começará invisível devido ao CSS.
            this._placeIconAt(icon, pos.col, pos.row);
        });
    }

    /**
     * Inicia a animação de aparição dos ícones em cascata.
     */
    startIconAnimation() {
        const icons = document.querySelectorAll('.desktop-icon');
        const staggerDelay = 75; // Atraso de 75ms entre cada ícone

        console.log('Iniciando animação de carregamento dos ícones...');
        icons.forEach((icon, index) => {
            // Agenda a sua aparição com um atraso
            setTimeout(() => {
                icon.classList.add('visible');
            }, index * staggerDelay);
        });
    }

    recalculate() {
        this._calculateDimensions();
        this._updateLayoutCSS();
        if (this.state.grid.visualizer) {
            this.state.grid.visualizer.remove();
        }
        this.createVisualization();
        this.repositionAllIcons();
    }
    
    snapToGrid(icon) {
        const { grid } = this.state;
        const appName = icon.dataset.app;

        const oldKey = this._findKeyForApp(appName);
        if (oldKey) {
            grid.ocupado.delete(oldKey);
        }

        let col = Math.round((parseInt(icon.style.left) - grid.startX) / grid.cellSize);
        let row = Math.round((parseInt(icon.style.top) - grid.startY) / grid.cellSize);

        col = Math.max(0, Math.min(col, grid.cols - 1));
        row = Math.max(0, Math.min(row, grid.rows - 1));
        
        const targetKey = `${col},${row}`;
        
        if (grid.ocupado.has(targetKey)) {
            this._moverIconesCascataVerticalNova(col, row, icon);
        } else {
            this._placeIconAt(icon, col, row);
        }
    }
    
    _moverIconesCascataVerticalNova(coluna, linha, iconeMovido) {
        if (coluna === this.state.grid.cols - 1) {
            this._aplicarRegraUltimaColuna(coluna, linha, iconeMovido);
        } else {
            this._moverCascataNormal(coluna, linha, iconeMovido);
        }
    }

    _aplicarRegraUltimaColuna(coluna, linha, iconeMovido) {
        const ultimaLinha = this.state.grid.rows - 1;
        
        if (linha === ultimaLinha && this.state.grid.ocupado.has(`${coluna},${linha}`)) {
            linha = ultimaLinha - 1; 
        }
        
        const temEspacoVazio = this._verificarEspacoVazio(coluna, linha, ultimaLinha);
        
        if (temEspacoVazio) {
            this._cascataParaBaixo(coluna, linha, iconeMovido);
        } else {
            this._empurrarParaCima(coluna, linha, iconeMovido);
        }
    }

    _cascataParaBaixo(coluna, linha, iconeMovido) {
        const iconesParaMover = [];
        for (let l = linha; l < this.state.grid.rows; l++) {
            const chave = `${coluna},${l}`;
            if (this.state.grid.ocupado.has(chave)) {
                const nomeApp = this.state.grid.ocupado.get(chave);
                const icone = this._findIconElement(nomeApp);
                if (icone && icone !== iconeMovido) {
                    iconesParaMover.push({ icone, nomeApp, linhaOriginal: l });
                }
            }
        }
        
        iconesParaMover.forEach(item => this.state.grid.ocupado.delete(`${coluna},${item.linhaOriginal}`));
        
        this._placeIconAt(iconeMovido, coluna, linha);

        iconesParaMover.forEach((item, index) => {
            const novaLinha = linha + 1 + index;
            if (novaLinha < this.state.grid.rows) {
                this._placeIconAt(item.icone, coluna, novaLinha);
            }
        });
    }

    _empurrarParaCima(coluna, linha, iconeMovido) {
        const iconeDeslocadoNome = this.state.grid.ocupado.get(`${coluna},${linha}`);
        if(!iconeDeslocadoNome) {
             this._placeIconAt(iconeMovido, coluna, linha);
             return;
        }
        const iconeDeslocado = this._findIconElement(iconeDeslocadoNome);

        this._placeIconAt(iconeMovido, coluna, linha);

        let novaLinha = linha - 1;
        if (novaLinha < 0) {
            this._moverParaColunaAnterior(iconeDeslocado, coluna);
        } else {
            if (this.state.grid.ocupado.has(`${coluna},${novaLinha}`)) {
                 this._empurrarParaCima(coluna, novaLinha, iconeDeslocado);
            } else {
                 this._placeIconAt(iconeDeslocado, coluna, novaLinha);
            }
        }
    }
    
    _moverParaColunaAnterior(icone, colunaOriginal) {
        const colunaAnterior = colunaOriginal - 1;
        if (colunaAnterior < 0) return;
        
        let linhaDestino = this.state.grid.rows - 1;

        if(this.state.grid.ocupado.has(`${colunaAnterior},${linhaDestino}`)) {
             this._aplicarRegraUltimaColuna(colunaAnterior, linhaDestino, icone);
        } else {
             this._placeIconAt(icone, colunaAnterior, linhaDestino);
        }
    }

    _moverCascataNormal(coluna, linha, iconeMovido) {
        const iconesParaMover = [];
        for (let l = linha; l < this.state.grid.rows; l++) {
            const chave = `${coluna},${l}`;
            if (this.state.grid.ocupado.has(chave)) {
                const nomeApp = this.state.grid.ocupado.get(chave);
                const icone = this._findIconElement(nomeApp);
                if (icone && icone !== iconeMovido) {
                    iconesParaMover.push({ icone, nomeApp });
                }
            }
        }
        
        this.state.grid.ocupado.delete(`${coluna},${linha}`);
        this._placeIconAt(iconeMovido, coluna, linha);

        let l = linha + 1;
        let c = coluna;

        for (const item of iconesParaMover) {
            if (l >= this.state.grid.rows) {
                l = 0;
                c++;
            }
            if (c >= this.state.grid.cols) break; 

            const chaveDestino = `${c},${l}`;
            if (this.state.grid.ocupado.has(chaveDestino)) {
                this._moverCascataNormal(c, l, item.icone);
            } else {
                this._placeIconAt(item.icone, c, l);
            }
            l++;
        }
    }

    _placeIconAt(icon, col, row) {
        const key = `${col},${row}`;
        const coords = this._getCoordsFromGridKey(key);
        icon.style.left = `${coords.x}px`;
        icon.style.top = `${coords.y}px`;
        this.state.grid.ocupado.set(key, icon.dataset.app);
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

    _calculateDimensions() {
        const { grid: gridConfig } = this.config;
        const { device, grid: gridState } = this.state;
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const taskbarElement = document.querySelector(this.config.selectors.taskbar);
        const taskbarStyle = getComputedStyle(taskbarElement);
        gridState.taskbarHeight = parseInt(taskbarStyle.height, 10);
        
        const marginPercentage = device.isMobile ? gridConfig.marginPercentageMobile : gridConfig.marginPercentage;
        const iconSize = device.isMobile ? gridConfig.iconBaseSizeMobile : gridConfig.iconBaseSize;

        gridState.margin = Math.floor(Math.min(screenW, screenH) * marginPercentage);

        // MUDANÇA (BUG #7): Adiciona uma margem de segurança no fundo
        const safetyMarginBottom = 15; // px de espaço extra acima da taskbar
        const availableW = screenW - (gridState.margin * 2);
        const availableH = screenH - gridState.taskbarHeight - (gridState.margin * 2) - safetyMarginBottom;

        const idealCellSize = iconSize + 20;
        gridState.cols = Math.max(2, Math.floor(availableW / idealCellSize));
        gridState.rows = Math.max(2, Math.floor(availableH / idealCellSize));

        gridState.cellSize = Math.min(Math.floor(availableW / gridState.cols), Math.floor(availableH / gridState.rows));

        gridState.width = gridState.cols * gridState.cellSize;
        gridState.height = gridState.rows * gridState.cellSize;

        const leftoverW = availableW - gridState.width;
        const leftoverH = availableH - gridState.height;
        
        let initialStartX = gridState.margin + Math.floor(leftoverW / 2);
        let initialStartY = gridState.margin + Math.floor(leftoverH / 2);

        // MUDANÇA (BUG #8): Remove o deslocamento fixo que causava assimetria
        // initialStartX -= 20; 
        initialStartY += 10;
        
        gridState.startX = Math.max(gridState.margin, initialStartX);
        gridState.startY = Math.max(gridState.margin, initialStartY);
    }
    
    _updateLayoutCSS() {
        const { selectors } = this.config;
        const taskbarHeight = `${this.state.grid.taskbarHeight}px`;
        const desktopHeight = `calc(100vh - ${taskbarHeight})`;
        document.querySelector(selectors.desktop).style.height = desktopHeight;
        document.querySelector(selectors.windowsContainer).style.height = desktopHeight;
    }

    _verificarEspacoVazio(coluna, linhaInicio, ultimaLinha) {
        for (let l = linhaInicio; l <= ultimaLinha; l++) {
            if (!this.state.grid.ocupado.has(`${coluna},${l}`)) {
                return true;
            }
        }
        return false;
    }

    _findFirstFreePosition() {
        for (let c = 0; c < this.state.grid.cols; c++) {
            for (let r = 0; r < this.state.grid.rows; r++) {
                if (!this.state.grid.ocupado.has(`${c},${r}`)) return { col: c, row: r };
            }
        }
        return { col: 0, row: 0 };
    }

    _getCoordsFromGridKey(key) {
        const { grid } = this.state;
        const [col, row] = key.split(',').map(Number);
        return { x: grid.startX + (col * grid.cellSize), y: grid.startY + (row * grid. cellSize) };
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

    createVisualization() {
        const { desktop } = this.config.selectors;
        const { grid } = this.state;
        const visualizer = document.createElement('div');
        visualizer.id = 'grid-visualization';
        visualizer.style.position = 'absolute';
        visualizer.style.top = '0';
        visualizer.style.left = '0';
        visualizer.style.width = '100%';
        visualizer.style.height = `calc(100% - ${grid.taskbarHeight}px)`;
        visualizer.style.pointerEvents = 'none';
        visualizer.style.zIndex = '1';
        this.state.grid.visualizer = visualizer;
        document.querySelector(desktop).appendChild(visualizer);
    }
}