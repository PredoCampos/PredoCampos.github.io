/**
 * @file cobra.app.js
 * @description Jogo da Cobra clássico, com controles para desktop e mobile.
 */

export default class CobraApp {
    /**
     * @param {HTMLElement} container - O elemento onde o conteúdo do aplicativo será renderizado.
     * @param {object} soInstance - A instância principal do Sistema Operacional.
     */
    constructor(container, soInstance) {
        this.container = container;
        this.so = soInstance;

        this.gridSize = 20;
        this.canvas = null;
        this.ctx = null;
        this.gameLoopInterval = null;

        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.score = 0;
        this.gameOver = false;
        
        this._handleKeyDown = this._handleKeyDown.bind(this);
        // MUDANÇA: Bind do novo método de clique.
        this._handleCanvasClick = this._handleCanvasClick.bind(this);
    }

    /**
     * Inicializa o aplicativo, criando o canvas e os controles apropriados.
     */
    init() {
        this.container.style.padding = '0';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = '#1a1a1a';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.style.flexGrow = '1';
        this.container.appendChild(this.canvas);

        if (this.so.state.device.isMobile) {
            this._createMobileControls();
        }

        // Adiciona os listeners de eventos.
        document.addEventListener('keydown', this._handleKeyDown);
        // MUDANÇA: Adiciona o listener de clique para reiniciar o jogo.
        this.canvas.addEventListener('click', this._handleCanvasClick);

        this._resizeCanvas();
        this._startGame();
    }

    /**
     * Redimensiona o canvas para preencher o espaço disponível no contêiner.
     */
    _resizeCanvas() {
        requestAnimationFrame(() => {
            this.canvas.width = this.container.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            this._draw();
        });
    }

    _createMobileControls() {
        const controlsContainer = document.createElement('div');
        controlsContainer.style.display = 'flex';
        controlsContainer.style.justifyContent = 'space-around';
        controlsContainer.style.padding = '10px';
        controlsContainer.style.backgroundColor = '#111';

        const buttonUp = this._createControlButton('↑', 'up');
        const buttonDown = this._createControlButton('↓', 'down');
        const buttonLeft = this._createControlButton('←', 'left');
        const buttonRight = this._createControlButton('→', 'right');

        const leftGroup = document.createElement('div');
        leftGroup.appendChild(buttonLeft);
        
        const middleGroup = document.createElement('div');
        middleGroup.style.display = 'flex';
        middleGroup.style.flexDirection = 'column';
        middleGroup.appendChild(buttonUp);
        middleGroup.appendChild(buttonDown);
        
        const rightGroup = document.createElement('div');
        rightGroup.appendChild(buttonRight);

        controlsContainer.appendChild(leftGroup);
        controlsContainer.appendChild(middleGroup);
        controlsContainer.appendChild(rightGroup);
        
        this.container.appendChild(controlsContainer);
    }
    
    _createControlButton(text, direction) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.width = '60px';
        button.style.height = '60px';
        button.style.fontSize = '24px';
        button.style.border = '2px solid #555';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#333';
        button.style.color = 'white';
        button.style.margin = '5px';
        
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this._setDirection(direction);
        });
        
        return button;
    }

    _startGame() {
        this.snake = [{ x: 6 * this.gridSize, y: 3 * this.gridSize }];
        this.direction = 'right';
        this.score = 0;
        this.gameOver = false;

        this._generateFood();

        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = setInterval(() => this._gameLoop(), 120);
    }

    _gameLoop() {
        if (this.gameOver) {
            this._drawGameOver();
            return;
        }
        this._moveSnake();
        this._checkCollision();
        this._draw();
    }
    
    _draw() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#0f0' : '#0c0';
            this.ctx.fillRect(segment.x, segment.y, this.gridSize - 1, this.gridSize - 1);
        });

        this.ctx.fillStyle = '#f00';
        this.ctx.fillRect(this.food.x, this.food.y, this.gridSize - 1, this.gridSize - 1);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px "Tahoma"';
        this.ctx.fillText(`Pontuação: ${this.score}`, 10, 20);
    }
    
    _drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px "Tahoma"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Fim de Jogo', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        this.ctx.font = '16px "Tahoma"';
        // MUDANÇA: Mensagem atualizada para incluir a instrução de clique.
        this.ctx.fillText('Clique na tela ou pressione Enter para reiniciar', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    _moveSnake() {
        const head = { x: this.snake[0].x, y: this.snake[0].y };

        switch (this.direction) {
            case 'up': head.y -= this.gridSize; break;
            case 'down': head.y += this.gridSize; break;
            case 'left': head.x -= this.gridSize; break;
            case 'right': head.x += this.gridSize; break;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this._generateFood();
        } else {
            this.snake.pop();
        }
    }

    _generateFood() {
        const maxX = Math.floor((this.canvas.width - this.gridSize) / this.gridSize);
        const maxY = Math.floor((this.canvas.height - this.gridSize) / this.gridSize);
        
        do {
            this.food = {
                x: Math.floor(Math.random() * maxX) * this.gridSize,
                y: Math.floor(Math.random() * maxY) * this.gridSize,
            };
        } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
    }

    _checkCollision() {
        const head = this.snake[0];

        if (head.x < 0 || head.x >= this.canvas.width || head.y < 0 || head.y >= this.canvas.height) {
            this.gameOver = true;
        }
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver = true;
            }
        }
    }
    
    /**
     * Lida com os inputs do teclado para desktop.
     */
    _handleKeyDown(e) {
        if (this.gameOver && e.key === 'Enter') {
            this._startGame();
            return;
        }
        if (!this.gameOver) {
             this._setDirection(e.key.replace('Arrow', '').toLowerCase());
        }
    }
    
    /**
     * MUDANÇA: Novo método para lidar com o clique/toque no canvas para reiniciar.
     */
    _handleCanvasClick() {
        if (this.gameOver) {
            this._startGame();
        }
    }

    /**
     * Define a direção da cobra, impedindo-a de se inverter.
     */
    _setDirection(newDirection) {
        const goingUp = this.direction === 'up';
        const goingDown = this.direction === 'down';
        const goingLeft = this.direction === 'left';
        const goingRight = this.direction === 'right';

        if (newDirection === 'up' && !goingDown) this.direction = 'up';
        else if (newDirection === 'down' && !goingUp) this.direction = 'down';
        else if (newDirection === 'left' && !goingRight) this.direction = 'left';
        else if (newDirection === 'right' && !goingLeft) this.direction = 'right';
    }
}