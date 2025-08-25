/**
 * @file xadrez.js
 * @description Controla a lógica para uma animação de fundo com um padrão de xadrez infinito usando Canvas.
 * @version 1.0.1
 */

const CONFIG = {
    GRID_SPEED: 25,
    FOOTER_SPIKE_SPEED: 10,
    FOOTER_STROKE_WIDTH_RATIO: 0.04,
    FOOTER_OFFSET_Y_RATIO: 0.12,
    SPIKE_HEIGHT_RATIO: 0.25,
    SPIKE_BASE_WIDTH_RATIO: 0.25,
    RESIZE_DEBOUNCE_DELAY: 200,
    TILE_BUFFER_COUNT: 1,
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
            console.error("Elementos essenciais (infiniteGrid, footer) não foram encontrados no DOM.");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error("Não foi possível obter o contexto 2D do canvas.");
            return;
        }
        
        this.init();
    }

    /**
     * @description Ponto de entrada que inicializa a cena e os handlers.
     * @private
     */
    init() {
        this._setupAndCreateScene();
        this._setupResizeHandler();
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
        this._createFooterSVG();
        this._createFooterPaths();
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
     * @returns {string} O valor da variável.
     */
    _getCSSVariable(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    /**
     * @description Calcula constantes essenciais.
     * @private
     */
    _calculateAndSetConstants() {
        const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
        const lowerBound = 2.1875 * 16;
        const upperBound = 4.6875 * 16;
        this.tileSize = Math.max(lowerBound, Math.min(5 * vmin, upperBound));

        this.tileColor = this._getCSSVariable('--color-tile');

        const strokeWidth = this.tileSize * CONFIG.FOOTER_STROKE_WIDTH_RATIO;
        const offsetY = this.tileSize * CONFIG.FOOTER_OFFSET_Y_RATIO;
        this.footerTopPadding = offsetY + strokeWidth;
        this.spikeHeight = this.tileSize * CONFIG.SPIKE_HEIGHT_RATIO;
        this.spikeBaseWidth = this.tileSize * CONFIG.SPIKE_BASE_WIDTH_RATIO;
        this.spikePatternWidth = this.spikeBaseWidth * 2;
    }

    /**
     * @description Cria as coordenadas dos quadrados, sem criar elementos DOM.
     * @private
     */
    _createPatternData() {
        const buffer = this.tileSize * CONFIG.TILE_BUFFER_COUNT;
        
        const horizontalTiles = Math.ceil(this.logicalWidth / this.tileSize) + 2;
        let verticalTiles = Math.ceil(this.logicalHeight / this.tileSize) + 2;
        if (verticalTiles % 2 !== 0) verticalTiles++;

        this.gridHeight = verticalTiles * this.tileSize;

        for (let x = 0; x < horizontalTiles; x++) {
            for (let y = 0; y < verticalTiles; y++) {
                if ((x + y) % 2 === 0) {
                    const posX = x * this.tileSize;
                    const posY = y * this.tileSize - buffer;
                    this.tiles.push({ x: posX, y: posY });
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
     * @description Inicia o loop de animação.
     * @private
     */
    _startAnimation() {
        let lastTimestamp = 0;

        const animate = (timestamp) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaTime = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const gridMovement = CONFIG.GRID_SPEED * deltaTime;
            for (const tile of this.tiles) {
                tile.y -= gridMovement;
                if (tile.y < -this.tileSize * (CONFIG.TILE_BUFFER_COUNT + 1)) {
                    tile.y += this.gridHeight;
                }
            }

            this._drawGrid();

            this.spikeOffset += CONFIG.FOOTER_SPIKE_SPEED * deltaTime;
            this._updateFooterShape();

            this.animationFrameId = requestAnimationFrame(animate);
        };
        this.animationFrameId = requestAnimationFrame(animate);
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

    _createFooterSVG() {
        this.footer.innerHTML = '';
        const fragment = document.createDocumentFragment();
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.spikeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.pathBackground = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.pathForeground = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.pathBackground.id = 'footer-background';
        this.pathForeground.id = 'footer-foreground';
        this.spikeGroup.append(this.pathBackground, this.pathForeground);
        this.svg.appendChild(this.spikeGroup);
        fragment.appendChild(this.svg);
        this.footer.appendChild(fragment);
    }
    
    _createFooterPaths() {
        if (!this.spikeBaseWidth) return;
        const screenWidth = window.innerWidth;
        const footerHeight = this.footer.offsetHeight;
        const requiredWidth = screenWidth + this.spikePatternWidth;
        const numPoints = Math.ceil(requiredWidth / this.spikeBaseWidth) + 3;
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const x = i * this.spikeBaseWidth;
            const y = ((i % 2) !== 0 ? this.spikeHeight : 0) + this.footerTopPadding;
            points.push(`${x} ${y}`);
        }
        const pathData = `M ${points[0]} L ${points.slice(1).join(' L ')} L ${screenWidth + this.tileSize} ${footerHeight} L -${this.tileSize} ${footerHeight} Z`;
        this.pathBackground.setAttribute('d', pathData);
        this.pathForeground.setAttribute('d', pathData);
    }
    
    _updateFooterShape() {
        if (!this.spikePatternWidth) return;
        const offsetX = -(this.spikeOffset % this.spikePatternWidth);
        this.spikeGroup.style.transform = `translateX(${offsetX}px)`;
    }
    
    _setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this._setupAndCreateScene(), CONFIG.RESIZE_DEBOUNCE_DELAY);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessPattern();
});