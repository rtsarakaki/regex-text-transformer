import {
    Action
    , RuleGroup
    , detectAndValidateRulesConfig
    , validateRulesConfigJson
    , validateRulesConfigYaml
    , _buildErrorMessage
    , _escapeSpecialCharactersInRegex
    , _validateAction
    , _validateAllowedProperties
    , _validateGroup
    , _validateProperty
} from './rules-config';
import yaml from 'js-yaml';

describe('_validateProperty', () => {
    test('should throw error if property is undefined', () => {
        expect(() => {
            _validateProperty(undefined, (prop: unknown) => typeof prop === 'string', 'description', 'The property {name} is invalid.');
        }).toThrow('The property description cannot be null or undefined.');
    });

    test('should throw error if property is null', () => {
        expect(() => {
            _validateProperty(null, (prop: unknown) => typeof prop === 'string', 'description', 'The property {name} is invalid.');
        }).toThrow('The property description cannot be null or undefined.');
    });

    test('should throw error if condition is not a function', () => {
        expect(() => {
            _validateProperty('valid', 'not a function' as unknown as (prop: unknown) => boolean, 'description', 'The property {name} is invalid.');
        }).toThrow('The condition must be a function.');
    });

    test('should throw error if name is not a string', () => {
        expect(() => {
            _validateProperty('valid', (prop: unknown) => typeof prop === 'string', 123 as unknown as string, 'The property {name} is invalid.');
        }).toThrow('The property name must be a string.');
    });

    test('should throw error if errorMessage is not a string', () => {
        expect(() => {
            _validateProperty('valid', (prop: unknown) => typeof prop === 'string', 'description', 123 as unknown as string);
        }).toThrow('The error message must be a string.');
    });

    test('should throw error if condition returns false', () => {
        expect(() => {
            _validateProperty('invalid', (prop: unknown) => prop === 'valid', 'description', 'The property {name} is invalid.');
        }).toThrow('The property description is invalid.');
    });

    test('should not throw error if condition returns true', () => {
        expect(() => {
            _validateProperty('valid', (prop: unknown) => prop === 'valid', 'description', 'The property {name} is invalid.');
        }).not.toThrow();
    });
});


describe('_validateAllowedProperties', () => {
    test('should throw error if object is not an object', () => {
        expect(() => {
            _validateAllowedProperties(null as unknown as Action, ['description', 'action', 'regex', 'value', 'active'], 'Action');
        }).toThrow('The object must be a non-null object.');
    });

    test('should throw error if allowedKeys is not an array', () => {
        expect(() => {
            _validateAllowedProperties({ description: 'test' } as Action, 'not an array' as unknown as string[], 'Action');
        }).toThrow('The allowedKeys must be an array.');
    });

    test('should throw error if objectName is not a string', () => {
        expect(() => {
            _validateAllowedProperties({ description: 'test' } as Action, ['description', 'action', 'regex', 'value', 'active'], 123 as unknown as string);
        }).toThrow('The objectName must be a string.');
    });

    test('should throw error if Action contains unknown property', () => {
        const action = {
            description: 'Replace world with universe',
            action: 'replace',
            regex: 'world',
            value: 'universe',
            active: true,
            unknown: 'unknown'
        } as unknown as Action;

        expect(() => {
            _validateAllowedProperties(action, ['description', 'action', 'regex', 'value', 'active'], 'Action');
        }).toThrow('Action contains an unknown property: "unknown".');
    });

    test('should not throw error if Action contains only allowed properties', () => {
        const action = {
            description: 'Replace world with universe',
            action: 'replace',
            regex: 'world',
            value: 'universe',
            active: true
        } as Action;

        expect(() => {
            _validateAllowedProperties(action, ['description', 'action', 'regex', 'value', 'active'], 'Action');
        }).not.toThrow();
    });

    test('should throw error if RuleGroup contains unknown property', () => {
        const group = {
            title: 'Test Group',
            actions: [
                {
                    description: 'Replace world with universe',
                    action: 'replace',
                    regex: 'world',
                    value: 'universe',
                    active: true
                }
            ],
            unknown: 'unknown'
        } as unknown as RuleGroup;

        expect(() => {
            _validateAllowedProperties(group, ['title', 'actions'], 'RuleGroup');
        }).toThrow('RuleGroup contains an unknown property: "unknown".');
    });

    test('should not throw error if RuleGroup contains only allowed properties', () => {
        const group = {
            title: 'Test Group',
            actions: [
                {
                    description: 'Replace world with universe',
                    action: 'replace',
                    regex: 'world',
                    value: 'universe',
                    active: true
                }
            ]
        } as RuleGroup;

        expect(() => {
            _validateAllowedProperties(group, ['title', 'actions'], 'RuleGroup');
        }).not.toThrow();
    });
});

describe('_buildErrorMessage', () => {
    test('should throw error if propertyName is not a string', () => {
        expect(() => {
            _buildErrorMessage(123 as unknown as string, 0, 'context', 'contextName', 'type');
        }).toThrow('The propertyName must be a string.');
    });

    test('should throw error if index is not a number or null', () => {
        expect(() => {
            _buildErrorMessage('propertyName', 'not a number' as unknown as number, 'context', 'contextName', 'type');
        }).toThrow('The index must be a number or null.');
    });

    test('should throw error if context is not a string', () => {
        expect(() => {
            _buildErrorMessage('propertyName', 0, 123 as unknown as string, 'contextName', 'type');
        }).toThrow('The context must be a string.');
    });

    test('should throw error if contextName is not a string', () => {
        expect(() => {
            _buildErrorMessage('propertyName', 0, 'context', 123 as unknown as string, 'type');
        }).toThrow('The contextName must be a string.');
    });

    test('should throw error if type is not a string', () => {
        expect(() => {
            _buildErrorMessage('propertyName', 0, 'context', 'contextName', 123 as unknown as string);
        }).toThrow('The type must be a string.');
    });

    test('should return correct error message with index', () => {
        const message = _buildErrorMessage('propertyName', 0, 'context', 'contextName', 'type');
        expect(message).toBe('The property propertyName at position 0 in the context contextName must exist and be type.');
    });

    test('should return correct error message without index', () => {
        const message = _buildErrorMessage('propertyName', null, 'context', 'contextName', 'type');
        expect(message).toBe('The property propertyName in the context contextName must exist and be type.');
    });
});

describe('_escapeSpecialCharactersInRegex', () => {
    test('should throw error if rules is not a string', () => {
        expect(() => {
            _escapeSpecialCharactersInRegex(123 as unknown as string);
        }).toThrow('The rules parameter must be a string.');
    });

    test('should escape backslashes and quotes in regex', () => {
        const rules = `{
            "regex": "a\\b\\c"
        }`;
        const expected = `{
            "regex": "a\\\\b\\\\c"
        }`;
        expect(_escapeSpecialCharactersInRegex(rules)).toBe(expected);
    });

    test('should escape quotes in regex', () => {
        const rules = `{
            "regex": "a\\"b\\"c"
        }`;
        const expected = `{
            "regex": "a\\\\"b\\"c"
        }`;
        const result = _escapeSpecialCharactersInRegex(rules);
        expect(result).toBe(expected);
    });

    test('should escape both backslashes and quotes in regex', () => {
        const rules = `{
            "regex": "a\\b\\"c"
        }`;
        const expected = `{
            "regex": "a\\\\b\\\\"c"
        }`;
        const result = _escapeSpecialCharactersInRegex(rules);
        expect(result).toBe(expected);
    });

    test('should not alter rules without regex', () => {
        const rules = `{
            "description": "This is a test"
        }`;
        expect(_escapeSpecialCharactersInRegex(rules)).toBe(rules);
    });
});

describe('_validateAction', () => {
    const validAction: Action = {
        description: 'Replace world with universe',
        action: 'replace',
        regex: 'world',
        value: 'universe',
        active: true,
    };

    test('should throw error if action is not an object', () => {
        expect(() => {
            _validateAction(null as unknown as Action, 0, 'Test Group');
        }).toThrow('The action must be a non-null object.');
    });

    test('should throw error if actionIndex is not a number', () => {
        expect(() => {
            _validateAction(validAction, 'not a number' as unknown as number, 'Test Group');
        }).toThrow('The actionIndex must be a number.');
    });

    test('should throw error if groupTitle is not a string', () => {
        expect(() => {
            _validateAction(validAction, 0, 123 as unknown as string);
        }).toThrow('The groupTitle must be a string.');
    });

    test('should throw error for invalid action description', () => {
        const invalidAction = { ...validAction, description: 123 };
        expect(() => _validateAction(invalidAction as unknown as Action, 0, 'Test Group')).toThrow('The property action.description at position 0 in the group Test Group must exist and be string.');
    });

    test('should throw error for invalid action type', () => {
        const invalidAction = { ...validAction, action: 'invalid' };
        expect(() => _validateAction(invalidAction as unknown as Action, 0, 'Test Group')).toThrow('The property action.action at position 0 in the group Test Group must exist and be "match", "replace" or "removeQuotes".');
    });

    test('should throw error for invalid action regex', () => {
        const invalidAction = { ...validAction, regex: 123 };
        expect(() => _validateAction(invalidAction as unknown as Action, 0, 'Test Group')).toThrow('The property action.regex at position 0 in the group Test Group must exist and be string.');
    });

    test('should throw error for invalid action value', () => {
        const invalidAction = { ...validAction, value: 123 };
        expect(() => _validateAction(invalidAction as unknown as Action, 0, 'Test Group')).toThrow('The property action.value at position 0 in the group Test Group must exist and be string.');
    });

    test('should throw error for invalid action active', () => {
        const invalidAction = { ...validAction, active: 'invalid' };
        expect(() => _validateAction(invalidAction as unknown as Action, 0, 'Test Group')).toThrow('The property action.active at position 0 in the group Test Group must exist and be boolean.');
    });

    test('should throw error if action contains unknown property', () => {
        const invalidAction = { ...validAction, unknown: 'unknown' };
        expect(() => _validateAction(invalidAction as unknown as Action, 0, 'Test Group')).toThrow('The action at position 0 in the group "Test Group" contains an unknown property: "unknown".');
    });

    test('should not throw error for valid action', () => {
        expect(() => _validateAction(validAction, 0, 'Test Group')).not.toThrow();
    });
});

describe('_validateGroup', () => {
    const validGroup: RuleGroup = {
        title: 'Test Group',
        actions: [
            {
                description: 'Replace world with universe',
                action: 'replace',
                regex: 'world',
                value: 'universe',
                active: true,
            },
        ],
    };

    test('should throw error if group is not an object', () => {
        expect(() => {
            _validateGroup(null as unknown as RuleGroup, 0);
        }).toThrow('The group must be a non-null object.');
    });

    test('should throw error if groupIndex is not a number', () => {
        expect(() => {
            _validateGroup(validGroup, 'not a number' as unknown as number);
        }).toThrow('The groupIndex must be a number.');
    });

    test('should throw error for invalid group title', () => {
        const invalidGroup = { ...validGroup, title: 123 };
        expect(() => _validateGroup(invalidGroup as unknown as RuleGroup, 0)).toThrow('The property group.title at position 0 in the group  must exist and be string.');
    });

    test('should throw error for invalid group actions', () => {
        const invalidGroup = { ...validGroup, actions: 'invalid' };
        expect(() => _validateGroup(invalidGroup as unknown as RuleGroup, 0)).toThrow('The property group.actions at position 0 in the group Test Group must exist and be array.');
    });

    test('should throw error if group contains unknown property', () => {
        const invalidGroup = { ...validGroup, unknown: 'unknown' };
        expect(() => _validateGroup(invalidGroup as unknown as RuleGroup, 0)).toThrow('The group "Test Group" contains an unknown property: "unknown".');
    });

    test('should not throw error for valid group', () => {
        expect(() => _validateGroup(validGroup, 0)).not.toThrow();
    });
});

describe('detectAndValidateRulesConfig', () => {
    test('validates JSON rules config', () => {
        const rules = JSON.stringify({
            variables: {},
            groups: [],
        });
        const result = detectAndValidateRulesConfig(rules);
        expect(result).toEqual({
            variables: {},
            groups: [],
        });
    });

    test('validates YAML rules config', () => {
        const rules = `
            variables: {}
            groups: []
        `;
        const result = detectAndValidateRulesConfig(rules);
        expect(result).toEqual({
            variables: {},
            groups: [],
        });
    });

    test('throws an error for invalid rules config', () => {
        const invalidRules = 'invalid rules';
        expect(() => detectAndValidateRulesConfig(invalidRules)).toThrow('Invalid rules format. Must be JSON or YAML.');
    });
});

describe('validateRulesConfigJson', () => {
    const validJson = `{
        "variables": {
            "var1": "<h3>{1}</h3>",
            "var2": "<h1>{1}</h1>"
        },
        "groups": [
            {
                "title": "Test Group",
                "actions": [
                    {
                        "description": "Replace world with universe",
                        "action": "replace",
                        "regex": "world",
                        "value": "universe",
                        "active": true
                    }
                ]
            }
        ]
    }`;

    test('should throw error if rules is not a string', () => {
        expect(() => {
            validateRulesConfigJson(123 as unknown as string);
        }).toThrow('The rules parameter must be a string.');
    });

    test('should throw error if JSON format is invalid', () => {
        const invalidJson = `{
            "variables": {
                "var1": "<h3>{1}</h3>",
                "var2": "<h1>{1}</h1>"
            },
            "groups": [
                {
                    "title": "Test Group",
                    "actions": [
                        {
                            "description": "Replace world with universe",
                            "action": "replace",
                            "regex": "world",
                            "value": "universe",
                            "active": true
                        }
                    ]
                }
            ]
        `; // Missing closing brace

        expect(() => {
            validateRulesConfigJson(invalidJson);
        }).toThrow('Invalid JSON format.');
    });

    test('should throw error if rulesConfig is not an object', () => {
        const invalidJson = `[]`;

        expect(() => {
            validateRulesConfigJson(invalidJson);
        }).toThrow('The property groups cannot be null or undefined.');
    });

    test('should throw error if variables is not an object', () => {
        const invalidJson = `{
            "variables": "invalid",
            "groups": [
                {
                    "title": "Test Group",
                    "actions": [
                        {
                            "description": "Replace world with universe",
                            "action": "replace",
                            "regex": "world",
                            "value": "universe",
                            "active": true
                        }
                    ]
                }
            ]
        }`;

        expect(() => {
            validateRulesConfigJson(invalidJson);
        }).toThrow('The "variables" property must be an object.');
    });

    test('should throw error if groups is not an array', () => {
        const invalidJson = `{
            "variables": {
                "var1": "<h3>{1}</h3>",
                "var2": "<h1>{1}</h1>"
            },
            "groups": "invalid"
        }`;

        expect(() => {
            validateRulesConfigJson(invalidJson);
        }).toThrow('The property groups in the JSON  must exist and be array.');
    });

    test('should not throw error for valid JSON rules config', () => {
        expect(() => validateRulesConfigJson(validJson)).not.toThrow();
    });

    test('should return valid RulesConfig object for valid JSON rules config', () => {
        const rulesConfig = validateRulesConfigJson(validJson);
        expect(rulesConfig).toEqual(JSON.parse(validJson));
    });
});

describe('validateRulesConfigYaml', () => {
    const validYaml = `
        variables:
            var1: '<h3>{1}</h3>'
            var2: '<h1>{1}</h1>'
        groups:
            - title: 'Test Group'
              actions:
                - description: 'Replace world with universe'
                  action: 'replace'
                  regex: 'world'
                  value: 'universe'
                  active: true
    `;

    test('should throw error if rules is not a string', () => {
        expect(() => {
            validateRulesConfigYaml(123 as unknown as string);
        }).toThrow('The rules parameter must be a string.');
    });

    test('should throw error if rulesConfig is not an object', () => {
        const invalidYaml = `[]`;

        expect(() => {
            validateRulesConfigYaml(invalidYaml);
        }).toThrow('The property groups cannot be null or undefined.');
    });

    test('should throw error if variables is not an object', () => {
        const invalidYaml = `
            variables: invalid
            groups:
                - title: 'Test Group'
                  actions:
                    - description: 'Replace world with universe'
                      action: 'replace'
                      regex: 'world'
                      value: 'universe'
                      active: true
        `;

        expect(() => {
            validateRulesConfigYaml(invalidYaml);
        }).toThrow('The "variables" property must be an object.');
    });

    test('should throw error if groups is not an array', () => {
        const invalidYaml = `
            variables:
                var1: '<h3>{1}</h3>'
                var2: '<h1>{1}</h1>'
            groups: invalid
        `;

        expect(() => {
            validateRulesConfigYaml(invalidYaml);
        }).toThrow('The property groups in the YAML  must exist and be array.');
    });

    test('should not throw error for valid YAML rules config', () => {
        expect(() => validateRulesConfigYaml(validYaml)).not.toThrow();
    });

    test('should return valid RulesConfig object for valid YAML rules config', () => {
        const rulesConfig = validateRulesConfigYaml(validYaml);
        expect(rulesConfig).toEqual(yaml.load(validYaml));
    });
});