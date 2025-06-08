    // === CONFIGURAÇÃO GLOBAL ===
    const CONFIG = {
        // Configurações de janela
        windowDefaultWidth: 400,
        windowDefaultHeight: 300,
        windowOffsetIncrement: 30,
        maxZIndex: 1000,
        
        // Configurações do grid responsivo
        taskbarPercentage: 0.10, // 10% do menor lado da tela
        gridMarginPercentage: 0.05, // 5% de margem em cada direção
        iconSize: 80, // Tamanho base do ícone
        
        // Configurações calculadas dinamicamente
        taskbarHeight: 0,
        gridMargin: 0,
        gridSize: 0,
        gridStartX: 0,
        gridStartY: 0,
        maxColunas: 0,
        maxLinhas: 0,
        gridWidth: 0,
        gridHeight: 0,
        
        // Seletores
        desktopSelector: '#desktop',
        windowsContainerSelector: '#windows-container',
        taskbarAppsSelector: '#taskbar-apps',
        taskbarClockSelector: '#taskbar-clock',
        menuButtonSelector: '#menu-button'
    };
    
    // === SISTEMA OPERACIONAL ===
    class SistemaOperacional {
        constructor() {
            this.aplicativosAbertos = new Map();
            this.proximoWindowId = 1;
            this.zIndexAtual = CONFIG.maxZIndex;
            this.contadorAppsAbertos = 0;
            this.isDraggingIcon = false;
            this.gridOcupado = new Map(); // Mapeia posições do grid ocupadas
            this.gridVisualizacao = null; // Referência para o container de visualização
            
            this.inicializar();
        }
        
        inicializar() {
            this.calcularDimensoesGrid();
            this.configurarEventosDesktop();
            this.configurarEventosTaskbar();
            this.iniciarRelogio();
            this.criarVisualizacaoGrid();
            this.inicializarPosicaoIcones();
            this.configurarRedimensionamento();
            
            console.log('Sistema Operacional inicializado');
            console.log('Grid:', {
                colunas: CONFIG.maxColunas,
                linhas: CONFIG.maxLinhas,
                tamanhoGrid: CONFIG.gridSize,
                margemGrid: CONFIG.gridMargin
            });
        }
        
        // === CÁLCULO RESPONSIVO DO GRID ===
        calcularDimensoesGrid() {
            const larguraTela = window.innerWidth;
            const alturaTela = window.innerHeight;
            const menorLado = Math.min(larguraTela, alturaTela);
            
            // Calcula altura da barra de tarefas (10% do menor lado)
            CONFIG.taskbarHeight = Math.floor(menorLado * CONFIG.taskbarPercentage);
            
            // Calcula margem do grid (5% do menor lado)
            CONFIG.gridMargin = Math.floor(menorLado * CONFIG.gridMarginPercentage);
            
            // Área disponível para o grid
            const larguraDisponivel = larguraTela - (CONFIG.gridMargin * 2);
            const alturaDisponivel = alturaTela - CONFIG.taskbarHeight - (CONFIG.gridMargin * 2);
            
            // Calcula tamanho ideal da célula baseado no ícone
            const tamanhoIdealCelula = CONFIG.iconSize + 20; // ícone + padding
            
            // Calcula quantas colunas e linhas cabem
            CONFIG.maxColunas = Math.floor(larguraDisponivel / tamanhoIdealCelula);
            CONFIG.maxLinhas = Math.floor(alturaDisponivel / tamanhoIdealCelula);
            
            // Garante pelo menos 2 colunas (requisito mínimo)
            CONFIG.maxColunas = Math.max(2, CONFIG.maxColunas);
            CONFIG.maxLinhas = Math.max(2, CONFIG.maxLinhas);
            
            // Calcula tamanho real da célula para usar todo o espaço disponível
            CONFIG.gridSize = Math.min(
                Math.floor(larguraDisponivel / CONFIG.maxColunas),
                Math.floor(alturaDisponivel / CONFIG.maxLinhas)
            );
            
            // Calcula área real do grid
            CONFIG.gridWidth = CONFIG.maxColunas * CONFIG.gridSize;
            CONFIG.gridHeight = CONFIG.maxLinhas * CONFIG.gridSize;
            
            // Centraliza o grid na área disponível
            CONFIG.gridStartX = CONFIG.gridMargin + Math.floor((larguraDisponivel - CONFIG.gridWidth) / 2);
            CONFIG.gridStartY = CONFIG.gridMargin + Math.floor((alturaDisponivel - CONFIG.gridHeight) / 2);
            
            // Atualiza CSS da barra de tarefas
            this.atualizarBarraDeTaskas();
        }
        
        atualizarBarraDeTaskas() {
            const taskbar = document.querySelector('.taskbar');
            if (taskbar) {
                taskbar.style.height = `${CONFIG.taskbarHeight}px`;
            }
            
            // Atualiza altura do desktop
            const desktop = document.querySelector('.desktop');
            if (desktop) {
                desktop.style.height = `calc(100vh - ${CONFIG.taskbarHeight}px)`;
            }
            
            // Atualiza container de janelas
            const windowsContainer = document.querySelector('.windows-container');
            if (windowsContainer) {
                windowsContainer.style.height = `calc(100vh - ${CONFIG.taskbarHeight}px)`;
            }
        }
        
        // === REDIMENSIONAMENTO RESPONSIVO ===
        configurarRedimensionamento() {
            window.addEventListener('resize', () => {
                this.debounce(() => {
                    console.log('Redimensionando grid...');
                    this.recalcularGrid();
                }, 250);
            });
        }
        
        debounce(func, wait) {
            if (this.debounceTimer) clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(func, wait);
        }
        
        recalcularGrid() {
            // Salva posições atuais dos ícones
            const posicoesIcones = this.salvarPosicoesIcones();
            
            // Recalcula dimensões
            this.calcularDimensoesGrid();
            
            // Remove visualização antiga
            if (this.gridVisualizacao) {
                this.gridVisualizacao.remove();
            }
            
            // Recria visualização
            this.criarVisualizacaoGrid();
            
            // Reposiciona ícones
            this.reposicionarIcones(posicoesIcones);
            
            console.log('Grid redimensionado:', {
                colunas: CONFIG.maxColunas,
                linhas: CONFIG.maxLinhas,
                tamanhoGrid: CONFIG.gridSize
            });
        }
        
        salvarPosicoesIcones() {
            const posicoes = new Map();
            for (const [chave, nomeApp] of this.gridOcupado.entries()) {
                const [coluna, linha] = chave.split(',').map(Number);
                posicoes.set(nomeApp, { coluna, linha });
            }
            return posicoes;
        }
        
        reposicionarIcones(posicoesAnteriores) {
            // Limpa grid e reinicializa com posições padrão
            this.inicializarPosicaoIcones();
        }
        
        encontrarPosicaoLivrePara(coluna, linha, nomeApp) {
            // Procura posição livre a partir da posição desejada
            for (let l = 0; l < CONFIG.maxLinhas; l++) {
                for (let c = 0; c < CONFIG.maxColunas; c++) {
                    const chave = `${c},${l}`;
                    if (!this.gridOcupado.has(chave)) {
                        return { coluna: c, linha: l };
                    }
                }
            }
            // Se não encontrou, sobrescreve a primeira posição
            return { coluna: 0, linha: 0 };
        }
        
        // === VISUALIZAÇÃO DO GRID ===
        criarVisualizacaoGrid() {
            const desktop = document.querySelector(CONFIG.desktopSelector);
            this.gridVisualizacao = document.createElement('div');
            this.gridVisualizacao.id = 'grid-visualization';
            this.gridVisualizacao.style.position = 'absolute';
            this.gridVisualizacao.style.top = '0';
            this.gridVisualizacao.style.left = '0';
            this.gridVisualizacao.style.width = '100%';
            this.gridVisualizacao.style.height = '100%';
            this.gridVisualizacao.style.pointerEvents = 'none';
            this.gridVisualizacao.style.zIndex = '1';
            
            // Cria células do grid para visualização
            for (let coluna = 0; coluna < CONFIG.maxColunas; coluna++) {
                for (let linha = 0; linha < CONFIG.maxLinhas; linha++) {
                    const celula = document.createElement('div');
                    celula.className = 'grid-cell';
                    celula.style.left = `${CONFIG.gridStartX + (coluna * CONFIG.gridSize)}px`;
                    celula.style.top = `${CONFIG.gridStartY + (linha * CONFIG.gridSize)}px`;
                    celula.style.width = `${CONFIG.gridSize}px`;
                    celula.style.height = `${CONFIG.gridSize}px`;
                    celula.dataset.posicao = `${coluna},${linha}`;
                    
                    this.gridVisualizacao.appendChild(celula);
                }
            }
            
            desktop.appendChild(this.gridVisualizacao);
            console.log(`Grid de visualização criado: ${CONFIG.maxColunas}x${CONFIG.maxLinhas}`);
        }
        
        // === GERENCIAMENTO DE ÍCONES ===
        inicializarPosicaoIcones() {
            const icones = document.querySelectorAll('.desktop-icon');
            this.gridOcupado.clear();
            
            // Define ordem específica e posições
            const ordemIcones = {
                'internet': { coluna: 0, linha: 0 },
                'arquivos': { coluna: 0, linha: 1 },
                'notas': { coluna: 0, linha: 2 },
                'calculadora': { coluna: 0, linha: 3 },
                'cobra': { coluna: 0, linha: 4 },
                'lixo': { coluna: CONFIG.maxColunas - 1, linha: CONFIG.maxLinhas - 1 } // Última posição
            };
            
            icones.forEach(icone => {
                const nomeApp = icone.dataset.app;
                const posicao = ordemIcones[nomeApp];
                
                if (posicao) {
                    // Verifica se a posição está dentro dos limites do grid
                    if (posicao.coluna < CONFIG.maxColunas && posicao.linha < CONFIG.maxLinhas) {
                        const coordenadas = this.obterCoordenadaGrid(`${posicao.coluna},${posicao.linha}`);
                        icone.style.left = `${coordenadas.x}px`;
                        icone.style.top = `${coordenadas.y}px`;
                        
                        // Marca posição como ocupada
                        this.gridOcupado.set(`${posicao.coluna},${posicao.linha}`, nomeApp);
                    } else {
                        // Se não cabe na posição padrão, encontra uma posição livre
                        const posicaoLivre = this.encontrarPosicaoLivrePara(0, 0, nomeApp);
                        const coordenadas = this.obterCoordenadaGrid(`${posicaoLivre.coluna},${posicaoLivre.linha}`);
                        icone.style.left = `${coordenadas.x}px`;
                        icone.style.top = `${coordenadas.y}px`;
                        this.gridOcupado.set(`${posicaoLivre.coluna},${posicaoLivre.linha}`, nomeApp);
                    }
                }
            });
            
            console.log('Posições padrão dos ícones definidas');
        }
        
        calcularPosicaoGrid(index) {
            const coluna = index % CONFIG.maxColunas;
            const linha = Math.floor(index / CONFIG.maxColunas);
            
            return {
                x: CONFIG.gridStartX + (coluna * CONFIG.gridSize),
                y: CONFIG.gridStartY + (linha * CONFIG.gridSize)
            };
        }
        
        calcularPosicaoGridPorIndice(index) {
            const coluna = index % CONFIG.maxColunas;
            const linha = Math.floor(index / CONFIG.maxColunas);
            
            return { coluna, linha };
        }
        
        // Converte coordenadas para chave do grid
        obterChaveGrid(x, y) {
            const coluna = Math.round((x - CONFIG.gridStartX) / CONFIG.gridSize);
            const linha = Math.round((y - CONFIG.gridStartY) / CONFIG.gridSize);
            return `${coluna},${linha}`;
        }
        
        // Converte chave do grid para coordenadas
        obterCoordenadaGrid(chaveGrid) {
            const [coluna, linha] = chaveGrid.split(',').map(Number);
            return {
                x: CONFIG.gridStartX + (coluna * CONFIG.gridSize),
                y: CONFIG.gridStartY + (linha * CONFIG.gridSize)
            };
        }
        
        // Verifica se uma posição está ocupada
        posicaoOcupada(x, y, iconeAtual) {
            const chave = this.obterChaveGrid(x, y);
            const ocupante = this.gridOcupado.get(chave);
            return ocupante && ocupante !== iconeAtual;
        }
        
        // Encontra a próxima posição livre seguindo a regra de cascata vertical
        encontrarProximaPosicaoLivre(coluna, linha, iconeAtual) {
            // Primeiro verifica se a posição desejada está livre
            let chave = `${coluna},${linha}`;
            if (!this.gridOcupado.has(chave) || this.gridOcupado.get(chave) === iconeAtual) {
                return { coluna, linha };
            }
            
            // Se ocupada, procura posição livre seguindo as regras
            return this.buscarPosicaoLivreRecursiva(coluna, linha, iconeAtual, new Set());
        }
        
        buscarPosicaoLivreRecursiva(coluna, linha, iconeAtual, visitadas) {
            let colunaAtual = coluna;
            let linhaAtual = linha;
            
            // Percorre todas as colunas possíveis
            for (let tentativaColuna = 0; tentativaColuna < CONFIG.maxColunas * 2; tentativaColuna++) {
                // Calcula qual coluna estamos testando (com wrap-around)
                const colunaTest = (colunaAtual + tentativaColuna) % CONFIG.maxColunas;
                
                // Se estamos na coluna original, começa da linha desejada
                // Se é uma nova coluna, começa do topo (linha 0)
                const linhaInicial = (colunaTest === coluna) ? linhaAtual : 0;
                
                // Percorre as linhas da coluna atual
                for (let linhaTest = linhaInicial; linhaTest < CONFIG.maxLinhas; linhaTest++) {
                    const chave = `${colunaTest},${linhaTest}`;
                    
                    // Evita loops infinitos
                    if (visitadas.has(chave)) continue;
                    visitadas.add(chave);
                    
                    // Se posição está livre, retorna
                    if (!this.gridOcupado.has(chave) || this.gridOcupado.get(chave) === iconeAtual) {
                        return { coluna: colunaTest, linha: linhaTest };
                    }
                }
            }
            
            // Se não encontrou nada, retorna posição original
            return { coluna, linha };
        }
        
        // Move ícones em cascata vertical com inserção na posição exata
        moverIconesCascataVerticalNova(coluna, linha, iconeMovido) {
            // Coleta todos os ícones da coluna a partir da posição de inserção
            const iconesParaMover = [];
            
            for (let l = linha; l < CONFIG.maxLinhas; l++) {
                const chave = `${coluna},${l}`;
                if (this.gridOcupado.has(chave)) {
                    const nomeApp = this.gridOcupado.get(chave);
                    const icone = this.encontrarIconePorApp(nomeApp);
                    if (icone && icone !== iconeMovido) {
                        iconesParaMover.push({
                            icone: icone,
                            nomeApp: nomeApp,
                            linhaOriginal: l
                        });
                    }
                }
            }
            
            console.log(`Movendo ${iconesParaMover.length} ícones da coluna ${coluna}`);
            
            // Remove todos os ícones da coluna que serão movidos
            iconesParaMover.forEach(item => {
                const chave = `${coluna},${item.linhaOriginal}`;
                this.gridOcupado.delete(chave);
            });
            
            // Reposiciona os ícones uma linha abaixo
            iconesParaMover.forEach((item, index) => {
                let novaLinha = linha + 1 + index;
                let novaColuna = coluna;
                
                // Se ultrapassou o limite da coluna atual, vai para próxima coluna
                if (novaLinha >= CONFIG.maxLinhas) {
                    // NOVA REGRA: Se não há próxima coluna, empurra para cima
                    if (coluna >= CONFIG.maxColunas - 1) {
                        // Encontra posição livre empurrando para cima
                        const posicaoLivre = this.encontrarPosicaoEmpurrandoParaCima(coluna, linha);
                        novaColuna = posicaoLivre.coluna;
                        novaLinha = posicaoLivre.linha;
                    } else {
                        // Vai para próxima coluna
                        novaColuna = coluna + 1;
                        novaLinha = 0;
                        
                        // Se a próxima coluna tem ícones, continua a cascata
                        const novaChave = `${novaColuna},${novaLinha}`;
                        if (this.gridOcupado.has(novaChave)) {
                            this.moverIconesCascataVerticalNova(novaColuna, novaLinha, item.icone);
                        }
                    }
                }
                
                // Move o ícone para a nova posição
                const coordenadas = this.obterCoordenadaGrid(`${novaColuna},${novaLinha}`);
                item.icone.style.left = `${coordenadas.x}px`;
                item.icone.style.top = `${coordenadas.y}px`;
                
                // Atualiza o grid
                this.gridOcupado.set(`${novaColuna},${novaLinha}`, item.nomeApp);
                
                console.log(`${item.nomeApp} movido para ${novaColuna},${novaLinha}`);
            });
        }
        
        // Encontra posição livre empurrando ícones para cima
        encontrarPosicaoEmpurrandoParaCima(colunaOriginal, linhaOriginal) {
            // Procura primeiro espaço livre acima da posição atual na mesma coluna
            for (let l = linhaOriginal - 1; l >= 0; l--) {
                const chave = `${colunaOriginal},${l}`;
                if (!this.gridOcupado.has(chave)) {
                    return { coluna: colunaOriginal, linha: l };
                }
            }
            
            // Se não encontrou espaço acima, empurra todos os ícones para cima
            const iconesParaEmpurrar = [];
            for (let l = 0; l < linhaOriginal; l++) {
                const chave = `${colunaOriginal},${l}`;
                if (this.gridOcupado.has(chave)) {
                    const nomeApp = this.gridOcupado.get(chave);
                    const icone = this.encontrarIconePorApp(nomeApp);
                    iconesParaEmpurrar.push({
                        icone: icone,
                        nomeApp: nomeApp,
                        linha: l
                    });
                }
            }
            
            // Remove todos da posição atual
            iconesParaEmpurrar.forEach(item => {
                this.gridOcupado.delete(`${colunaOriginal},${item.linha}`);
            });
            
            // Reposiciona empurrando para cima (linha 0 fica vazia)
            iconesParaEmpurrar.forEach((item, index) => {
                const novaLinha = index + 1;
                const coordenadas = this.obterCoordenadaGrid(`${colunaOriginal},${novaLinha}`);
                item.icone.style.left = `${coordenadas.x}px`;
                item.icone.style.top = `${coordenadas.y}px`;
                this.gridOcupado.set(`${colunaOriginal},${novaLinha}`, item.nomeApp);
            });
            
            // Retorna a linha 0 como disponível
            return { coluna: colunaOriginal, linha: 0 };
        }
        
        // Encontra ícone pelo nome do app
        encontrarIconePorApp(nomeApp) {
            return document.querySelector(`.desktop-icon[data-app="${nomeApp}"]`);
        }
        
        configurarEventosDesktop() {
            const icones = document.querySelectorAll('.desktop-icon');
            
            icones.forEach(icone => {
                // Apenas duplo clique para tudo
                icone.addEventListener('dblclick', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (this.isDraggingIcon) return;
                    
                    const nomeApp = icone.dataset.app;
                    
                    // Verifica se o aplicativo está aberto
                    if (this.aplicativosAbertos.has(nomeApp)) {
                        const app = this.aplicativosAbertos.get(nomeApp);
                        
                        // Se está minimizado, desminimiza
                        if (app.minimizada) {
                            console.log(`Desminimizando ${nomeApp}`);
                            this.restaurarJanela(nomeApp);
                        } else {
                            // Se está visível, minimiza
                            console.log(`Minimizando ${nomeApp}`);
                            this.minimizarJanela(nomeApp);
                        }
                    } else {
                        // Se não está aberto, abre o aplicativo
                        console.log(`Abrindo ${nomeApp}`);
                        this.abrirAplicativo(nomeApp);
                    }
                });
                
                // Clique simples apenas para seleção
                icone.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (!this.isDraggingIcon) {
                        this.selecionarIcone(icone);
                    }
                });
                
                // Sistema de arrastar
                this.configurarArrastarIcone(icone);
            });
            
            // Clique no desktop limpa seleção
            document.querySelector(CONFIG.desktopSelector).addEventListener('click', () => {
                this.limparSelecaoIcones();
            });
        }
        
        selecionarIcone(icone) {
            this.limparSelecaoIcones();
            icone.classList.add('selected');
        }
        
        configurarArrastarIcone(icone) {
            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;
            
            icone.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                
                this.isDraggingIcon = true;
                isDragging = true;
                
                const rect = icone.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                
                icone.classList.add('dragging');
                icone.style.zIndex = 1000;
                
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                
                const maxX = window.innerWidth - 80;
                const maxY = window.innerHeight - CONFIG.taskbarHeight - 80;
                
                icone.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                icone.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            });
            
            document.addEventListener('mouseup', () => {
                if (!isDragging) return;
                
                isDragging = false;
                setTimeout(() => { this.isDraggingIcon = false; }, 100);
                
                icone.classList.remove('dragging');
                icone.style.zIndex = 'auto';
                
                this.encaixarNaGrade(icone);
            });
        }
        
        encaixarNaGrade(icone) {
            const x = parseInt(icone.style.left);
            const y = parseInt(icone.style.top);
            
            // Remove o ícone da posição atual no grid
            const chaveAtual = this.encontrarChaveIcone(icone.dataset.app);
            if (chaveAtual) {
                this.gridOcupado.delete(chaveAtual);
            }
            
            // Calcula a posição da grade mais próxima
            let gridX = Math.round((x - CONFIG.gridStartX) / CONFIG.gridSize) * CONFIG.gridSize + CONFIG.gridStartX;
            let gridY = Math.round((y - CONFIG.gridStartY) / CONFIG.gridSize) * CONFIG.gridSize + CONFIG.gridStartY;
            
            // CORREÇÃO: Garante que não sai dos limites do grid (não apenas da tela)
            const maxGridX = CONFIG.gridStartX + ((CONFIG.maxColunas - 1) * CONFIG.gridSize);
            const maxGridY = CONFIG.gridStartY + ((CONFIG.maxLinhas - 1) * CONFIG.gridSize);
            
            const finalX = Math.max(CONFIG.gridStartX, Math.min(gridX, maxGridX));
            const finalY = Math.max(CONFIG.gridStartY, Math.min(gridY, maxGridY));
            
            // Converte para coluna/linha
            const coluna = Math.round((finalX - CONFIG.gridStartX) / CONFIG.gridSize);
            const linha = Math.round((finalY - CONFIG.gridStartY) / CONFIG.gridSize);
            
            // Verifica se há colisão e move ícones em cascata vertical
            const chaveDestino = `${coluna},${linha}`;
            if (this.gridOcupado.has(chaveDestino) && this.gridOcupado.get(chaveDestino) !== icone.dataset.app) {
                console.log(`Colisão detectada na posição ${coluna},${linha}`);
                this.moverIconesCascataVerticalNova(coluna, linha, icone);
            }
            
            // Move o ícone para a posição desejada
            icone.style.left = `${finalX}px`;
            icone.style.top = `${finalY}px`;
            
            // Atualiza o grid com a nova posição do ícone movido
            this.gridOcupado.set(chaveDestino, icone.dataset.app);
            
            console.log(`${icone.dataset.app} colocado na posição ${coluna},${linha}`);
        }
        
        // Encontra a chave atual de um ícone no grid
        encontrarChaveIcone(nomeApp) {
            for (const [chave, app] of this.gridOcupado.entries()) {
                if (app === nomeApp) {
                    return chave;
                }
            }
            return null;
        }
        
        limparSelecaoIcones() {
            const icones = document.querySelectorAll('.desktop-icon');
            icones.forEach(icone => {
                icone.classList.remove('selected');
            });
        }
        
        // === SISTEMA DE APLICATIVOS ===
        abrirAplicativo(nomeApp) {
            // Se já está aberto, apenas foca
            if (this.aplicativosAbertos.has(nomeApp)) {
                this.focarJanela(nomeApp);
                return;
            }
            
            const windowId = `window-${this.proximoWindowId++}`;
            const janela = this.criarJanela(windowId, nomeApp);
            
            // Registra o aplicativo
            this.aplicativosAbertos.set(nomeApp, {
                windowId: windowId,
                elemento: janela,
                minimizada: false,
                maximizada: false,
                posicaoOriginal: null
            });
            
            // Adiciona na barra de tarefas
            this.adicionarNaTaskbar(nomeApp);
            
            // Carrega conteúdo do aplicativo
            this.executarAplicativo(nomeApp, janela.querySelector('.window-content'));
            
            console.log(`Aplicativo '${nomeApp}' aberto`);
        }
        
        criarJanela(windowId, titulo) {
            const container = document.querySelector(CONFIG.windowsContainerSelector);
            
            const janela = document.createElement('div');
            janela.className = 'window';
            janela.id = windowId;
            janela.style.zIndex = ++this.zIndexAtual;
            
            // Posicionamento inteligente
            let x, y;
            if (this.contadorAppsAbertos === 0) {
                // Centro da tela
                x = (window.innerWidth - CONFIG.windowDefaultWidth) / 2;
                y = (window.innerHeight - CONFIG.taskbarHeight - CONFIG.windowDefaultHeight) / 2;
            } else {
                // Offset proporcional
                const offset = this.contadorAppsAbertos * CONFIG.windowOffsetIncrement;
                x = ((window.innerWidth - CONFIG.windowDefaultWidth) / 2) + offset;
                y = ((window.innerHeight - CONFIG.taskbarHeight - CONFIG.windowDefaultHeight) / 2) + offset;
                
                // Evita sair da tela
                const maxX = window.innerWidth - CONFIG.windowDefaultWidth - 20;
                const maxY = window.innerHeight - CONFIG.taskbarHeight - CONFIG.windowDefaultHeight - 20;
                
                if (x > maxX || y > maxY) {
                    x = 50;
                    y = 50;
                }
            }
            
            janela.style.left = `${x}px`;
            janela.style.top = `${y}px`;
            janela.style.width = `${CONFIG.windowDefaultWidth}px`;
            janela.style.height = `${CONFIG.windowDefaultHeight}px`;
            
            this.contadorAppsAbertos++;
            
            janela.innerHTML = `
                <div class="window-header">
                    <span class="window-title">${this.capitalizarTexto(titulo)}</span>
                    <div class="window-controls">
                        <button class="window-control minimize-btn">_</button>
                        <button class="window-control maximize-btn">□</button>
                        <button class="window-control close-btn">×</button>
                    </div>
                </div>
                <div class="window-content">
                    <p>Carregando ${titulo}...</p>
                </div>
            `;
            
            container.appendChild(janela);
            this.configurarEventosJanela(janela, titulo);
            
            return janela;
        }
        
        configurarEventosJanela(janela, nomeApp) {
            const header = janela.querySelector('.window-header');
            const minimizeBtn = janela.querySelector('.minimize-btn');
            const maximizeBtn = janela.querySelector('.maximize-btn');
            const closeBtn = janela.querySelector('.close-btn');
            
            // Arrastar janela
            this.tornarArrastavel(janela, header, nomeApp);
            
            // Focar ao clicar
            janela.addEventListener('mousedown', () => {
                this.focarJanela(nomeApp);
            });
            
            // Botões
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.minimizarJanela(nomeApp);
            });
            
            maximizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.alternarMaximizarJanela(nomeApp);
            });
            
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.fecharAplicativo(nomeApp);
            });
            
            // Duplo clique no header para maximizar
            header.addEventListener('dblclick', () => {
                this.alternarMaximizarJanela(nomeApp);
            });
        }
        
        tornarArrastavel(janela, header, nomeApp) {
            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;
            
            header.addEventListener('mousedown', (e) => {
                const app = this.aplicativosAbertos.get(nomeApp);
                if (app && app.maximizada) return;
                
                isDragging = true;
                offsetX = e.clientX - janela.offsetLeft;
                offsetY = e.clientY - janela.offsetTop;
                janela.style.zIndex = ++this.zIndexAtual;
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const x = e.clientX - offsetX;
                const y = e.clientY - offsetY;
                
                const maxX = window.innerWidth - janela.offsetWidth;
                const maxY = window.innerHeight - CONFIG.taskbarHeight - janela.offsetHeight;
                
                janela.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
                janela.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }
        
        // === CONTROLE DE JANELAS ===
        focarJanela(nomeApp) {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (!app) return;
            
            if (app.minimizada) {
                this.restaurarJanela(nomeApp);
            }
            
            app.elemento.style.zIndex = ++this.zIndexAtual;
            this.atualizarEstadoTaskbar();
        }
        
        minimizarJanela(nomeApp) {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (!app) return;
            
            app.elemento.classList.add('minimized');
            app.minimizada = true;
            this.atualizarEstadoTaskbar();
        }
        
        restaurarJanela(nomeApp) {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (!app) return;
            
            app.elemento.classList.remove('minimized');
            app.minimizada = false;
            app.elemento.style.zIndex = ++this.zIndexAtual;
            this.atualizarEstadoTaskbar();
        }
        
        alternarMaximizarJanela(nomeApp) {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (!app) return;
            
            if (app.maximizada) {
                this.restaurarTamanhoJanela(nomeApp);
            } else {
                this.maximizarJanela(nomeApp);
            }
        }
        
        maximizarJanela(nomeApp) {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (!app) return;
            
            const janela = app.elemento;
            
            // Salva posição original
            app.posicaoOriginal = {
                left: janela.style.left,
                top: janela.style.top,
                width: janela.style.width,
                height: janela.style.height
            };
            
            janela.classList.add('maximized');
            app.maximizada = true;
            
            const maximizeBtn = janela.querySelector('.maximize-btn');
            if (maximizeBtn) {
                maximizeBtn.textContent = '❐';
            }
            
            this.atualizarEstadoTaskbar();
        }
        
        restaurarTamanhoJanela(nomeApp) {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (!app) return;
            
            const janela = app.elemento;
            janela.classList.remove('maximized');
            
            if (app.posicaoOriginal) {
                janela.style.left = app.posicaoOriginal.left;
                janela.style.top = app.posicaoOriginal.top;
                janela.style.width = app.posicaoOriginal.width;
                janela.style.height = app.posicaoOriginal.height;
            }
            
            app.maximizada = false;
            
            const maximizeBtn = janela.querySelector('.maximize-btn');
            if (maximizeBtn) {
                maximizeBtn.textContent = '□';
            }
            
            this.atualizarEstadoTaskbar();
        }
        
        fecharAplicativo(nomeApp) {
            const app = this.aplicativosAbertos.get(nomeApp);
            if (!app) return;
            
            app.elemento.remove();
            this.aplicativosAbertos.delete(nomeApp);
            this.contadorAppsAbertos = Math.max(0, this.contadorAppsAbertos - 1);
            this.removerDaTaskbar(nomeApp);
            
            console.log(`Aplicativo '${nomeApp}' fechado`);
        }
        
        // === BARRA DE TAREFAS ===
        configurarEventosTaskbar() {
            document.querySelector(CONFIG.menuButtonSelector).addEventListener('click', () => {
                console.log('Menu clicado - funcionalidade futura');
            });
        }
        
        adicionarNaTaskbar(nomeApp) {
            const container = document.querySelector(CONFIG.taskbarAppsSelector);
            
            const botao = document.createElement('button');
            botao.className = 'taskbar-app';
            botao.dataset.app = nomeApp;
            botao.textContent = this.capitalizarTexto(nomeApp);
            
            botao.addEventListener('click', () => {
                const app = this.aplicativosAbertos.get(nomeApp);
                if (app && app.minimizada) {
                    this.restaurarJanela(nomeApp);
                } else if (app && !app.minimizada) {
                    this.minimizarJanela(nomeApp);
                }
            });
            
            container.appendChild(botao);
            this.atualizarEstadoTaskbar();
        }
        
        removerDaTaskbar(nomeApp) {
            const botao = document.querySelector(`${CONFIG.taskbarAppsSelector} [data-app="${nomeApp}"]`);
            if (botao) {
                botao.remove();
            }
        }
        
        atualizarEstadoTaskbar() {
            const botoes = document.querySelectorAll('.taskbar-app');
            
            botoes.forEach(botao => {
                const nomeApp = botao.dataset.app;
                const app = this.aplicativosAbertos.get(nomeApp);
                
                if (app && !app.minimizada) {
                    botao.classList.add('active');
                } else {
                    botao.classList.remove('active');
                }
            });
        }
        
        // === RELÓGIO ===
        iniciarRelogio() {
            const atualizarRelogio = () => {
                const agora = new Date();
                const horas = agora.getHours().toString().padStart(2, '0');
                const minutos = agora.getMinutes().toString().padStart(2, '0');
                
                const elementoRelogio = document.querySelector(CONFIG.taskbarClockSelector);
                if (elementoRelogio) {
                    elementoRelogio.textContent = `${horas}:${minutos}`;
                }
            };
            
            atualizarRelogio();
            setInterval(atualizarRelogio, 1000);
        }
        
        // === APLICATIVOS ===
        executarAplicativo(nomeApp, containerContent) {
            const aplicativosDisponiveis = {
                'notas': 'Editor de texto simples',
                'calculadora': 'Calculadora básica',
                'internet': 'Navegador web',
                'lixo': 'Lixeira do sistema',
                'arquivos': 'Explorador de arquivos',
                'cobra': 'Jogo da cobrinha'
            };
            
            const descricao = aplicativosDisponiveis[nomeApp] || 'Aplicativo desconhecido';
            
            containerContent.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3>${this.capitalizarTexto(nomeApp)}</h3>
                    <p>${descricao}</p>
                    <br>
                    <p><em>Aplicativo será implementado em breve...</em></p>
                </div>
            `;
            
            // Evento para aplicativos específicos
            window.dispatchEvent(new CustomEvent('aplicativo-aberto', {
                detail: { nomeApp, containerContent }
            }));
        }
        
        // === UTILITÁRIOS ===
        capitalizarTexto(texto) {
            return texto.charAt(0).toUpperCase() + texto.slice(1);
        }
    }
    
    // === INICIALIZAÇÃO ===
    document.addEventListener('DOMContentLoaded', () => {
        window.SO = new SistemaOperacional();
        console.log('Sistema Operacional carregado');
    });