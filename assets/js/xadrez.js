/**
 * @file xadrez.js
 * @description Controla a lógica para uma animação de fundo com um padrão de xadrez infinito usando Canvas.
 * @version 1.0.0
 */

const CONFIG = {
    // Velocidades de animação
    GRID_SPEED: 25, // Velocidade de rolagem da grade em pixels/segundo
    FOOTER_SPIKE_SPEED: 10, // Velocidade de rolagem dos "espinhos" do rodapé em pixels/segundo

    // Configurações do tamanho dos quadrados (tiles)
    TILE_SIZE_VMIN_FACTOR: 5, // Fator de VMIN para o tamanho do tile (5 * vmin)
    TILE_SIZE_MIN_PX: 35, // Tamanho mínimo do tile em pixels
    TILE_SIZE_MAX_PX: 75, // Tamanho máximo do tile em pixels
    
    // Buffers para garantir que a animação não tenha falhas nas bordas
    TILE_GRID_BUFFER_COUNT: 2, // Quantos tiles extras desenhar nas direções X e Y
    TILE_VERTICAL_OFFSET_BUFFER: 1, // Quantos tiles de offset vertical para iniciar o desenho
    
    // Configurações do rodapé SVG
    FOOTER_STROKE_WIDTH_RATIO: 0.04, // Espessura da borda do rodapé em relação ao tileSize
    FOOTER_OFFSET_Y_RATIO: 0.12, // Deslocamento vertical do rodapé em relação ao tileSize
    SPIKE_HEIGHT_RATIO: 0.25, // Altura do "espinho" em relação ao tileSize
    SPIKE_BASE_WIDTH_RATIO: 0.25, // Largura da base do "espinho" em relação ao tileSize
    SPIKE_POINTS_BUFFER: 3, // Número de pontos extras para o caminho SVG para evitar falhas
    FOOTER_PATH_HORIZONTAL_BUFFER_RATIO: 1, // Buffer para evitar cortes nas laterais (1 = 100% do tileSize)

    // Outros
    RESIZE_DEBOUNCE_DELAY: 200, // Atraso em ms para recalcular a cena ao redimensionar a janela
};

/**
 * @class ChessPattern
 * @description Gera e anima um padrão de xadrez infinito em Canvas e um rodapé SVG dinâmico.
 */
class ChessPattern {
    /**
     * @constructor
     */
    constructor() {
        this.canvas = document.getElementById('infiniteGrid');
        this.footer = document.querySelector('footer');

        if (!this.canvas || !this.footer) {
            console.error("Erro Crítico: Elementos essenciais (canvas#infiniteGrid ou footer) não foram encontrados. A animação não será iniciada.");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error("Erro Crítico: Não foi possível obter o contexto 2D do canvas. A animação não será iniciada.");
            return;
        }
        
        this.resizeHandler = this._debounce(this._setupAndCreateScene.bind(this), CONFIG.RESIZE_DEBOUNCE_DELAY);
        
        this.init();
    }

    /**
     * @description Ponto de entrada que inicializa a cena e os handlers.
     * @private
     */
    init() {
        this._setupAndCreateScene();
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * @description Configura a cena, cancelando animações antigas e recriando tudo.
     * @private
     */
    _setupAndCreateScene() {
        this._stopAnimation();
        this._resetState();
        this._handleDPIScaling();
        this._calculateAndSetConstants();
        this._setupFooter();
        this._createPatternData();
        this._startAnimation();
    }

    /**
     * @description Reinicia as propriedades da classe para um estado limpo.
     * @private
     */
    _resetState() {
        this.tiles = [];
        this.animationFrameId = null;
        this.tileSize = 0;
        this.gridHeight = 0;
        this.spikeOffset = 0;
        this.offScreenBoundaryY = 0;
    }
    
    /**
     * @description Ajusta o tamanho do canvas para a densidade de pixels do dispositivo (DPI).
     * @private
     */
    _handleDPIScaling() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);

        this.logicalWidth = rect.width;
        this.logicalHeight = rect.height;
    }
    
    /**
     * @description Retorna o valor de uma variável CSS.
     * @param {string} varName - O nome da variável (--exemplo).
     * @param {string} fallbackValue - O valor padrão.
     * @returns {string} O valor da variável ou o padrão.
     * @static
     */
    static _getCSSVariable(varName, fallbackValue) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        return value || fallbackValue;
    }

    /**
     * @description Calcula constantes essenciais com base no tamanho da janela e CONFIG.
     * @private
     */
    _calculateAndSetConstants() {
        const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
        const dynamicSize = CONFIG.TILE_SIZE_VMIN_FACTOR * vmin;
        this.tileSize = Math.max(CONFIG.TILE_SIZE_MIN_PX, Math.min(dynamicSize, CONFIG.TILE_SIZE_MAX_PX));

        this.tileColor = ChessPattern._getCSSVariable('--color-tile', '#000000');

        this.spikeHeight = this.tileSize * CONFIG.SPIKE_HEIGHT_RATIO;
        this.spikeBaseWidth = this.tileSize * CONFIG.SPIKE_BASE_WIDTH_RATIO;
        this.spikePatternWidth = this.spikeBaseWidth * 2;
    }

    /**
     * @description Gera as coordenadas iniciais dos quadrados da grade.
     * @private
     */
    _createPatternData() {
        if (this.tileSize <= 0) return;

        const verticalOffset = this.tileSize * CONFIG.TILE_VERTICAL_OFFSET_BUFFER;
        const horizontalTiles = Math.ceil(this.logicalWidth / this.tileSize) + CONFIG.TILE_GRID_BUFFER_COUNT;
        let verticalTiles = Math.ceil(this.logicalHeight / this.tileSize) + CONFIG.TILE_GRID_BUFFER_COUNT;
        
        if (verticalTiles % 2 !== 0) verticalTiles++;

        this.gridHeight = verticalTiles * this.tileSize;
        this.offScreenBoundaryY = -this.tileSize * (CONFIG.TILE_VERTICAL_OFFSET_BUFFER + 1);

        for (let y = 0; y < verticalTiles; y++) {
            for (let x = 0; x < horizontalTiles; x++) {
                if ((x + y) % 2 === 0) {
                    this.tiles.push({ 
                        x: x * this.tileSize, 
                        y: y * this.tileSize - verticalOffset 
                    });
                }
            }
        }
    }
    
    /**
     * @description Desenha a grade no canvas.
     * @private
     */
    _drawGrid() {
        this.ctx.fillStyle = this.tileColor;
        for (const tile of this.tiles) {
            this.ctx.fillRect(tile.x, tile.y, this.tileSize, this.tileSize);
        }
    }

    /**
     * @description O loop principal de animação, executado a cada frame.
     * @param {number} timestamp - O tempo atual fornecido pelo browser.
     * @private
     */
    _animate(timestamp) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const deltaTime = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;

        if (deltaTime > 0.5) {
            this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
            return;
        }
        
        this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

        const gridMovement = CONFIG.GRID_SPEED * deltaTime;
        for (const tile of this.tiles) {
            tile.y -= gridMovement;
            if (tile.y < this.offScreenBoundaryY) {
                tile.y += this.gridHeight;
            }
        }
        this._drawGrid();

        const footerMovement = CONFIG.FOOTER_SPIKE_SPEED * deltaTime;
        this.spikeOffset += footerMovement;
        this._updateFooterShape();
        
        this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
    }
    
    /**
     * @description Inicia o loop de animação.
     * @private
     */
    _startAnimation() {
        this.lastTimestamp = 0;
        this.animationFrameId = requestAnimationFrame(this._animate.bind(this));
    }

    /**
     * @description Para o loop de animação.
     * @private
     */
    _stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * @description Cria e configura o SVG do rodapé e seus caminhos.
     * @private
     */
    _setupFooter() {
        if (this.tileSize <= 0) return;

        this.footer.querySelector('svg')?.remove();

        const svgNS = 'http://www.w3.org/2000/svg';
        this.svg = document.createElementNS(svgNS, 'svg');
        this.footerSpikeGroup = document.createElementNS(svgNS, 'g');
        const pathBackground = document.createElementNS(svgNS, 'path');
        const pathForeground = document.createElementNS(svgNS, 'path');
        
        pathBackground.id = 'footer-background';
        pathForeground.id = 'footer-foreground';
        
        this.footerSpikeGroup.append(pathBackground, pathForeground);
        this.svg.appendChild(this.footerSpikeGroup);
        this.footer.prepend(this.svg);

        const screenWidth = this.logicalWidth; 
        const footerHeight = this.footer.offsetHeight;
        const strokeWidth = this.tileSize * CONFIG.FOOTER_STROKE_WIDTH_RATIO;
        const offsetY = this.tileSize * CONFIG.FOOTER_OFFSET_Y_RATIO;
        const footerTopPadding = offsetY + strokeWidth;
        
        const requiredWidth = screenWidth + this.spikePatternWidth;
        const numPoints = Math.ceil(requiredWidth / this.spikeBaseWidth) + CONFIG.SPIKE_POINTS_BUFFER;
        
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const x = i * this.spikeBaseWidth;
            const y = (i % 2 !== 0 ? this.spikeHeight : 0) + footerTopPadding;
            points.push(`${x} ${y}`);
        }
        
        const pathHorizontalBuffer = this.tileSize * CONFIG.FOOTER_PATH_HORIZONTAL_BUFFER_RATIO;
        
        const pathData = `
            M ${points[0]}
            L ${points.slice(1).join(' L ')}
            L ${screenWidth + pathHorizontalBuffer} ${footerHeight}
            L ${-pathHorizontalBuffer} ${footerHeight}
            Z
        `;
        
        pathBackground.setAttribute('d', pathData);
        pathForeground.setAttribute('d', pathData);
    }
    
    /**
     * @description Atualiza a posição do grupo SVG para simular o movimento.
     * @private
     */
    _updateFooterShape() {
        if (!this.spikePatternWidth) return;
        const offsetX = -(this.spikeOffset % this.spikePatternWidth);
        this.footerSpikeGroup.style.transform = `translateX(${offsetX}px)`;
    }
    
    /**
     * @description Cria uma função com "debounce", que limita a frequência de sua execução.
     * @param {Function} func - A função a ser executada.
     * @param {number} delay - O tempo de espera em milissegundos.
     * @returns {Function} A nova função com debounce.
     * @private
     */
    _debounce(func, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    /**
     * @description Remove os ouvintes de evento e para a animação.
     */
    destroy() {
        this._stopAnimation();
        window.removeEventListener('resize', this.resizeHandler);
        this.footer.querySelector('svg')?.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessPattern();
});