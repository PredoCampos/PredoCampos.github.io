class ChessPattern {
    constructor() {
        this.container = document.getElementById('infiniteGrid');
        this.tileSize = 0;
        this.animationDuration = 20; // Segundos para completar a animação
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
     * Cria um tile individual na posição especificada
     * @param {number} gridX - Posição horizontal no grid (em unidades de tile)
     * @param {number} gridY - Posição vertical no grid (em unidades de tile)
     */
    createTile(gridX, gridY) {
        const tile = document.createElement('div');
        tile.className = 'chess-square';
        
        // Calcula posição absoluta em pixels
        const posX = gridX * this.tileSize;
        const posY = gridY * this.tileSize;
        
        tile.style.left = `${posX}px`;
        tile.style.top = `${posY}px`;
        
        return tile;
    }

    /**
     * Cria uma seção do grid com altura dobrada para animação contínua
     */
    createGridSection() {
        const section = document.createElement('div');
        section.className = 'grid-section';
        
        // Aplica a animação
        section.style.animation = `infiniteRise ${this.animationDuration}s linear infinite`;
        
        // Calcula o alcance necessário para cobrir a tela com altura dobrada
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight * 2; // Dobro da altura
        
        const horizontalTiles = Math.ceil(viewportWidth / this.tileSize) + 2;
        const verticalTiles = Math.ceil(viewportHeight / this.tileSize) + 2;
        
        // Gera o padrão de xadrez para a seção
        for (let x = 0; x < horizontalTiles; x++) {
            for (let y = 0; y < verticalTiles; y++) {
                // Padrão xadrez: alterna quadrados baseado na soma das coordenadas
                if ((x + y) % 2 === 0) {
                    const tile = this.createTile(x, y);
                    section.appendChild(tile);
                }
            }
        }
        
        return section;
    }

    /**
     * Gera todo o padrão de xadrez animado
     */
    createPattern() {
        this.container.innerHTML = '';
        const section = this.createGridSection();
        this.container.appendChild(section);
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