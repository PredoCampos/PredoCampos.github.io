/**
 * @file xadrez.js
 * @description Controla a lógica para uma animação de fundo com um padrão de xadrez infinito.
 * @version 1
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
 * @description Gere e anima um padrão de xadrez infinito e um rodapé SVG dinâmico.
 */
class ChessPattern {
    /**
     * @constructor
     */
    constructor() {
        this.container = document.getElementById('infiniteGrid');
        this.footer = document.querySelector('footer');

        if (!this.container || !this.footer) {
            console.error("Elementos essenciais não foram encontrados.");
            return;
        }

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.spikeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.pathBackground = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.pathForeground = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        this.tiles = [];
        this.animationFrameId = null;

        this.tileSize = 0;
        this.gridHeight = 0;
        this.spikeOffset = 0;
        this.footerTopPadding = 0;
        this.spikeHeight = 0;
        this.spikeBaseWidth = 0;
        this.spikePatternWidth = 0;

        this.init();
    }

    /**
     * @description Inicializa a animação.
     * @private
     */
    init() {
        this.createFooterSVG();
        this.setupAndCreateScene();
        this.setupResizeHandler();
    }
    
    /**
     * @description Cria a estrutura SVG inicial dentro do elemento do rodapé.
     * @private
     */
    createFooterSVG() {
        this.footer.innerHTML = '';
        this.pathBackground.id = 'footer-background';
        this.pathForeground.id = 'footer-foreground';
        this.spikeGroup.append(this.pathBackground, this.pathForeground);
        this.svg.appendChild(this.spikeGroup);
        this.footer.appendChild(this.svg);
    }

    /**
     * @description Calcula o tamanho do quadrado em pixels com base no CSS (`vmin`).
     * @private
     */
    calculateAndSetConstants() {
        const tempTile = document.createElement('div');
        tempTile.className = 'chess-square';
        this.container.appendChild(tempTile);
        this.tileSize = tempTile.offsetWidth;
        this.container.removeChild(tempTile);

        const strokeWidth = this.tileSize * CONFIG.FOOTER_STROKE_WIDTH_RATIO;
        const offsetY = this.tileSize * CONFIG.FOOTER_OFFSET_Y_RATIO;
        this.footerTopPadding = offsetY + strokeWidth;
        this.spikeHeight = this.tileSize * CONFIG.SPIKE_HEIGHT_RATIO;
        this.spikeBaseWidth = this.tileSize * CONFIG.SPIKE_BASE_WIDTH_RATIO;
        this.spikePatternWidth = this.spikeBaseWidth * 2;
    }

    /**
     * @description Cria e posiciona todos os quadrados do padrão de xadrez.
     * @private
     */
    createPattern() {
        this.container.innerHTML = '';
        this.tiles = [];
        
        const fragment = document.createDocumentFragment();

        const buffer = this.tileSize * CONFIG.TILE_BUFFER_COUNT;
        const containerHeight = this.container.offsetHeight + buffer;
        const viewportWidth = this.container.offsetWidth;
        
        const horizontalTiles = Math.ceil(viewportWidth / this.tileSize) + 2;
        let verticalTiles = Math.ceil(containerHeight / this.tileSize) + 2;
        if (verticalTiles % 2 !== 0) verticalTiles++;

        this.gridHeight = verticalTiles * this.tileSize;

        for (let x = 0; x < horizontalTiles; x++) {
            for (let y = 0; y < verticalTiles; y++) {
                if ((x + y) % 2 === 0) {
                    const tileElement = document.createElement('div');
                    tileElement.className = 'chess-square';
                    const posX = x * this.tileSize;
                    const posY = y * this.tileSize - buffer;
                    tileElement.style.transform = `translate(${posX}px, ${posY}px)`;
                    
                    this.tiles.push({ element: tileElement, x: posX, y: posY });
                    fragment.appendChild(tileElement);
                }
            }
        }
        
        this.container.appendChild(fragment);
    }

    /**
     * @description Orquestra os cálculos e a criação da cena.
     * @private
     */
    setupAndCreateScene() {
        this.stopAnimation();
        this.calculateAndSetConstants();
        this.createPattern();
        this.createFooterPaths();
        this.startAnimation();
    }
    
    /**
     * @description Desenha a geometria SVG do rodapé uma única vez.
     * @private
     */
    createFooterPaths() {
        if (!this.spikeBaseWidth) return;

        const screenWidth = window.innerWidth;
        const footerHeight = this.footer.offsetHeight;
        const requiredWidth = screenWidth + this.spikePatternWidth;
        const numPoints = Math.ceil(requiredWidth / this.spikeBaseWidth) + 3;

        let points = [];
        for (let i = 0; i < numPoints; i++) {
            const x = i * this.spikeBaseWidth;
            const y = ((i % 2) !== 0 ? this.spikeHeight : 0) + this.footerTopPadding;
            points.push(`${x} ${y}`);
        }

        const pathData = `M ${points[0]} L ${points.slice(1).join(' L ')} L ${screenWidth + this.tileSize} ${footerHeight} L -${this.tileSize} ${footerHeight} Z`;

        this.pathBackground.setAttribute('d', pathData);
        this.pathForeground.setAttribute('d', pathData);
    }

    /**
     * @description Inicia o loop de animação usando `requestAnimationFrame`.
     * @private
     */
    startAnimation() {
        let lastTimestamp = 0;

        const animate = (timestamp) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaTime = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            const movement = CONFIG.GRID_SPEED * deltaTime;
            for (const tile of this.tiles) {
                tile.y -= movement;
                if (tile.y < -this.tileSize * (CONFIG.TILE_BUFFER_COUNT + 1)) {
                    tile.y += this.gridHeight;
                }
                tile.element.style.transform = `translate(${tile.x}px, ${tile.y}px)`;
            }

            const spikeMovement = CONFIG.FOOTER_SPIKE_SPEED * deltaTime;
            this.spikeOffset += spikeMovement;
            this.updateFooterShape();

            this.animationFrameId = requestAnimationFrame(animate);
        };
        this.animationFrameId = requestAnimationFrame(animate);
    }
    
    /**
     * @description Para o loop de animação.
     * @private
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * @description  move o grupo SVG horizontalmente.
     * @private
     */
    updateFooterShape() {
        if (!this.spikePatternWidth) return;
        
        const offsetX = -(this.spikeOffset % this.spikePatternWidth);
        this.spikeGroup.style.transform = `translateX(${offsetX}px)`;
    }

    /**
     * @description Configura um listener para o redimensionamento da janela,
     * com "debounce" para evitar recriações excessivas.
     * @private
     */
    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => this.setupAndCreateScene(), CONFIG.RESIZE_DEBOUNCE_DELAY);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessPattern();
});