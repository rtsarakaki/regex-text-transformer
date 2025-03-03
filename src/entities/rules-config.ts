import yaml from 'js-yaml';

export interface Action {
    description: string;
    action: 'match' | 'replace' | 'removeQuotes';
    regex: string;
    value: string;
    active: boolean;
}

export interface RuleGroup {
    title: string;
    actions: Action[];
}

export interface RulesConfig {
    variables?: Record<string, string>;
    groups: RuleGroup[];
}

export const defaultRules = `{
    "variables": {
        "var1": "<h3>{1}</h3>",
        "var2": "<h1>{1}</h1>"
    },
    "groups": [
        {
            "title": "Agrupe as regras para facilitar o entendimento.",
            "actions": [
                {
                    "description": "Descreva o objetivo da ação",
                    "action": "replace",
                    "regex": "###\\s*(.*)",
                    "value": "<VAR=var1>",
                    "active": true
                },
                {
                  "description": "Substituir ## por <h2>conteudo</h2>",
                  "action": "replace",
                  "regex": "##\\s*(.*)",
                  "value": "<h2>{1}</h2>",
                  "active": true
                },
                {
                  "description": "A ordem que as ações são aplicadas altera o resultado",
                  "action": "replace",
                  "regex": "#\\s*(.*)",
                  "value": "<VAR=var2>",
                  "active": true
                }
            ]
        }
    ]
}`;

export function _validateProperty(property: unknown, condition: (prop: unknown) => boolean, name: string, errorMessage: string): void {
    if (property === undefined || property === null) {
        throw new Error(`The property ${name} cannot be null or undefined.`);
    }
    if (typeof condition !== 'function') {
        throw new Error('The condition must be a function.');
    }
    if (typeof name !== 'string') {
        throw new Error('The property name must be a string.');
    }
    if (typeof errorMessage !== 'string') {
        throw new Error('The error message must be a string.');
    }
    if (!condition(property)) {
        throw new Error(errorMessage.replace('{name}', name));
    }
}

export function _validateAllowedProperties(object: Action | RuleGroup, allowedKeys: string[], objectName: string): void {
    if (typeof object !== 'object' || object === null) {
        throw new Error('The object must be a non-null object.');
    }
    if (!Array.isArray(allowedKeys)) {
        throw new Error('The allowedKeys must be an array.');
    }
    if (typeof objectName !== 'string') {
        throw new Error('The objectName must be a string.');
    }

    const objectKeys = Object.keys(object);
    objectKeys.forEach(key => {
        if (!allowedKeys.includes(key)) {
            throw new Error(`${objectName} contains an unknown property: "${key}".`);
        }
    });
}

export function _buildErrorMessage(propertyName: string, index: number | null, context: string, contextName: string, type: string): string {
    if (typeof propertyName !== 'string') {
        throw new Error('The propertyName must be a string.');
    }
    if (index !== null && typeof index !== 'number') {
        throw new Error('The index must be a number or null.');
    }
    if (typeof context !== 'string') {
        throw new Error('The context must be a string.');
    }
    if (typeof contextName !== 'string') {
        throw new Error('The contextName must be a string.');
    }
    if (typeof type !== 'string') {
        throw new Error('The type must be a string.');
    }

    const message = `The property ${propertyName} ${index !== null ? 'at position ' + index + ' ' : ''}in the ${context} ${contextName} must exist and be ${type}.`;
    return message;
}

export function _validateAction(action: Action, actionIndex: number, groupTitle: string): void {
    if (typeof action !== 'object' || action === null) {
        throw new Error('The action must be a non-null object.');
    }
    if (typeof actionIndex !== 'number') {
        throw new Error('The actionIndex must be a number.');
    }
    if (typeof groupTitle !== 'string') {
        throw new Error('The groupTitle must be a string.');
    }

    _validateProperty(
        action.description,
        prop => typeof prop === 'string',
        `group.actions[${actionIndex}].description`,
        _buildErrorMessage('action.description', actionIndex, 'group', groupTitle, 'string')
    );

    _validateProperty(
        action.action,
        prop => prop === 'match' || prop === 'replace' || prop === 'removeQuotes',
        `group.actions[${actionIndex}].action`,
        _buildErrorMessage('action.action', actionIndex, 'group', groupTitle, '"match", "replace" or "removeQuotes"')
    );

    _validateProperty(
        action.regex,
        prop => typeof prop === 'string',
        `group.actions[${actionIndex}].regex`,
        _buildErrorMessage('action.regex', actionIndex, 'group', groupTitle, 'string')
    );

    _validateProperty(
        action.value,
        prop => typeof prop === 'string',
        `group.actions[${actionIndex}].value`,
        _buildErrorMessage('action.value', actionIndex, 'group', groupTitle, 'string')
    );

    _validateProperty(
        action.active,
        prop => typeof prop === 'boolean',
        `group.actions[${actionIndex}].active`,
        _buildErrorMessage('action.active', actionIndex, 'group', groupTitle, 'boolean')
    );

    _validateAllowedProperties(action, ['description', 'action', 'regex', 'value', 'active'], `The action at position ${actionIndex} in the group "${groupTitle}"`);
}

export function _validateGroup(group: RuleGroup, groupIndex: number): void {
    if (typeof group !== 'object' || group === null) {
        throw new Error('The group must be a non-null object.');
    }
    if (typeof groupIndex !== 'number') {
        throw new Error('The groupIndex must be a number.');
    }

    _validateProperty(
        group.title,
        prop => typeof prop === 'string',
        `group[${groupIndex}].title`,
        _buildErrorMessage('group.title', groupIndex, 'group', '', 'string')
    );

    _validateProperty(
        group.actions,
        Array.isArray,
        `group[${groupIndex}].actions`,
        _buildErrorMessage('group.actions', groupIndex, 'group', group.title, 'array')
    );

    group.actions.forEach((action: Action, actionIndex: number) => {
        _validateAction(action, actionIndex, group.title);
    });

    _validateAllowedProperties(group, ['title', 'actions'], `The group "${group.title}"`);
}

export function _escapeSpecialCharactersInRegex(rules: string): string {
    if (typeof rules !== 'string') {
        throw new Error('The rules parameter must be a string.');
    }

    const escapedRules = rules.replace(/"regex":\s*"([^"]*)"/g, (match, p1) => {
        const escapedBackslashes = p1.replace(/\\/g, '\\\\');
        const escapedQuotes = escapedBackslashes.replace(/"/g, '\\"');
        const regex = `"regex": "${escapedQuotes}"`
        return regex;
    });

    return escapedRules;
}

export function validateRulesConfigJson(rules: string): RulesConfig {
    if (typeof rules !== 'string') {
        throw new Error('The rules parameter must be a string.');
    }

    let rulesConfig: RulesConfig;
    try {
        const escapedRules = _escapeSpecialCharactersInRegex(rules);
        rulesConfig = JSON.parse(escapedRules);
    } catch {
        throw new Error('Invalid JSON format.');
    }

    _validateProperty(
        rulesConfig,
        prop => typeof prop === 'object' && prop !== null,
        'rulesConfig',
        'The rules JSON must be an object.'
    );

    if (rulesConfig.variables) {
        _validateProperty(
            rulesConfig.variables,
            prop => typeof prop === 'object' && prop !== null,
            'variables',
            'The "variables" property must be an object.'
        );
    }

    _validateProperty(
        rulesConfig.groups,
        Array.isArray,
        'groups',
        _buildErrorMessage('groups', null, 'JSON', '', 'array')
    );

    rulesConfig.groups.forEach((group: RuleGroup, groupIndex: number) => {
        _validateGroup(group, groupIndex);
    });

    return rulesConfig as RulesConfig;
}

export function validateRulesConfigYaml(rules: string): RulesConfig {
    if (typeof rules !== 'string') {
        throw new Error('The rules parameter must be a string.');
    }

    let rulesConfig: RulesConfig;
    try {
        rulesConfig = yaml.load(rules) as RulesConfig;
    } catch {
        throw new Error('Invalid YAML format.');
    }

    _validateProperty(
        rulesConfig,
        prop => typeof prop === 'object' && prop !== null,
        'rulesConfig',
        'The rules YAML must be an object.'
    );

    if (rulesConfig.variables) {
        _validateProperty(
            rulesConfig.variables,
            prop => typeof prop === 'object' && prop !== null,
            'variables',
            'The "variables" property must be an object.'
        );
    }

    _validateProperty(
        rulesConfig.groups,
        Array.isArray,
        'groups',
        _buildErrorMessage('groups', null, 'YAML', '', 'array')
    );

    rulesConfig.groups.forEach((group: RuleGroup, groupIndex: number) => {
        _validateGroup(group, groupIndex);
    });

    return rulesConfig as RulesConfig;
}

export function detectAndValidateRulesConfig(rules: string): RulesConfig {
    try {
        return validateRulesConfigJson(rules);
    } catch {
        try {
            return validateRulesConfigYaml(rules);
        } catch {
            throw new Error('Invalid rules format. Must be JSON or YAML.');
        }
    }
}