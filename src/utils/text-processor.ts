import { Action, detectAndValidateRulesConfig, RulesConfig } from "@/entities/rules-config";

export type Mode = 'process' | 'validate' | 'generate_document';

interface ProcessTextResult {
    processedText: string;
    brokenRules: string[];
}

export function applyRegexRules(text: string, regexRules: string, mode: Mode): string {
    try {
        if (!text || !regexRules) {
            return text;
        }

        const rules: RulesConfig = detectAndValidateRulesConfig(regexRules);
        const variables = rules.variables || {};

        const result = _processTextWithRules(text, rules, variables, mode);

        if (mode === 'validate') {
            return result.brokenRules.length > 0 ? result.brokenRules.join("\n") : 'No rules to apply.';
        }

        return result.processedText;
    } catch (error) {
        console.error('Error processing text:', error);
        throw new Error(`${(error as Error).message}`);
    }
}

function _processTextWithRules(text: string, rules: RulesConfig, variables: Record<string, string>, mode: Mode): ProcessTextResult {
    return rules.groups.reduce<ProcessTextResult>((acc, group) => {
        const activeActions = group.actions.filter(action => action.active);
        const result = activeActions.reduce<ProcessTextResult>((innerAcc, action) => {
            const regexWithVariables = _replaceVariables(action.regex, variables);
            const newText = _applyAction(innerAcc.processedText, regexWithVariables, action, variables);
            const brokenRules = mode === 'validate' && newText !== innerAcc.processedText
                ? [...innerAcc.brokenRules, `Rule "${action.description}" needs to be applied.`]
                : innerAcc.brokenRules;
            return {
                processedText: newText,
                brokenRules
            };
        }, acc);
        return result;
    }, { processedText: text, brokenRules: [] });
}

export function _applyAction(text: string, regexWithVariables: string, action: Action, variables: Record<string, string>): string {
    const regex = new RegExp(regexWithVariables, 'g');
    switch (action.action) {
        case 'removeQuotes':
            const resultremoveQuotes = _removeQuotes(text, regex);
            return resultremoveQuotes
        case 'match':
            const resultMatch = _extractMatchingText(text, regex, action.value);
            return resultMatch
        case 'replace':
            const resultReplace = _replaceMatchingText(text, regex, action.value, variables);
            return resultReplace
        default:
            return text;
    }
}

export function _removeQuotes(text: string, regex: RegExp): string {
    return text.replace(regex, (match) => {
        return match.replace(/"/g, '');
    });
}

export function _extractMatchingText(text: string, regex: RegExp, value: string): string {
    const matches = [...text.matchAll(regex)];
    if (matches.length === 0) {
        return text;
    }

    const extractedText = matches.map(match => match[1]).join(value);
    const result = _processEscapes(extractedText);
    return result;
}

export function _replaceMatchingText(text: string, regex: RegExp, value: string, variables: Record<string, string>): string {
    if (!text) {
        return "";
    }

    const replacedValue = _replaceVariables(value, variables);
    return text.replace(regex, (match, ...groups) => {
        let result = _processEscapes(replacedValue);
        groups.slice(0, -2).forEach((group, index) => {
            result = result.replace(new RegExp(`\\{${index + 1}\\}`, 'g'), group);
        });
        return result;
    });
}

export function _replaceVariables(value: string, variables: Record<string, string> | null | undefined): string {
    if (!variables || typeof variables !== 'object') {
        throw new Error('The variables object is invalid.');
    }

    return Object.keys(variables).reduce((result, key) => {
        const variableRegex = new RegExp(`<VAR=${key}>`, 'g');
        return result.replace(variableRegex, variables[key]);
    }, value);
}

export function _processEscapes(value: string): string {
    return value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
}

export const saveTextToLocalFile = (text: string, name: string, type: string) => {
    const blob = new Blob([text], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export const loadTextFromLocalFile = (event: React.ChangeEvent<HTMLInputElement>): Promise<string> => {
    return new Promise((resolve, reject) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                resolve(content);
            };
            reader.onerror = () => {
                reject(new Error('Error reading file'));
            };
            reader.readAsText(file);
        } else {
            reject(new Error('No file selected'));
        }
    });
}