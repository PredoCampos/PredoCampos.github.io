// assets/js/managers/gridManager.js
// Gerencia o sistema de grid do desktop para posicionamento e organização dos ícones.

import { CONFIG } from '../modules/config.js'; // Importa as configurações globais
import { debounce } from '../modules/utils.js'; // Importa a função debounce

export class GridManager {
    /**
     * @param {object} config - O objeto de configurações globais.
     */
    constructor(config) {
        this.config = config;
        this.gridOcupado = new Map(); // Mapa para rastrear posições ocupadas no grid
        this.gridVisualizacao = null; // Elemento para a visualização do grid
        this.debounceTimer = null; // Para o debounce do redimensionamento
    }

    /**
     * Calcula dinamicamente as dimensões do grid (colunas, linhas, tamanho da célula)
     * baseado nas dimensões da tela e nas configurações.
     * Atualiza as propriedades CONFIG relacionadas ao grid.
     */
    calculateGridDimensions() {
        const larguraTela = window.innerWidth;
        const alturaTela = window.innerHeight;
        const menorLado = Math.min(larguraTela, alturaTela);

        // Calcula altura da barra de tarefas (baseado na porcentagem do menor lado)
        this.config.taskbarHeight = Math.floor(menorLado * this.config.taskbarPercentage);

        // Calcula margem do grid (baseado na porcentagem do menor lado)
        this.config.gridMargin = Math.floor(menorLado * this.config.gridMarginPercentage);

        // Área disponível para o grid (descontando taskbar e margens)
        const larguraDisponivel = larguraTela - (this.config.gridMargin * 2);
        const alturaDisponivel = alturaTela - this.config.taskbarHeight - (this.config.gridMargin * 2);

        // Calcula tamanho ideal da célula baseado no tamanho base do ícone + padding
        const tamanhoIdealCelula = this.config.iconSize + 20;

        // Calcula quantas colunas e linhas cabem
        this.config.maxColunas = Math.floor(larguraDisponivel / tamanhoIdealCelula);
        this.config.maxLinhas = Math.floor(alturaDisponivel / tamanhoIdealCelula);

        // Garante pelo menos um número mínimo de colunas e linhas
        this.config.maxColunas = Math.max(2, this.config.maxColunas);
        this.config.maxLinhas = Math.max(2, this.config.maxLinhas);

        // Calcula tamanho real da célula para usar todo o espaço disponível
        this.config.gridSize = Math.min(
            Math.floor(larguraDisponivel / this.config.maxColunas),
            Math.floor(alturaDisponivel / this.config.maxLinhas)
        );

        // Calcula área real do grid
        this.config.gridWidth = this.config.maxColunas * this.config.gridSize;
        this.config.gridHeight = this.config.maxLinhas * this.config.gridSize;

        // Centraliza o grid na área disponível
        this.config.gridStartX = this.config.gridMargin + Math.floor((larguraDisponivel - this.config.gridWidth) / 2);
        this.config.gridStartY = this.config.gridMargin + Math.floor((alturaDisponivel - this.config.gridHeight) / 2);

        // Ajuste específico para mobile - garantir centralização
        if (this.config.isMobile) {
            const espacoSobrandoX = larguraTela - this.config.gridWidth;
            const espacoSobrandoY = (alturaTela - this.config.taskbarHeight) - this.config.gridHeight;
            
            this.config.gridStartX = Math.floor(espacoSobrandoX / 2);
            this.config.gridStartY = Math.floor(espacoSobrandoY / 2);
        } else {
            // Desktop: ajuste fino para reduzir margem esquerda
            const espacoSobrandoX = larguraTela - this.config.gridWidth;
            this.config.gridStartX = Math.floor(espacoSobrandoX / 2) - 10;
            this.config.gridStartX = Math.max(10, this.config.gridStartX); // Garante margem mínima
        }
        
        this.updateTaskbarAndDesktopStyles();

        console.log('GridManager: Dimensões do grid calculadas:', {
            colunas: this.config.maxColunas,
            linhas: this.config.maxLinhas,
            tamanhoGrid: this.config.gridSize,
            margemGrid: this.config.gridMargin
        });
    }

    /**
     * Atualiza os estilos CSS da barra de tarefas, desktop e container de janelas
     * com base na altura da taskbar calculada.
     * Isso poderia ser feito também com variáveis CSS customizadas.
     */
    updateTaskbarAndDesktopStyles() {
        // Usa `setProperty` para definir uma variável CSS customizada no root,
        // que pode ser usada em seu CSS para responsividade.
        document.documentElement.style.setProperty('--taskbar-height', `${this.config.taskbarHeight}px`);

        const desktop = document.querySelector(this.config.desktopSelector);
        if (desktop) {
            desktop.style.height = `calc(100vh - ${this.config.taskbarHeight}px)`;
        }
        
        const windowsContainer = document.querySelector(this.config.windowsContainerSelector);
        if (windowsContainer) {
            windowsContainer.style.height = `calc(100vh - ${this.config.taskbarHeight}px)`;
        }
    }

    /**
     * Recalcula o grid e reposiciona os ícones, geralmente após um redimensionamento da janela.
     */
    recalculateGrid() {
        console.log('GridManager: Recalculando grid...');
        const posicoesIcones = this.saveIconPositions(); // Salva posições antes de recalcular
        
        this.calculateGridDimensions(); // Recalcula novas dimensões
        
        this.removeGridVisualization(); // Remove visualização antiga
        this.createGridVisualization(); // Recria visualização
        
        this.restoreIconPositions(posicoesIcones); // Reposiciona ícones nas novas células
        
        console.log('GridManager: Grid redimensionado e ícones reposicionados.');
    }

    /**
     * Salva as posições atuais dos ícones no grid antes de um recálculo.
     * @returns {Map<string, {coluna: number, linha: number}>} Um mapa com o nome do app e sua posição.
     */
    saveIconPositions() {
        const posicoes = new Map();
        for (const [chave, nomeApp] of this.gridOcupado.entries()) {
            const [coluna, linha] = chave.split(',').map(Number);
            posicoes.set(nomeApp, { coluna, linha });
        }
        return posicoes;
    }

    /**
     * Restaura as posições dos ícones no grid após um recálculo,
     * tentando encaixá-los nas células equivalentes ou em uma nova posição livre.
     * @param {Map<string, {coluna: number, linha: number}>} previousPositions - Posições anteriores dos ícones.
     */
    restoreIconPositions(previousPositions) {
        this.gridOcupado.clear(); // Limpa o grid para preencher novamente
        const desktopIcons = document.querySelectorAll('.desktop-icon');

        // Primeiramente, tenta colocar os ícones nas suas posições antigas, se possível
        desktopIcons.forEach(icone => {
            const nomeApp = icone.dataset.app;
            const posicaoAntiga = previousPositions.get(nomeApp);

            if (posicaoAntiga && 
                posicaoAntiga.coluna < this.config.maxColunas && 
                posicaoAntiga.linha < this.config.maxLinhas &&
                !this.gridOcupado.has(`${posicaoAntiga.coluna},${posicaoAntiga.linha}`)) {
                
                const coordenadas = this.getGridCoordinates(`${posicaoAntiga.coluna},${posicaoAntiga.linha}`);
                icone.style.left = `${coordenadas.x}px`;
                icone.style.top = `${coordenadas.y}px`;
                this.gridOcupado.set(`${posicaoAntiga.coluna},${posicaoAntiga.linha}`, nomeApp);
            }
        });

        // Para os ícones que não puderam ser restaurados (ex: grid menor, colisão),
        // ou que não tinham posição anterior, encontra uma posição livre.
        desktopIcons.forEach(icone => {
            const nomeApp = icone.dataset.app;
            if (!this.findIconGridKey(nomeApp)) { // Se o ícone ainda não foi posicionado
                const posicaoLivre = this.findFreePosition();
                if (posicaoLivre) {
                    const coordenadas = this.getGridCoordinates(`${posicaoLivre.coluna},${posicaoLivre.linha}`);
                    icone.style.left = `${coordenadas.x}px`;
                    icone.style.top = `${coordenadas.y}px`;
                    this.gridOcupado.set(`${posicaoLivre.coluna},${posicaoLivre.linha}`, nomeApp);
                }
            }
        });
    }

    /**
     * Cria a visualização do grid no desktop (células invisíveis para debug/alinhamento).
     */
    createGridVisualization() {
        const desktop = document.querySelector(this.config.desktopSelector);
        if (!desktop) {
            console.error('GridManager: Elemento desktop não encontrado para criar visualização do grid.');
            return;
        }

        this.gridVisualizacao = document.createElement('div');
        this.gridVisualizacao.id = 'grid-visualization';
        this.gridVisualizacao.style.position = 'absolute';
        this.gridVisualizacao.style.top = '0';
        this.gridVisualizacao.style.left = '0';
        this.gridVisualizacao.style.width = '100%';
        this.gridVisualizacao.style.height = '100%';
        this.gridVisualizacao.style.pointerEvents = 'none'; // Para não interferir com cliques
        this.gridVisualizacao.style.zIndex = '1';
        
        for (let linha = 0; linha < this.config.maxLinhas; linha++) {
            for (let coluna = 0; coluna < this.config.maxColunas; coluna++) {
                const celula = document.createElement('div');
                celula.className = 'grid-cell'; // Estilos definidos no CSS
                celula.style.left = `${this.config.gridStartX + (coluna * this.config.gridSize)}px`;
                celula.style.top = `${this.config.gridStartY + (linha * this.config.gridSize)}px`;
                celula.style.width = `${this.config.gridSize}px`;
                celula.style.height = `${this.config.gridSize}px`;
                celula.dataset.posicao = `${coluna},${linha}`;
                
                this.gridVisualizacao.appendChild(celula);
            }
        }
        
        desktop.appendChild(this.gridVisualizacao);
        console.log(`GridManager: Visualização do grid criada: ${this.config.maxColunas}x${this.config.maxLinhas}`);
    }

    /**
     * Remove a visualização do grid do DOM.
     */
    removeGridVisualization() {
        if (this.gridVisualizacao) {
            this.gridVisualizacao.remove();
            this.gridVisualizacao = null;
        }
    }

    /**
     * Encaixa um ícone na célula da grade mais próxima após ser solto.
     * Lida com colisões aplicando a lógica de cascata.
     * @param {HTMLElement} iconElement - O elemento DOM do ícone.
     * @param {{x: number, y: number}} currentIconPos - A posição atual (left, top) do ícone em pixels.
     */
    snapIconToGrid(iconElement, currentIconPos) {
        const nomeApp = iconElement.dataset.app;
        
        // Remove o ícone da posição atual no grid (se estiver lá)
        const chaveAtual = this.findIconGridKey(nomeApp);
        if (chaveAtual) {
            this.gridOcupado.delete(chaveAtual);
        }

        // Calcula a posição da grade mais próxima
        let targetCol = Math.round((currentIconPos.x - this.config.gridStartX) / this.config.gridSize);
        let targetRow = Math.round((currentIconPos.y - this.config.gridStartY) / this.config.gridSize);

        // Garante que a posição alvo está dentro dos limites do grid
        targetCol = Math.max(0, Math.min(targetCol, this.config.maxColunas - 1));
        targetRow = Math.max(0, Math.min(targetRow, this.config.maxLinhas - 1));

        const targetKey = `${targetCol},${targetRow}`;

        // Lida com colisões (se a posição alvo já estiver ocupada por outro ícone)
        if (this.gridOcupado.has(targetKey) && this.gridOcupado.get(targetKey) !== nomeApp) {
            console.log(`GridManager: Colisão detectada para ${nomeApp} em ${targetKey}.`);
            // Se houver colisão, o ícone que estava na posição é empurrado
            this.handleCollision(targetCol, targetRow, iconElement);
        }

        // Finalmente, posiciona o ícone movido
        // A posição pode ter sido alterada pelo handleCollision, então verifica novamente.
        // Se após a colisão, a posição ainda estiver ocupada pelo ícone original, isso é tratado na cascata.
        // O ponto é que agora o iconeElement precisa ir para a posição final que foi definida para ele.
        const finalCoords = this.getGridCoordinates(targetKey); // Pega as coordenadas para a chave de destino
        iconElement.style.left = `${finalCoords.x}px`;
        iconElement.style.top = `${finalCoords.y}px`;
        this.gridOcupado.set(targetKey, nomeApp);
        console.log(`GridManager: ${nomeApp} encaixado na posição final ${targetKey}.`);
    }

    /**
     * Gerencia a lógica de movimentação em cascata quando ocorre uma colisão de ícones.
     * Esta é a lógica aprimorada de cascata vertical/horizontal que você pediu.
     * @param {number} col - Coluna onde ocorreu a colisão.
     * @param {number} row - Linha onde ocorreu a colisão.
     * @param {HTMLElement} movedIcon - O ícone que foi movido e causou a colisão.
     */
    handleCollision(col, row, movedIcon) {
        const occupantAppName = this.gridOcupado.get(`${col},${row}`);
        const occupantIcon = document.querySelector(`.desktop-icon[data-app="${occupantAppName}"]`);

        if (!occupantIcon) {
            console.warn(`GridManager: Ocupante ${occupantAppName} não encontrado no DOM.`);
            return;
        }

        // 1. Tentar mover o ocupante para baixo na mesma coluna
        for (let r = row + 1; r < this.config.maxLinhas; r++) {
            const nextKey = `${col},${r}`;
            if (!this.gridOcupado.has(nextKey)) {
                // Encontrou espaço livre abaixo, move o ocupante para lá
                this.gridOcupado.delete(`${col},${row}`); // Remove ocupante da posição atual
                const newCoords = this.getGridCoordinates(nextKey);
                occupantIcon.style.left = `${newCoords.x}px`;
                occupantIcon.style.top = `${newCoords.y}px`;
                this.gridOcupado.set(nextKey, occupantAppName);
                console.log(`GridManager: ${occupantAppName} movido para ${nextKey} (cascata para baixo).`);
                return; // Colisão resolvida
            }
        }

        // 2. Se a coluna estiver cheia (não há espaço abaixo), tentar mover o ocupante para a próxima coluna
        for (let c = col + 1; c < this.config.maxColunas; c++) {
            for (let r = 0; r < this.config.maxLinhas; r++) {
                const nextKey = `${c},${r}`;
                if (!this.gridOcupado.has(nextKey)) {
                    // Encontrou espaço livre na próxima coluna
                    this.gridOcupado.delete(`${col},${row}`);
                    const newCoords = this.getGridCoordinates(nextKey);
                    occupantIcon.style.left = `${newCoords.x}px`;
                    occupantIcon.style.top = `${newCoords.y}px`;
                    this.gridOcupado.set(nextKey, occupantAppName);
                    console.log(`GridManager: ${occupantAppName} movido para ${nextKey} (próxima coluna).`);
                    return; // Colisão resolvida
                }
            }
        }

        // 3. Se todas as colunas estiverem cheias (muito improvável com este layout),
        //    encontrar a primeira posição livre e mover para lá (fallback)
        const freePos = this.findFreePosition();
        if (freePos) {
            this.gridOcupado.delete(`${col},${row}`);
            const newCoords = this.getGridCoordinates(`${freePos.coluna},${freePos.linha}`);
            occupantIcon.style.left = `${newCoords.x}px`;
            occupantIcon.style.top = `${newCoords.y}px`;
            this.gridOcupado.set(`${freePos.coluna},${freePos.linha}`, occupantAppName);
            console.warn(`GridManager: Todas as posições desejadas ocupadas. ${occupantAppName} movido para a primeira posição livre: ${freePos.coluna},${freePos.linha}.`);
        } else {
            console.error('GridManager: Não foi possível encontrar uma posição livre para o ícone após colisão.');
            // Se não encontrou nenhuma posição livre, o ícone original permanece onde estava
            // e o ícone movido pode ter que retornar à sua posição original ou ser tratado de outra forma.
        }
    }


    /**
     * Encontra uma posição livre no grid, começando da primeira célula.
     * @returns {{coluna: number, linha: number} | null} A primeira posição livre ou null se o grid estiver cheio.
     */
    findFreePosition() {
        for (let linha = 0; linha < this.config.maxLinhas; linha++) {
            for (let coluna = 0; coluna < this.config.maxColunas; coluna++) {
                const chave = `${coluna},${linha}`;
                if (!this.gridOcupado.has(chave)) {
                    return { coluna, linha };
                }
            }
        }
        return null; // Grid completamente cheio
    }

    /**
     * Obtém a chave do grid (string "coluna,linha") a partir das coordenadas x, y.
     * @param {number} x - Coordenada X em pixels.
     * @param {number} y - Coordenada Y em pixels.
     * @returns {string} A chave do grid (ex: "0,0").
     */
    getGridKey(x, y) {
        const coluna = Math.round((x - this.config.gridStartX) / this.config.gridSize);
        const linha = Math.round((y - this.config.gridStartY) / this.config.gridSize);
        return `${coluna},${linha}`;
    }

    /**
     * Obtém as coordenadas x, y em pixels a partir de uma chave do grid.
     * @param {string} gridKey - A chave do grid (ex: "0,0").
     * @returns {{x: number, y: number}} As coordenadas em pixels.
     */
    getGridCoordinates(gridKey) {
        const [coluna, linha] = gridKey.split(',').map(Number);
        return {
            x: this.config.gridStartX + (coluna * this.config.gridSize),
            y: this.config.gridStartY + (linha * this.config.gridSize)
        };
    }

    /**
     * Encontra a chave do grid para um ícone específico, procurando no mapa `gridOcupado`.
     * @param {string} appName - O nome do aplicativo associado ao ícone.
     * @returns {string | null} A chave do grid ou null se não encontrada.
     */
    findIconGridKey(appName) {
        for (const [key, app] of this.gridOcupado.entries()) {
            if (app === appName) {
                return key;
            }
        }
        return null;
    }

    /**
     * Inicializa as posições padrão dos ícones no grid.
     * Limpa o gridOcupado e preenche com as posições iniciais.
     * @param {HTMLElement[]} icons - Array de elementos DOM dos ícones.
     */
    initializeIconPositions(icons) {
        this.gridOcupado.clear();
        
        // Define ordem específica e posições padrão dos ícones
        const defaultIconOrder = {
            'internet': { coluna: 0, linha: 0 },
            'arquivos': { coluna: 0, linha: 1 },
            'notas': { coluna: 0, linha: 2 },
            'calculadora': { coluna: 0, linha: 3 },
            'cobra': { coluna: 0, linha: 4 },
            // O ícone 'lixo' será posicionado na última célula disponível
        };

        icons.forEach(icone => {
            const nomeApp = icone.dataset.app;
            let targetPosition = defaultIconOrder[nomeApp];

            if (nomeApp === 'lixo') {
                // Para o lixo, tentar a última posição disponível
                targetPosition = { 
                    coluna: this.config.maxColunas - 1, 
                    linha: this.config.maxLinhas - 1 
                };
            }

            if (targetPosition) {
                // Verifica se a posição padrão está dentro dos limites do grid e está livre
                if (targetPosition.coluna < this.config.maxColunas && 
                    targetPosition.linha < this.config.maxLinhas &&
                    !this.gridOcupado.has(`${targetPosition.coluna},${targetPosition.linha}`)) {
                    
                    const coordenadas = this.getGridCoordinates(`${targetPosition.coluna},${targetPosition.linha}`);
                    icone.style.left = `${coordenadas.x}px`;
                    icone.style.top = `${coordenadas.y}px`;
                    this.gridOcupado.set(`${targetPosition.coluna},${targetPosition.linha}`, nomeApp);
                } else {
                    // Se a posição padrão está fora dos limites ou já ocupada, encontra uma livre
                    const freePos = this.findFreePosition();
                    if (freePos) {
                        const coordenadas = this.getGridCoordinates(`${freePos.coluna},${freePos.linha}`);
                        icone.style.left = `${coordenadas.x}px`;
                        icone.style.top = `${coordenadas.y}px`;
                        this.gridOcupado.set(`${freePos.coluna},${freePos.linha}`, nomeApp);
                    } else {
                        console.warn(`GridManager: Não foi possível encontrar uma posição livre para o ícone ${nomeApp}.`);
                    }
                }
            } else {
                // Caso não tenha uma posição padrão, encontra a primeira livre
                const freePos = this.findFreePosition();
                if (freePos) {
                    const coordenadas = this.getGridCoordinates(`${freePos.coluna},${freePos.linha}`);
                    icone.style.left = `${coordenadas.x}px`;
                    icone.style.top = `${coordenadas.y}px`;
                    this.gridOcupado.set(`${freePos.coluna},${freePos.linha}`, nomeApp);
                } else {
                    console.warn(`GridManager: Não foi possível encontrar uma posição livre para o ícone ${nomeApp}.`);
                }
            }
        });
        console.log('GridManager: Posições padrão dos ícones definidas.');
    }
}