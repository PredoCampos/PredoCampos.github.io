/**
 * @file xadrez.js
 * @description Controla a lógica para uma animação de fundo com um padrão de xadrez infinito.
 * @version 2.1.0
 */

const CONFIG = {
    // -- VELOCIDADES --
    GRID_SPEED: 25,         // Velocidade de rolagem do grid (pixels por segundo)
    FOOTER_SPIKE_SPEED: 40, // Velocidade de movimento das ondas do rodapé (pixels por segundo)

    // -- PROPORÇÕES DO RODAPÉ --
    // Estes valores devem corresponder às variáveis --*-ratio no CSS para consistência.
    FOOTER_STROKE_WIDTH_RATIO: 0.04, // Espessura da borda como uma fração do tamanho do quadrado
    FOOTER_OFFSET_Y_RATIO: 0.12,     // Deslocamento Y da camada de trás do rodapé

    // -- GEOMETRIA DAS ONDAS DO RODAPÉ --
    SPIKE_HEIGHT_RATIO: 0.25,     // Altura da onda (1/4 do tamanho do quadrado)
    SPIKE_BASE_WIDTH_RATIO: 0.25, // Largura da base da onda (1/4 do tamanho do quadrado)
    
    // -- PERFORMANCE E LÓGICA --
    RESIZE_DEBOUNCE_DELAY: 200, // Tempo de espera (ms) para recriar o grid após redimensionar a janela
    TILE_BUFFER_COUNT: 3,       // Número de quadrados de buffer para garantia
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
        // -- ELEMENTOS DO DOM --
        /** @private @type {HTMLElement} */
        this.container = document.getElementById('infiniteGrid');
        /** @private @type {HTMLElement} */
        this.footer = document.querySelector('footer');

        if (!this.container || !this.footer) {
            console.error("Elementos essenciais (#infiniteGrid ou footer) não foram encontrados. A animação não pode iniciar.");
            return;
        }

        /** @private @type {SVGElement} */
        this.svg = null;
        /** @private @type {SVGPathElement} */
        this.pathForeground = null;
        /** @private @type {SVGPathElement} */
        this.pathBackground = null;

        // -- PROPRIEDADES DE ESTADO --
        /** @private @type {Array<Object>} */
        this.tiles = [];
        /** @private @type {number} */
        this.tileSize = 0;
        /** @private @type {number} */
        this.gridHeight = 0;
        /** @private @type {number} */
        this.spikeOffset = 0;
        /** @private @type {number|null} */
        this.animationFrameId = null;

        this.init();
    }

    /**
     * @description Inicializa a animação.
     * @private
     */
    init() {
        this.createFooterSVG();
        this.calculateAndSetConstants();
        this.createPattern();
        this.setupResizeHandler();
    }
    
    /**
     * @description Cria a estrutura SVG inicial dentro do elemento do rodapé.
     * @private
     */
    createFooterSVG() {
        this.footer.innerHTML = ''; // Limpa qualquer conteúdo anterior.
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        this.pathBackground = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.pathBackground.setAttribute('id', 'footer-background');

        this.pathForeground = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.pathForeground.setAttribute('id', 'footer-foreground');

        this.svg.append(this.pathBackground, this.pathForeground);
        this.footer.appendChild(this.svg);
    }

    /**
     * @description Calcula o tamanho do quadrado em pixels com base no CSS (`vmin`).
     * @private
     */
    calculateAndSetConstants() {
        // Cria um quadrado temporário para ler o seu tamanho em pixels,
        // que é definido por `var(--tile-size)` no CSS.
        const tempTile = document.createElement('div');
        tempTile.className = 'chess-square';
        tempTile.style.position = 'absolute'; 
        document.body.appendChild(tempTile);
        this.tileSize = tempTile.offsetWidth;
        document.body.removeChild(tempTile);
    }

    /**
     * @description Cria e posiciona todos os quadrados do padrão de xadrez.
     * @private
     */
    createPattern() {
        this.stopAnimation();
        this.container.innerHTML = '';
        this.tiles = [];

        const buffer = this.tileSize * CONFIG.TILE_BUFFER_COUNT;
        const containerHeight = window.innerHeight + buffer;
        const viewportWidth = window.innerWidth;
        
        const horizontalTiles = Math.ceil(viewportWidth / this.tileSize) + 2;
        let verticalTiles = Math.ceil(containerHeight / this.tileSize) + 2;
        
        if (verticalTiles % 2 !== 0) {
            verticalTiles++;
        }

        this.gridHeight = verticalTiles * this.tileSize;

        for (let x = 0; x < horizontalTiles; x++) {
            for (let y = 0; y < verticalTiles; y++) {
                if ((x + y) % 2 === 0) {
                    const tileElement = document.createElement('div');
                    tileElement.className = 'chess-square';
                    
                    const posX = x * this.tileSize;
                    const posY = y * this.tileSize - buffer;
                    
                    const tileObject = { element: tileElement, x: posX, y: posY };
                    
                    tileElement.style.transform = `translate(${posX}px, ${posY}px)`;
                    
                    this.tiles.push(tileObject);
                    this.container.appendChild(tileElement);
                }
            }
        }
        this.startAnimation();
    }

    /**
     * @description Inicia o loop de animação usando `requestAnimationFrame`.
     * @private
     */
    startAnimation() {
        let lastTimestamp = performance.now();

        const animate = (timestamp) => {
            const deltaTime = (timestamp - lastTimestamp) / 1000; // Tempo em segundos
            lastTimestamp = timestamp;

            const movement = CONFIG.GRID_SPEED * deltaTime;
            for (const tile of this.tiles) {
                tile.y -= movement;
                if (tile.y < -this.tileSize * CONFIG.TILE_BUFFER_COUNT) {
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
        }
    }

    /**
     * @description Atualiza a forma do SVG do rodapé a cada frame da animação.
     * @private
     */
    updateFooterShape() {
        if (!this.tileSize) return;
        
        const strokeWidth = this.tileSize * CONFIG.FOOTER_STROKE_WIDTH_RATIO;
        const offsetY = this.tileSize * CONFIG.FOOTER_OFFSET_Y_RATIO;
        const topPadding = offsetY + strokeWidth;
        
        const spikeHeight = this.tileSize * CONFIG.SPIKE_HEIGHT_RATIO;
        const spikeBaseWidth = this.tileSize * CONFIG.SPIKE_BASE_WIDTH_RATIO;
        
        const screenWidth = window.innerWidth;
        const footerHeight = this.footer.offsetHeight;
        const spikePatternWidth = spikeBaseWidth * 2;
        const numPoints = Math.ceil(screenWidth / spikeBaseWidth) + 3;
        
        let points = [];
        let isValley = false;

        for (let i = 0; i < numPoints; i++) {
            const x = (i * spikeBaseWidth) - (this.spikeOffset % spikePatternWidth);
            const y = (isValley ? spikeHeight : 0) + topPadding;
            points.push(`${x} ${y}`);
            isValley = !isValley;
        }

        let pathData = `M ${points[0]}`;
        pathData += points.slice(1).map(p => `L ${p}`).join(' ');
        pathData += ` L ${screenWidth + this.tileSize} ${footerHeight} L -${this.tileSize} ${footerHeight} Z`;

        this.pathBackground.setAttribute('d', pathData);
        this.pathForeground.setAttribute('d', pathData);
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
            resizeTimer = setTimeout(() => {
                this.calculateAndSetConstants();
                this.createPattern();
            }, CONFIG.RESIZE_DEBOUNCE_DELAY);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessPattern();
});