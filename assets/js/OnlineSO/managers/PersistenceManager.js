/**
 * @file PersistenceManager.js
 * @description Gerenciador dedicado para salvar e carregar o estado da aplicação
 * no sessionStorage do navegador (isolado por aba).
 */

// Define uma chave única para evitar conflitos
const STORAGE_KEY = 'predoCampozSO_state';

export class PersistenceManager {
    constructor() {
        this.storageKey = STORAGE_KEY;
        console.log("PersistenceManager inicializado usando sessionStorage.");
    }

    /**
     * Salva um objeto de estado no sessionStorage, convertendo-o para JSON.
     * @param {object} stateData - O objeto de estado a ser salvo.
     */
    save(stateData) {
        try {
            const stateString = JSON.stringify(stateData);
            sessionStorage.setItem(this.storageKey, stateString);
        } catch (error) {
            console.error("Erro ao salvar o estado no sessionStorage:", error);
        }
    }

    /**
     * Carrega e converte o estado do sessionStorage de volta para um objeto.
     * @returns {object|null} O objeto de estado salvo, ou null se não houver nada ou ocorrer um erro.
     */
    load() {
        try {
            const stateString = sessionStorage.getItem(this.storageKey);
            
            if (stateString === null) {
                console.log("Nenhum estado salvo encontrado na sessão.");
                return null;
            }
            
            const stateData = JSON.parse(stateString);
            console.log("Estado carregado do sessionStorage:", stateData);
            return stateData;

        } catch (error) {
            console.error("Erro ao carregar ou analisar o estado do sessionStorage:", error);
            return null;
        }
    }

    /**
     * MUDANÇA: Novo método para limpar o estado salvo do sessionStorage para a aba atual.
     */
    clear() {
        try {
            sessionStorage.removeItem(this.storageKey);
            console.log("Estado da sessão removido.");
        } catch (error) {
            console.error("Erro ao remover o estado do sessionStorage:", error);
        }
    }
}