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

function _validateProperty<T>(property: T, condition: (prop: T) => boolean, name: string, errorMessage: string): asserts property is T {
    if (!condition(property)) {
        throw new Error(errorMessage.replace('{name}', name));
    }
}

function _validateAllowedProperties(object: Action | RuleGroup, allowedKeys: string[], objectName: string) {
    const objectKeys = Object.keys(object);
    objectKeys.forEach(key => {
        if (!allowedKeys.includes(key)) {
            throw new Error(`${objectName} contém uma propriedade desconhecida: "${key}".`);
        }
    });
}

function _buildErrorMessage(propertyName: string, index: number | null, context: string, contextName: string, type: string) {
    const message = `A propriedade ${propertyName} ${index ? 'na posição ' + index : ''} do ${context} ${contextName} deve existir e ser ${type}.`;
    return message;
}

function _validateAction(action: Action, actionIndex: number, groupTitle: string) {
    _validateProperty(
        action.description,
        prop => typeof prop === 'string',
        `group.actions[${actionIndex}].description`,
        _buildErrorMessage('action.description', actionIndex, 'grupo', groupTitle, 'string')
    );

    _validateProperty(
        action.action,
        prop => prop === 'match' || prop === 'replace' || prop === 'removeQuotes',
        `group.actions[${actionIndex}].action`,
        _buildErrorMessage('action.action', actionIndex, 'grupo', groupTitle, '"match", "replace" ou "removeQuotes"')
    );

    _validateProperty(
        action.regex,
        prop => typeof prop === 'string',
        `group.actions[${actionIndex}].regex`,
        _buildErrorMessage('action.regex', actionIndex, 'grupo', groupTitle, 'string')
    );

    _validateProperty(
        action.value,
        prop => typeof prop === 'string',
        `group.actions[${actionIndex}].value`,
        _buildErrorMessage('action.value', actionIndex, 'grupo', groupTitle, 'string')
    );

    _validateProperty(
        action.active,
        prop => typeof prop === 'boolean',
        `group.actions[${actionIndex}].active`,
        _buildErrorMessage('action.active', actionIndex, 'grupo', groupTitle, 'boolean')
    );

    _validateAllowedProperties(action, ['description', 'action', 'regex', 'value', 'active'], `A ação na posição ${actionIndex} do grupo "${groupTitle}"`);
}

function _validateGroup(group: RuleGroup, groupIndex: number) {
    _validateProperty(
        group.title,
        prop => typeof prop === 'string',
        `group[${groupIndex}].title`,
        _buildErrorMessage('group.title', groupIndex, 'grupo', '', 'string')
    );

    _validateProperty(
        group.actions,
        Array.isArray,
        `group[${groupIndex}].actions`,
        _buildErrorMessage('group.actions', groupIndex, 'grupo', group.title, 'array')
    );

    group.actions.forEach((action: Action, actionIndex: number) => {
        _validateAction(action, actionIndex, group.title);
    });

    _validateAllowedProperties(group, ['title', 'actions'], `O grupo "${group.title}"`);
}

export function escapeSpecialCharactersInRegex(rules: string): string {
    return rules.replace(/"regex":\s*"([^"]*)"/g, (match, p1) => {
        const escapedRegex = p1.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return `"regex": "${escapedRegex}"`;
    });
}

export function validateRulesConfigJson(rules: string): RulesConfig {
    const escapedRules = escapeSpecialCharactersInRegex(rules);
    const rulesConfig = JSON.parse(escapedRules);

    _validateProperty(
        rulesConfig,
        prop => typeof prop === 'object' && prop !== null,
        'rulesConfig',
        'O JSON de regras deve ser um objeto.'
    );

    if (rulesConfig.variables) {
        _validateProperty(
            rulesConfig.variables,
            prop => typeof prop === 'object' && prop !== null,
            'variables',
            'A propriedade "variables" deve ser um objeto.'
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
    const rulesConfig = yaml.load(rules) as RulesConfig;

    _validateProperty(
        rulesConfig,
        prop => typeof prop === 'object' && prop !== null,
        'rulesConfig',
        'O YAML de regras deve ser um objeto.'
    );

    if (rulesConfig.variables) {
        _validateProperty(
            rulesConfig.variables,
            prop => typeof prop === 'object' && prop !== null,
            'variables',
            'A propriedade "variables" deve ser um objeto.'
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