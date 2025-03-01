import { Action, RulesConfig, validateRulesConfig } from "@/entities/rules-config";


export function applyRegexRules(text: string, regexRules: string): string {
    try {
        if (!text || !regexRules) {
            return text;
        }

        const rules: RulesConfig = validateRulesConfig(JSON.parse(regexRules));
        const variables = rules.variables || {};

        return rules.groups.reduce((result, group) => {
            const activeActions = group.actions.filter(action => action.active);
            return activeActions.reduce((innerResult, action) => {
                const regexWithVariables = _replaceVariables(action.regex, variables);
                const regex = new RegExp(regexWithVariables, 'g');
                return _applyAction(innerResult, regex, action, variables);
            }, result);
        }, text);
    } catch (error) {
        console.error('Erro ao processar texto:', error);
        throw new Error(`Erro ao processar texto: ${(error as Error).message}`);
    }
}

function _applyAction(text: string, regex: RegExp, action: Action, variables: Record<string, string>): string {
    switch (action.action) {
        case 'match':
            return _extractMatchingText(text, regex, action.value, variables);
        case 'replace':
            return _replaceMatchingText(text, regex, action.value, variables);
        default:
            return text;
    }
}

function _extractMatchingText(text: string, regex: RegExp, value: string, variables: Record<string, string>): string {
    const matches = text.match(regex);
    const regexWithVariables = _replaceVariables(value, variables);
    const regexRemovedEscapes = _processEscapes(regexWithVariables)
    const result = matches ? matches.join(regexRemovedEscapes) : '';
    return result;
}

function _replaceMatchingText(text: string, regex: RegExp, value: string, variables: Record<string, string>): string {
    const regexWithVariables = _replaceVariables(value, variables);
    const regexRemovedEscapes = _processEscapes(regexWithVariables)
    const result = text.replace(regex, regexRemovedEscapes);
    return result;
}

function _replaceVariables(value: string, variables: Record<string, string>): string {
    return Object.keys(variables).reduce((result, key) => {
        const variableRegex = new RegExp(`<VAR=${key}>`, 'g');
        return result.replace(variableRegex, variables[key]);
    }, value);
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