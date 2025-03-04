import { saveTextToLocalFile } from "./text-processor";


describe('saveTextToLocalFile', () => {
    // Configuração para simular APIs do navegador
    beforeEach(() => {
        // Mocks para objetos globais do navegador
        Object.defineProperty(window, 'URL', {
            value: {
                createObjectURL: jest.fn(() => 'mock-url'),
                revokeObjectURL: jest.fn()
            },
            writable: true
        });

        // Mock para document.createElement
        document.createElement = jest.fn(() => ({
            href: '',
            download: '',
            click: jest.fn(),
            setAttribute: jest.fn()
        })) as jest.Mock;

        // Mock para document.body.appendChild
        document.body.appendChild = jest.fn();

        // Mock para document.body.removeChild
        document.body.removeChild = jest.fn();
    });

    it('deve criar um Blob com o texto correto', () => {
        const text = 'Teste de conteúdo';
        const name = 'arquivo.txt';
        const type = 'text/plain';

        saveTextToLocalFile(text, name, type);

        // Verifica se URL.createObjectURL foi chamado com um Blob
        expect(window.URL.createObjectURL).toHaveBeenCalledWith(
            expect.any(Blob)
        );

        // Verifica se o Blob criado contém o texto correto
        const blobCreateCall = (window.URL.createObjectURL as jest.Mock).mock.calls[0][0];
        expect(blobCreateCall.type).toBe(type);
    });

    it('deve criar um elemento de âncora com os atributos corretos', () => {
        const text = 'Teste de conteúdo';
        const name = 'arquivo.txt';
        const type = 'text/plain';

        saveTextToLocalFile(text, name, type);

        // Verifica se o elemento foi criado
        expect(document.createElement).toHaveBeenCalledWith('a');

        // Verifica se os atributos estão corretos
        const anchorElement = (document.createElement as jest.Mock).mock.results[0].value;
        expect(anchorElement.href).toBe('mock-url');
        expect(anchorElement.download).toBe(name);
    });

    it('deve adicionar e remover o elemento do body', () => {
        const text = 'Teste de conteúdo';
        const name = 'arquivo.txt';
        const type = 'text/plain';

        saveTextToLocalFile(text, name, type);

        // Verifica se o elemento foi adicionado ao body
        expect(document.body.appendChild).toHaveBeenCalled();

        // Verifica se o elemento foi removido do body
        expect(document.body.removeChild).toHaveBeenCalled();
    });

    it('deve revogar a URL do objeto', () => {
        const text = 'Teste de conteúdo';
        const name = 'arquivo.txt';
        const type = 'text/plain';

        saveTextToLocalFile(text, name, type);

        // Verifica se URL.revokeObjectURL foi chamado
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
});