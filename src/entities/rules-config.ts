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
    const message = `A propriedade ${propertyName} ${index ? 'na posição' + index : ''} do ${context} ${contextName} deve existir e ser ${type}.`
    return message;
}

function _escapeSpecialCharactersInRegex(rules: string): string {
    return rules.replace(/"regex":\s*"([^"]*)"/g, (match, p1) => {
        const escapedRegex = p1.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        console.log(escapedRegex);
        return `"regex": "${escapedRegex}"`;
    });
}

export function validateRulesConfig(rules: string): RulesConfig {
    const escapedRules = _escapeSpecialCharactersInRegex(rules);
    const rulesConfig = JSON.parse(escapedRules);

    _validateProperty(
        rulesConfig
        , prop => typeof prop === 'object' && prop !== null
        , 'rulesConfig'
        , 'O JSON de regras deve ser um objeto.');

    if (rulesConfig.variables) {
        _validateProperty(
            rulesConfig.variables,
            prop => typeof prop === 'object' && prop !== null,
            'variables',
            'A propriedade "variables" deve ser um objeto.'
        );
    }

    _validateProperty(
        rulesConfig.groups
        , Array.isArray
        , 'groups'
        , _buildErrorMessage('groups', null, 'JSON', '', 'array'));

    rulesConfig.groups.forEach((group: RuleGroup, groupIndex: number) => {
        _validateProperty(
            group.title
            , prop => typeof prop === 'string'
            , `group[${groupIndex}].title`
            , _buildErrorMessage('group.title', groupIndex, 'grupo', '', 'string'));

        _validateProperty(
            group.actions
            , Array.isArray
            , `group[${groupIndex}].actions`
            , _buildErrorMessage('group.actions', groupIndex, 'grupo', group.title, 'array'));

        group.actions.forEach((action: Action, actionIndex: number) => {
            _validateProperty(
                action.description
                , prop => typeof prop === 'string'
                , `group[${groupIndex}].actions[${actionIndex}].description`
                , _buildErrorMessage('action.description', actionIndex, 'grupo', group.title, 'string'));

            _validateProperty(
                action.action
                , prop => prop === 'match' || prop === 'replace' || prop === 'removeQuotes'
                , `group[${groupIndex}].actions[${actionIndex}].action`
                , _buildErrorMessage('action.action', actionIndex, 'grupo', group.title, '"match", "replace" ou "removeQuotes"'));

            _validateProperty(
                action.regex
                , prop => typeof prop === 'string'
                , `group[${groupIndex}].actions[${actionIndex}].regex`
                , _buildErrorMessage('action.regex', actionIndex, 'grupo', group.title, 'string'));

            _validateProperty(
                action.value
                , prop => typeof prop === 'string'
                , `group[${groupIndex}].actions[${actionIndex}].value`
                , _buildErrorMessage('action.value', actionIndex, 'grupo', group.title, 'string'));

            _validateProperty(
                action.active
                , prop => typeof prop === 'boolean'
                , `group[${groupIndex}].actions[${actionIndex}].active`
                , _buildErrorMessage('action.active', actionIndex, 'grupo', group.title, 'boolean'));

            _validateAllowedProperties(action, ['description', 'action', 'regex', 'value', 'active'], `A ação na posição ${actionIndex} do grupo "${group.title}"`);
        });

        _validateAllowedProperties(group, ['title', 'actions'], `O grupo "${group.title}"`);
    });

    return rulesConfig as RulesConfig;
}