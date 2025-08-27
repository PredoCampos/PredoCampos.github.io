/**
 * @file backgroundAnimation.js
 * @description Controla a lógica para uma animação de fundo com um padrão de xadrez infinito usando Canvas.
 * @version 1.0.0
 */

const CONFIG = {
    GRID_SPEED: 25, // Velocidade de rolagem da grade em pixels/segundo

    SCREEN_WIDTH_MIN: 320,  // Largura de tela mínima em pixels para o cálculo
    SCREEN_WIDTH_MAX: 1920, // Largura de tela máxima em pixels para o cálculo
    TILE_SIZE_ON_MIN_SCREEN: 85, // Tamanho do quadrado na tela mínima (valor máximo)
    TILE_SIZE_ON_MAX_SCREEN: 70, // Tamanho do quadrado na tela máxima (valor mínimo)
    
    TILE_GRID_BUFFER_COUNT: 2, // Quantos tiles extras desenhar nas direções X e Y
    TILE_VERTICAL_OFFSET_BUFFER: 1, // Quantos tiles de offset vertical para iniciar o desenho
    
    RESIZE_DEBOUNCE_DELAY: 200, // Atraso em ms para recalcular a cena ao redimensionar a janela
};

/**
 * @class ChessPattern
 * @description Gera e anima um padrão de xadrez infinito em Canvas.
 */
class ChessPattern {
    /**
     * @constructor
     */
    constructor() {
        this.canvas = document.getElementById('infiniteGrid');

        if (!this.canvas) {
            console.error("Erro Crítico: Elemento canvas#infiniteGrid não foi encontrado. A animação não será iniciada.");
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
        this.offScreenBoundaryY = 0;
    }
    
    /**
     * @description Ajusta o tamanho do canvas para a densidade de pixels do dispositivo (DPI).
     * @private
     */
    _handleDPIScaling() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);

        this.logicalWidth = rect.width;
        this.logicalHeight = rect.height;
    }
    
    /**
     * @description Calcula constantes essenciais com base no tamanho da janela e CONFIG.
     * @private
     */
    _calculateAndSetConstants() {
        const screenWidth = this.logicalWidth;
        const { 
            SCREEN_WIDTH_MIN, SCREEN_WIDTH_MAX, 
            TILE_SIZE_ON_MIN_SCREEN, TILE_SIZE_ON_MAX_SCREEN,
        } = CONFIG;

        this.tileSize = this._interpolateValue(
            screenWidth, 
            SCREEN_WIDTH_MIN, SCREEN_WIDTH_MAX, 
            TILE_SIZE_ON_MIN_SCREEN, TILE_SIZE_ON_MAX_SCREEN
        );
        
        this.tileColor = getComputedStyle(document.documentElement).getPropertyValue('--color-tile').trim();
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
     * @description Calcula um valor intermediário entre um mínimo e um máximo com base numa posição.
     * @param {number} position - A posição atual (ex: largura da tela).
     * @param {number} posMin - A posição mínima do intervalo.
     * @param {number} posMax - A posição máxima do intervalo.
     * @param {number} valMin - O valor correspondente à posição mínima.
     * @param {number} valMax - O valor correspondente à posição máxima.
     * @returns {number} O valor interpolado.
     * @private
     */
    _interpolateValue(position, posMin, posMax, valMin, valMax) {
        if (position <= posMin) return valMin;
        if (position >= posMax) return valMax;
        
        const positionRange = posMax - posMin;
        const valueRange = valMin - valMax;
        const percent = (position - posMin) / positionRange;

        return valMin - (valueRange * percent);
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChessPattern();
});