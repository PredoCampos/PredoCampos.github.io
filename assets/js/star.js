// Classe principal que gerencia a estrela flutuante
class FloatingStar {
    constructor() {
        // === CONFIGURAÇÕES CENTRALIZADAS ===
        this.CONFIG = {
            // Geometria da estrela
            points: 7,                  // Número de pontas (4-8)
            outerRadius: 0.45,           // Raio externo (% da menor dimensão)
            innerRadius: 0.15,          // Raio interno (% da menor dimensão)
            
            // Animação
            animationSpeed: 500,        // Intervalo em ms
            movementRange: 0.05,        // Alcance do movimento aleatório (% do raio)
            distortionRange: 0.1,       // Distorção inicial (% do raio)
            
            // Sistema de loops
            loopMin: 5,                 // Mínimo frames por loop
            loopMax: 11,                // Máximo frames por loop
            
            // Pesos para cálculo de órbita (devem somar 1.0)
            originalWeight: 0.4,        // Peso da posição original
            previousWeight: 0.3,        // Peso da posição anterior  
            circleWeight: 0.3,          // Peso do círculo de referência
            homeWeight: 0.8             // Peso extra para retorno "casa" (penúltimo frame)
        };
        
        // Referências dos elementos DOM
        this.canvas = document.getElementById('starCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Arrays para armazenar posições
        this.originalPoints = [];               // Posições originais da estrela
        this.currentPoints = [];                // Posições atuais (animadas)
        this.previousPoints = [];               // Posições anteriores para cálculo de órbita
        
        // Sistema de loops para cada ponto
        this.pointLoops = [];                   // Array de loops individuais para cada ponto
        this.loopCounters = [];                 // Contadores atuais de cada loop
        
        // Inicialização
        this.setupCanvas();
        this.generateStarPoints();
        this.startAnimation();
    }
    
    // Configura o canvas para ser responsivo
    setupCanvas() {
        // Obtém o tamanho real do canvas (considerando CSS)
        const rect = this.canvas.getBoundingClientRect();
        
        // Define a resolução interna do canvas
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Centro do canvas
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        // Raios da estrela baseados na configuração
        this.outerRadius = Math.min(this.canvas.width, this.canvas.height) * this.CONFIG.outerRadius;
        this.innerRadius = Math.min(this.canvas.width, this.canvas.height) * this.CONFIG.innerRadius;
        
        // Garante que raio interno seja menor que externo
        if (this.innerRadius >= this.outerRadius) {
            this.innerRadius = this.outerRadius * 0.5;
        }
    }
    
    // Gera os pontos originais da estrela (distorcidos e únicos)
    generateStarPoints() {
        this.originalPoints = [];
        
        // Número total de pontos = pontas * 2 (externos + internos)
        const totalPoints = this.CONFIG.points * 2;
        
        // Gera cada ponto da estrela com distorções aleatórias
        for (let i = 0; i < totalPoints; i++) {
            // Ângulo base do ponto atual
            const baseAngle = (i * Math.PI * 2) / totalPoints;
            
            // Distorção aleatória no ângulo (±10°)
            const angleDistortion = (Math.random() - 0.5) * 0.35;
            const angle = baseAngle + angleDistortion;
            
            // Determina se é ponto externo (ponta) ou interno (reentrância)
            const isOuter = i % 2 === 0;
            const baseRadius = isOuter ? this.outerRadius : this.innerRadius;
            
            // Distorção aleatória no raio
            const maxDistortion = this.outerRadius * this.CONFIG.distortionRange;
            const radiusDistortion = (Math.random() - 0.5) * 2 * maxDistortion;
            const currentRadius = Math.max(baseRadius + radiusDistortion, this.outerRadius * 0.1);
            
            // Calcula posição x,y do ponto com distorções
            const x = this.centerX + Math.cos(angle) * currentRadius;
            const y = this.centerY + Math.sin(angle) * currentRadius;
            
            // Armazena o ponto distorcido com informação do círculo de referência
            this.originalPoints.push({ 
                x, 
                y, 
                isOuter,                    // Se pertence ao círculo externo ou interno
                referenceRadius: baseRadius // Raio do círculo de referência
            });
        }
        
        // Inicializa pontos atuais e anteriores como cópia dos originais
        this.currentPoints = this.originalPoints.map(point => ({ ...point }));
        this.previousPoints = this.originalPoints.map(point => ({ ...point }));
        
        // Gera loops únicos para cada ponto
        this.generatePointLoops();
    }
    
    // Gera loops individuais para cada ponto
    generatePointLoops() {
        this.pointLoops = [];
        this.loopCounters = [];
        
        // Para cada ponto, cria um loop único
        this.originalPoints.forEach((originalPoint, index) => {
            // Tamanho aleatório do loop
            const loopSize = Math.floor(Math.random() * (this.CONFIG.loopMax - this.CONFIG.loopMin + 1)) + this.CONFIG.loopMin;
            
            // Gera posições do loop (exceto a última que é sempre original)
            const loop = [];
            for (let i = 0; i < loopSize - 1; i++) {
                loop.push(this.generateOrbitPoint(originalPoint, originalPoint, i, loopSize - 1));
            }
            // Última posição sempre volta para original
            loop.push({ ...originalPoint });
            
            this.pointLoops.push(loop);
            this.loopCounters.push(0);
        });
    }
    
    // Gera ponto que orbita entre três referências: original, anterior e círculo
    generateOrbitPoint(originalPoint, previousPoint, frameIndex, totalFrames) {
        // Se é o penúltimo frame, aumenta peso para retornar "para casa"
        const isReturning = frameIndex === totalFrames - 2;
        
        // Calcula posição do círculo de referência
        const circleReference = this.getCircleReferencePoint(originalPoint);
        
        // Pesos para cálculo (normaliza para somar 1.0)
        let weights = {
            original: this.CONFIG.originalWeight,
            previous: this.CONFIG.previousWeight,
            circle: this.CONFIG.circleWeight
        };
        
        // Se está retornando, aumenta peso do original
        if (isReturning) {
            weights.original *= this.CONFIG.homeWeight;
            // Renormaliza os pesos
            const total = weights.original + weights.previous + weights.circle;
            weights.original /= total;
            weights.previous /= total;
            weights.circle /= total;
        }
        
        // Calcula ponto médio ponderado entre as três referências
        const weightedCenterX = 
            originalPoint.x * weights.original + 
            previousPoint.x * weights.previous + 
            circleReference.x * weights.circle;
            
        const weightedCenterY = 
            originalPoint.y * weights.original + 
            previousPoint.y * weights.previous + 
            circleReference.y * weights.circle;
        
        // Calcula deslocamento aleatório
        const maxDisplacement = this.outerRadius * this.CONFIG.movementRange;
        const deltaX = (Math.random() - 0.5) * 2 * maxDisplacement;
        const deltaY = (Math.random() - 0.5) * 2 * maxDisplacement;
        
        return {
            x: weightedCenterX + deltaX,
            y: weightedCenterY + deltaY,
            isOuter: originalPoint.isOuter,
            referenceRadius: originalPoint.referenceRadius
        };
    }
    
    // Calcula ponto de referência no círculo apropriado
    getCircleReferencePoint(originalPoint) {
        // Calcula ângulo do ponto original em relação ao centro
        const angle = Math.atan2(originalPoint.y - this.centerY, originalPoint.x - this.centerX);
        
        // Usa o raio de referência do ponto (externo ou interno)
        const radius = originalPoint.referenceRadius;
        
        // Retorna ponto no círculo de referência
        return {
            x: this.centerX + Math.cos(angle) * radius,
            y: this.centerY + Math.sin(angle) * radius
        };
    }
    
    // Anima os pontos seguindo seus loops individuais
    animatePoints() {
        // Para cada ponto, avança no seu loop
        this.currentPoints = this.currentPoints.map((currentPoint, index) => {
            // Avança contador do loop
            this.loopCounters[index] = (this.loopCounters[index] + 1) % this.pointLoops[index].length;
            
            // Se chegou ao fim do loop, gera novo loop
            if (this.loopCounters[index] === 0) {
                this.regeneratePointLoop(index);
            }
            
            // Retorna próxima posição do loop
            return { ...this.pointLoops[index][this.loopCounters[index]] };
        });
        
        // Atualiza posições anteriores para próximo cálculo
        this.previousPoints = this.currentPoints.map(point => ({ ...point }));
        
        // Redesenha a estrela
        this.drawStar();
    }
    
    // Regenera loop de um ponto específico
    regeneratePointLoop(pointIndex) {
        const originalPoint = this.originalPoints[pointIndex];
        const loopSize = Math.floor(Math.random() * (this.CONFIG.loopMax - this.CONFIG.loopMin + 1)) + this.CONFIG.loopMin;
        
        const newLoop = [];
        let previousPoint = this.previousPoints[pointIndex];
        
        // Gera novas posições do loop
        for (let i = 0; i < loopSize - 1; i++) {
            const newPoint = this.generateOrbitPoint(originalPoint, previousPoint, i, loopSize - 1);
            newLoop.push(newPoint);
            previousPoint = newPoint; // Atualiza referência para próximo ponto
        }
        
        // Última posição sempre volta para original
        newLoop.push({ ...originalPoint });
        
        // Substitui o loop antigo
        this.pointLoops[pointIndex] = newLoop;
    }
    
    // Desenha a estrela no canvas
    drawStar() {
        // Limpa o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Configurações de desenho
        this.ctx.strokeStyle = '#333333';       // Cor das linhas
        this.ctx.lineWidth = this.canvas.width * 0.003; // Espessura responsiva
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Preenchimento sutil
        
        // Inicia o caminho da estrela
        this.ctx.beginPath();
        
        // Move para o primeiro ponto
        this.ctx.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
        
        // Conecta todos os pontos
        for (let i = 1; i < this.currentPoints.length; i++) {
            this.ctx.lineTo(this.currentPoints[i].x, this.currentPoints[i].y);
        }
        
        // Fecha o caminho (conecta último ponto ao primeiro)
        this.ctx.closePath();
        
        // Desenha preenchimento e contorno
        this.ctx.fill();
        this.ctx.stroke();
        
        // Desenha pontos individuais
        this.drawPoints();
    }
    
    // Desenha os pontos da estrela
    drawPoints() {
        // Configura estilo dos pontos
        this.ctx.fillStyle = '#555555';
        
        // Raio dos pontos (responsivo)
        const pointRadius = this.canvas.width * 0.008;
        
        // Desenha cada ponto
        this.currentPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // Inicia o ciclo de animação
    startAnimation() {
        // Desenha estado inicial
        this.drawStar();
        
        // Configura intervalo de animação
        setInterval(() => {
            this.animatePoints();
        }, this.CONFIG.animationSpeed);
    }
    
    // Método para alterar número de pontas (4-8)
    changeStarPoints(newPoints) {
        if (newPoints >= 4 && newPoints <= 8) {
            this.CONFIG.points = newPoints;
            this.generateStarPoints(); // Já inclui regeneração dos loops
            this.drawStar();
        }
    }
}

// Aguarda carregamento completo da página
document.addEventListener('DOMContentLoaded', () => {
    // Cria instância da estrela flutuante
    const star = new FloatingStar();
    
    // Reajusta canvas quando janela é redimensionada
    window.addEventListener('resize', () => {
        star.setupCanvas();
        star.generateStarPoints();
        star.drawStar();
    });
    
    // Exemplo de como alterar número de pontas (descomente para testar)
    // setTimeout(() => star.changeStarPoints(6), 3000); // Muda para 6 pontas após 3s
    
    // Recria estrela única a cada clique na tela (opcional)
    document.addEventListener('click', () => {
        star.generateStarPoints(); // Já regenera loops automaticamente
        star.drawStar();
    });
});