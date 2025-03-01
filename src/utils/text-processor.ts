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

export function applyRegexRules(text: string, regexRules: string): string {
    try {
        if (!text || !regexRules) {
            return text;
        }

        const rules: RulesConfig = JSON.parse(regexRules);
        const activeRules = rules.actions.filter(action => action.active);

        return activeRules.reduce((result, action) => {
            const regex = new RegExp(action.regex, 'g');
            return _applyAction(result, regex, action);
        }, text);
    } catch (error) {
        console.error('Erro ao processar texto:', error);
        throw new Error(`Erro ao processar texto: ${(error as Error).message}`);
    }
}

function _applyAction(text: string, regex: RegExp, action: Action): string {
    switch (action.action) {
        case 'match':
            return _getTextMatchingRegex(text, regex, action.value);
        case 'replace':
            return _getTextWithReplacedRegex(text, regex, action.value);
        default:
            return text;
    }
}

function _getTextMatchingRegex(text: string, regex: RegExp, value: string): string {
    const matches = text.match(regex);
    return matches ? matches.join(_processEscapes(value)) : '';
}

function _getTextWithReplacedRegex(text: string, regex: RegExp, value: string): string {
    return text.replace(regex, _processEscapes(value));
}

function _processEscapes(value: string): string {
    return value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
}

export const saveTextToLocalFile = (text: string, name: string, type: string) => {
    const blob = new Blob([text], { type: type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export const loadTextFromLocalFile = (event: React.ChangeEvent<HTMLInputElement>): Promise<string> => {
    return new Promise((resolve, reject) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                resolve(content)
            }
            reader.onerror = () => {
                reject(new Error('Erro ao ler o arquivo'))
            }
            reader.readAsText(file)
        } else {
            reject(new Error('Nenhum arquivo selecionado'))
        }
    })
}