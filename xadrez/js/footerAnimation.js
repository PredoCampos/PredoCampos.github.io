/**
 * @file footerAnimation.js
 * @description Controla a lógica para a animação do rodapé SVG dinâmico.
 * @version 1.0.0
 */

const FOOTER_CONFIG = {
    FOOTER_SPIKE_SPEED: 10, // Velocidade de rolagem dos "espinhos" do rodapé em pixels/segundo

    SCREEN_WIDTH_MIN: 320,  // Largura de tela mínima em pixels para o cálculo
    SCREEN_WIDTH_MAX: 1920, // Largura de tela máxima em pixels para o cálculo
    TILE_SIZE_ON_MIN_SCREEN: 85, // Tamanho do quadrado na tela mínima (usado como referência)
    TILE_SIZE_ON_MAX_SCREEN: 70, // Tamanho do quadrado na tela máxima (usado como referência)

    FOOTER_SIZE_ON_MIN_SCREEN: 58, // Tamanho base do rodapé na tela MÍNIMA
    FOOTER_SIZE_ON_MAX_SCREEN: 50, // Tamanho base do rodapé na tela MÁXIMA
    
    FOOTER_STROKE_WIDTH_RATIO: 0.04, // Espessura da borda do rodapé em relação ao tileSize
    FOOTER_OFFSET_Y_RATIO: 0.12, // Deslocamento vertical do rodapé em relação ao tileSize
    SPIKE_HEIGHT_RATIO: 0.25, // Altura do "espinho" em relação ao tileSize
    SPIKE_BASE_WIDTH_RATIO: 0.25, // Largura da base do "espinho" em relação ao tileSize
    SPIKE_POINTS_BUFFER: 3, // Número de pontos extras para o caminho SVG para evitar falhas
    FOOTER_PATH_HORIZONTAL_BUFFER_RATIO: 1, // Buffer para evitar cortes nas laterais (1 = 100% do tileSize)

    RESIZE_DEBOUNCE_DELAY: 200, // Atraso em ms para recalcular a cena ao redimensionar a janela
};

/**
 * @class FooterAnimation
 * @description Gera e anima um rodapé SVG dinâmico.
 */
class FooterAnimation {
    /**
     * @constructor
     */
    constructor() {
        this.footer = document.querySelector('footer');

        if (!this.footer) {
            console.error("Erro Crítico: Elemento footer não foi encontrado. A animação não será iniciada.");
            return;
        }
        
        this.resizeHandler = this._debounce(this._setupAndCreateScene.bind(this), FOOTER_CONFIG.RESIZE_DEBOUNCE_DELAY);
        
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
        this._calculateAndSetConstants();
        this._setupFooter();
        this._startAnimation();
    }

    /**
     * @description Reinicia as propriedades da classe para um estado limpo.
     * @private
     */
    _resetState() {
        this.animationFrameId = null;
        this.tileSize = 0;
        this.spikeOffset = 0;
    }
    
    /**
     * @description Calcula constantes essenciais com base no tamanho da janela e CONFIG.
     * @private
     */
    _calculateAndSetConstants() {
        const screenWidth = window.innerWidth; // Lógica do rodapé pode usar innerWidth diretamente
        const { 
            SCREEN_WIDTH_MIN, SCREEN_WIDTH_MAX, 
            TILE_SIZE_ON_MIN_SCREEN, TILE_SIZE_ON_MAX_SCREEN,
            FOOTER_SIZE_ON_MIN_SCREEN, FOOTER_SIZE_ON_MAX_SCREEN 
        } = FOOTER_CONFIG;

        // tileSize é necessário como referência para alguns cálculos do rodapé
        this.tileSize = this._interpolateValue(
            screenWidth, 
            SCREEN_WIDTH_MIN, SCREEN_WIDTH_MAX, 
            TILE_SIZE_ON_MIN_SCREEN, TILE_SIZE_ON_MAX_SCREEN
        );
        
        this.footerBaseSize = this._interpolateValue(
            screenWidth,
            SCREEN_WIDTH_MIN, SCREEN_WIDTH_MAX,
            FOOTER_SIZE_ON_MIN_SCREEN, FOOTER_SIZE_ON_MAX_SCREEN
        );
        
        this.spikeHeight = this.footerBaseSize * FOOTER_CONFIG.SPIKE_HEIGHT_RATIO;
        this.spikeBaseWidth = this.footerBaseSize * FOOTER_CONFIG.SPIKE_BASE_WIDTH_RATIO;
        this.spikePatternWidth = this.spikeBaseWidth * 2;
        this.logicalWidth = window.innerWidth;
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
        
        const footerMovement = FOOTER_CONFIG.FOOTER_SPIKE_SPEED * deltaTime;
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
        this.svg.append(this.footerSpikeGroup);
        this.footer.prepend(this.svg);

        const footerHeight = this.footer.offsetHeight;
        const strokeWidth = this.footerBaseSize * FOOTER_CONFIG.FOOTER_STROKE_WIDTH_RATIO;
        const offsetY = this.footerBaseSize * FOOTER_CONFIG.FOOTER_OFFSET_Y_RATIO;
        const footerTopPadding = offsetY + strokeWidth;
        
        const requiredWidth = this.logicalWidth + this.spikePatternWidth;
        const numPoints = Math.ceil(requiredWidth / this.spikeBaseWidth) + FOOTER_CONFIG.SPIKE_POINTS_BUFFER;
        
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const x = i * this.spikeBaseWidth;
            const y = (i % 2 !== 0 ? this.spikeHeight : 0) + footerTopPadding;
            points.push(`${x} ${y}`);
        }
        
        const pathHorizontalBuffer = this.tileSize * FOOTER_CONFIG.FOOTER_PATH_HORIZONTAL_BUFFER_RATIO;
        
        const pathData = [
            `M ${points[0]}`,
            `L ${points.slice(1).join(' L ')}`,
            `L ${this.logicalWidth + pathHorizontalBuffer} ${footerHeight}`,
            `L ${-pathHorizontalBuffer} ${footerHeight}`,
            'Z'
        ].join(' ');
        
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
        this.footer.querySelector('svg')?.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FooterAnimation();
});