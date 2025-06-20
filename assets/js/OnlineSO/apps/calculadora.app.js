/**
 * @file calculadora.app.js
 * @description Aplicativo de Calculadora simples.
 */

export default class CalculatorApp {
    /**
     * @param {HTMLElement} container - O elemento onde o conteúdo do aplicativo será renderizado.
     */
    constructor(container) {
        this.container = container;
        this.display = null;
        this.expression = '';
    }

    /**
     * Inicializa o aplicativo, criando a interface da calculadora.
     */
    init() {
        // Estilos para o contêiner principal da janela.
        this.container.style.padding = '0';
        this.container.style.overflow = 'hidden';
        this.container.style.backgroundColor = '#222'; // Fundo escuro

        // Cria a estrutura da calculadora
        const calculatorBody = document.createElement('div');
        calculatorBody.style.display = 'flex';
        calculatorBody.style.flexDirection = 'column';
        calculatorBody.style.width = '100%';
        calculatorBody.style.height = '100%';

        this._createDisplay(calculatorBody);
        this._createButtons(calculatorBody);

        this.container.appendChild(calculatorBody);
    }

    /**
     * Cria o display (tela) da calculadora.
     * @param {HTMLElement} parent - O elemento pai onde o display será adicionado.
     */
    _createDisplay(parent) {
        this.display = document.createElement('input');
        this.display.type = 'text';
        this.display.readOnly = true;
        this.display.style.width = '100%';
        this.display.style.height = '60px';
        this.display.style.padding = '10px';
        this.display.style.boxSizing = 'border-box';
        this.display.style.backgroundColor = '#333';
        this.display.style.border = 'none';
        this.display.style.color = '#fff';
        this.display.style.fontSize = '28px';
        this.display.style.textAlign = 'right';
        this.display.style.fontFamily = 'monospace';
        
        parent.appendChild(this.display);
    }

    /**
     * Cria a grade de botões da calculadora.
     * @param {HTMLElement} parent - O elemento pai onde os botões serão adicionados.
     */
    _createButtons(parent) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.display = 'grid';
        buttonsContainer.style.gridTemplateColumns = 'repeat(4, 1fr)'; // 4 colunas
        buttonsContainer.style.gap = '1px';
        buttonsContainer.style.flexGrow = '1';

        const buttonLayout = [
            'C', '/', '*', '-',
            '7', '8', '9', '+',
            '4', '5', '6',
            '1', '2', '3', '=',
            '0', '.', 
        ];

        buttonLayout.forEach(label => {
            const button = document.createElement('button');
            button.textContent = label;
            button.style.backgroundColor = '#555';
            button.style.color = '#fff';
            button.style.border = 'none';
            button.style.fontSize = '20px';
            button.style.cursor = 'pointer';
            button.style.transition = 'background-color 0.2s';
            
            // Estilos especiais para botões de operadores, C e =
            if (['/', '*', '-', '+'].includes(label)) {
                button.style.backgroundColor = '#E67E22'; // Laranja
            }
            if (label === 'C') {
                button.style.backgroundColor = '#E74C3C'; // Vermelho
            }
            if (label === '=') {
                button.style.backgroundColor = '#2ECC71'; // Verde
                button.style.gridRow = '3 / 5'; // Faz o botão de igual ocupar 2 linhas
                button.style.gridColumn = '4 / 5';
            }
            if (label === '0') {
                button.style.gridColumn = '1 / 3'; // Faz o botão 0 ocupar 2 colunas
            }

            buttonsContainer.appendChild(button);
        });

        // Adiciona um único listener no contêiner dos botões (event delegation)
        buttonsContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                this._handleButtonClick(e.target.textContent);
            }
        });

        parent.appendChild(buttonsContainer);
    }

    /**
     * Lida com a lógica de cada clique de botão.
     * @param {string} value - O valor do botão que foi clicado.
     */
    _handleButtonClick(value) {
        if (value === 'C') {
            // Limpa o display
            this.expression = '';
            this.display.value = '';
        } else if (value === '=') {
            // Calcula o resultado usando eval()
            try {
                // Previne eval de código malicioso, validando a expressão
                const sanitizedExpression = this.expression.replace(/[^-()\d/*+.]/g, '');
                const result = eval(sanitizedExpression);
                this.display.value = result;
                this.expression = result.toString();
            } catch (error) {
                this.display.value = 'Erro';
                this.expression = '';
            }
        } else {
            // Adiciona o valor do botão à expressão
            this.expression += value;
            this.display.value = this.expression;
        }
    }
}