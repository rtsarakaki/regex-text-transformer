import { ChangeEvent } from 'react';
import { loadTextFromLocalFile } from './text-processor';

// Mock personalizado para EventTarget
class MockEventTarget implements EventTarget {
    private listeners: { [type: string]: EventListenerOrEventListenerObject[] } = {};
    result: string | ArrayBuffer | null = null;

    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
    }

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type].filter(l => l !== listener);
        }
    }

    dispatchEvent(event: Event): boolean {
        const type = event.type;
        if (this.listeners[type]) {
            this.listeners[type].forEach(listener => {
                if (typeof listener === 'function') {
                    listener(event);
                } else {
                    listener.handleEvent(event);
                }
            });
        }
        return true;
    }
}

// Mock personalizado para FileReader
class MockFileReader {
    onload: ((event: ProgressEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    result: string | ArrayBuffer | null = null;

    readAsText = jest.fn();

    // Simulação de método de carregamento
    triggerLoad(content: string) {
        if (this.onload) {
            const mockTarget = new MockEventTarget();
            mockTarget.result = content;

            this.onload({
                target: mockTarget as unknown as EventTarget,
                lengthComputable: true,
                loaded: content.length,
                total: content.length,
                type: 'load',
                bubbles: false,
                cancelable: false,
                composed: false,
                currentTarget: null,
                defaultPrevented: false,
                eventPhase: 0,
                isTrusted: true,
                preventDefault: () => { },
                stopPropagation: () => { },
                stopImmediatePropagation: () => { },
                timeStamp: Date.now()
            } as ProgressEvent);
        }
    }

    // Simulação de método de erro
    triggerError() {
        if (this.onerror) {
            this.onerror();
        }
    }
}

describe('loadTextFromLocalFile', () => {
    let originalFileReader: typeof FileReader;

    // Configuração antes de todos os testes
    beforeAll(() => {
        // Salva o FileReader original
        originalFileReader = window.FileReader;
    });

    // Restaura o FileReader original após os testes
    afterAll(() => {
        window.FileReader = originalFileReader;
    });

    // Configuração antes de cada teste
    beforeEach(() => {
        // Substitui o FileReader global por nosso mock
        window.FileReader = MockFileReader as unknown as typeof FileReader;
    });

    // Função auxiliar para criar um mock de evento de arquivo
    const createMockFileEvent = (file?: File): ChangeEvent<HTMLInputElement> => {
        return {
            target: {
                files: file ? [file] : undefined
            },
            // Adiciona propriedades necessárias para satisfazer o tipo ChangeEvent
            nativeEvent: new Event('change'),
            currentTarget: document.createElement('input'),
            bubbles: true,
            cancelable: true,
            type: 'change',
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        } as unknown as ChangeEvent<HTMLInputElement>;
    };

    // it('deve resolver com o conteúdo do arquivo quando o arquivo é carregado com sucesso', async () => {
    //     // Cria um arquivo mock
    //     const mockFile = new File(['Conteúdo de teste'], 'teste.txt', { type: 'text/plain' });
    //     const mockEvent = createMockFileEvent(mockFile);

    //     // Cria a promessa do teste
    //     const loadPromise = loadTextFromLocalFile(mockEvent);

    //     // Obtém a instância do FileReader mock
    //     const fileReaderInstance = window.FileReader.prototype as unknown as MockFileReader;

    //     // Simula o carregamento bem-sucedido
    //     fileReaderInstance.triggerLoad('Conteúdo de teste');

    //     // Verifica se o conteúdo é carregado corretamente
    //     await expect(loadPromise).resolves.toBe('Conteúdo de teste');
    // });

    // it('deve chamar readAsText com o arquivo correto', async () => {
    //     // Cria um arquivo mock
    //     const mockFile = new File(['Conteúdo de teste'], 'teste.txt', { type: 'text/plain' });
    //     const mockEvent = createMockFileEvent(mockFile);

    //     // Chama a função
    //     loadTextFromLocalFile(mockEvent);

    //     // Obtém a instância do FileReader mock
    //     const fileReaderInstance = window.FileReader.prototype as unknown as MockFileReader;

    //     // Verifica se readAsText foi chamado com o arquivo correto
    //     expect(fileReaderInstance.readAsText).toHaveBeenCalledWith(mockFile);
    // });

    it('deve rejeitar quando nenhum arquivo é selecionado', async () => {
        // Cria um evento sem arquivo
        const mockEvent = createMockFileEvent();

        // Verifica se rejeita com a mensagem correta
        await expect(loadTextFromLocalFile(mockEvent)).rejects.toThrow('No file selected');
    });

    // it('deve rejeitar quando ocorre um erro na leitura do arquivo', async () => {
    //     // Cria um arquivo mock
    //     const mockFile = new File(['Conteúdo de teste'], 'teste.txt', { type: 'text/plain' });
    //     const mockEvent = createMockFileEvent(mockFile);

    //     // Cria a promessa do teste
    //     const loadPromise = loadTextFromLocalFile(mockEvent);

    //     // Obtém a instância do FileReader mock
    //     const fileReaderInstance = window.FileReader.prototype as unknown as MockFileReader;

    //     // Simula um erro na leitura
    //     fileReaderInstance.triggerError();

    //     // Verifica se rejeita com a mensagem de erro
    //     await expect(loadPromise).rejects.toThrow('Error reading file');
    // });
});