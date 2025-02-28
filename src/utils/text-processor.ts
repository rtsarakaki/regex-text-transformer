// utils/textProcessor.ts

interface Action {
    description: string;
    action: 'match' | 'replace';
    regex: string;
    value: string;
    active: boolean;
}

interface RulesConfig {
    actions: Action[];
}

export function processarTexto(texto: string, regraString: string): string {
    try {
        // Verificar se temos texto e regras
        if (!texto || !regraString) {
            return texto;
        }

        // Converter string de regras para objeto
        const regras: RulesConfig = JSON.parse(regraString);

        // Filtrar apenas ações ativas
        const acoesAtivas = regras.actions.filter(action => action.active);

        // Aplicar cada ação ao texto
        let resultado = texto;

        for (const action of acoesAtivas) {
            const regex = new RegExp(action.regex, 'g');

            switch (action.action) {
                case 'match':
                    // No caso de 'match', mantemos apenas o que corresponde ao regex
                    const matches = resultado.match(regex);
                    if (matches) {
                        resultado = matches.join(processEscapes(action.value));
                    } else {
                        resultado = '';
                    }
                    break;

                case 'replace':
                    // No caso de 'replace', substituímos o texto correspondente
                    resultado = resultado.replace(regex, processEscapes(action.value));
                    break;
            }
        }

        return resultado;
    } catch (error) {
        console.error('Erro ao processar texto:', error);
        throw new Error(`Erro ao processar texto: ${(error as Error).message}`);
    }
}

// Função para processar caracteres de escape
function processEscapes(value: string): string {
    return value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
}