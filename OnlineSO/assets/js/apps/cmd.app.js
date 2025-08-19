/**
 * @file cmd.app.js
 * @description Implementação do aplicativo de Prompt de Comando (CMD).
 */

export default class CmdApp {
    constructor(container) {
        this.container = container;
        this.outputElement = null;
        this.inputElement = null;
        this.isBusy = false; // Flag para bloquear input durante sequências
    }

    init() {
        this.container.style.backgroundColor = '#000000';
        this.container.style.fontFamily = "'Perfect DOS VGA', monospace";
        this.container.style.color = '#FFFFFF';
        this.container.style.padding = '5px';
        this.container.innerHTML = `
            <div class="cmd-output"></div>
            <div class="cmd-input-line">
                <span>&gt;</span>
                <input type="text" class="cmd-input" spellcheck="false" />
            </div>
        `;

        this.outputElement = this.container.querySelector('.cmd-output');
        this.inputElement = this.container.querySelector('.cmd-input');
        
        this.container.addEventListener('click', () => {
            if (!this.isBusy) this.inputElement.focus();
        });
        this.inputElement.focus();

        this.inputElement.addEventListener('keydown', (e) => {
            // Bloqueia novos comandos se uma sequência estiver rodando
            if (this.isBusy) {
                e.preventDefault();
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                const command = this.inputElement.value.trim();
                this._processCommand(command);
                this.inputElement.value = '';
            }
        });

        this._addLine("Predo Campos Command Prompt [Version 1.0.0]");
        this._addLine("(c) 2025 Predo Campos Corporation. All rights reserved.");
        this._addLine("");
    }

    /**
     * Processa o comando digitado pelo usuário.
     * @param {string} command - O comando a ser processado.
     */
    _processCommand(command) {
        this._addLine(`>${command}`);

        const cmd = command.toLowerCase();

        if (cmd === 'mabel') {
            this._addLine('15072024');
        } else if (cmd === 'set love true') {
            // MUDANÇA: Inicia a nova sequência de "instalação"
            this._runLoveSequence();
        } else if (command !== '') {
            this._addLine(`'${command}' não é reconhecido como um comando interno ou externo.`);
        }

        this.container.scrollTop = this.container.scrollHeight;
    }

    /**
     * MUDANÇA: Nova função assíncrona para a sequência de mensagens.
     */
    async _runLoveSequence() {
        this.isBusy = true; // Trava o input

        await this._sleep(500);
        this._addLine("Initializing love protocol...");
        await this._sleep(1000);
        this._addLine("Target recipient: Mabel <3");
        await this._sleep(800);
        this._addLine("Compiling affections.dll... ");
        await this._sleep(1500);
        this._addLine("Deploying romance.exe...");
        await this._sleep(1500);
        this._addLine("Injecting butterflies... OK");
        await this._sleep(1000);
        this._addLine("Status: Success.");
        await this._sleep(500);
        this._addLine("You are now officially in love. Good luck.");
        this._addLine("");

        this.isBusy = false; // Libera o input
        this.inputElement.focus();
    }

    _addLine(text) {
        const line = document.createElement('p');
        line.textContent = text;
        line.style.margin = '0';
        line.style.whiteSpace = 'pre-wrap';
        this.outputElement.appendChild(line);
        this.container.scrollTop = this.container.scrollHeight;
    }

    /**
     * Função auxiliar para criar pausas em funções async.
     * @param {number} ms - Duração da pausa em milissegundos.
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}