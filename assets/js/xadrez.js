class ChessPattern {
    constructor() {
        this.container = document.getElementById('infiniteGrid');
        this.tileSize = 0;
        this.animationDuration = 20; // Segundos para completar a animação
        this.tiles = [];
        this.init();
    }

    /**
     * Inicializa o padrão de xadrez
     */
    init() {
        this.calculateTileSize();
        this.createPattern();
        this.setupResizeHandler();
    }

    /**
     * Calcula o tamanho dinâmico dos tiles baseado no CSS
     */
    calculateTileSize() {
        // Cria elemento temporário para medir o tamanho real
        const tempTile = document.createElement('div');
        tempTile.className = 'chess-square';
        document.body.appendChild(tempTile);
        
        // Obtém o tamanho real calculado pelo CSS
        this.tileSize = tempTile.offsetWidth;
        
        document.body.removeChild(tempTile);
    }

    /**
     * Cria um tile individual
     */
    createTile() {
        const tile = document.createElement('div');
        tile.className = 'chess-square';
        return tile;
    }

    /**
     * Posiciona um tile e inicia sua animação
     */
    activateTile(tile) {
        // Calcula quantas colunas cabem na tela
        const columns = Math.ceil(window.innerWidth / this.tileSize);
        
        // Escolhe uma coluna aleatória
        const colIndex = Math.floor(Math.random() * columns);
        
        // Calcula a posição horizontal centralizada na coluna
        const startX = colIndex * this.tileSize + this.tileSize / 2;
        
        tile.style.setProperty('--start-x', `${startX}px`);
        
        // Configura animação
        tile.style.animation = `rise ${this.animationDuration}s linear infinite`;
        
        // Cria um delay aleatório entre 0 e a duração total
        const delay = Math.random() * this.animationDuration;
        tile.style.animationDelay = `-${delay}s`;
        
        // Posiciona inicialmente abaixo da tela
        tile.style.left = `${startX}px`;
        tile.style.top = `${window.innerHeight + this.tileSize}px`;
        
        this.container.appendChild(tile);
        this.tiles.push(tile);
    }

    /**
     * Gera todo o padrão de xadrez animado
     */
    createPattern() {
        // Limpa tiles existentes
        this.tiles.forEach(tile => tile.remove());
        this.tiles = [];
        
        // Calcula quantos tiles são necessários para preencher a tela
        const tilesCount = Math.ceil((window.innerWidth * window.innerHeight) / (this.tileSize * this.tileSize * 2));
        
        // Cria e ativa os tiles
        for (let i = 0; i < tilesCount * 2; i++) {
            const tile = this.createTile();
            this.activateTile(tile);
        }
    }

    /**
     * Configura o handler para redimensionamento responsivo
     */
    setupResizeHandler() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.calculateTileSize();
                this.createPattern();
            }, 200);
        });
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new ChessPattern();
});