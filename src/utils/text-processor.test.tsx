import {
    applyRegexRules
    , _applyAction
    , _buildActionDescriptionToMarkdownDocument
    , _extractMatchingText
    , _getActionSummary
    , _removeQuotes
    , _replaceMatchingText
    , _replaceVariables
    , _processEscapes
} from './text-processor';
import { Action, RulesConfig } from '@/entities/rules-config';

describe('text-processor', () => {

    describe('applyRegexRules', () => {
        const rules: RulesConfig = {
            variables: {},
            groups: [
                {
                    title: 'Group 1',
                    actions: [
                        {
                            description: 'Replace world with universe',
                            action: 'replace',
                            regex: 'world',
                            value: 'universe',
                            active: true,
                        },
                    ],
                },
            ],
        };

        const rulesJson = JSON.stringify(rules);

        test('returns the original text if no rules are provided', () => {
            const text = 'Hello, world!';
            const result = applyRegexRules(text, '', 'process');
            expect(result).toBe(text);
        });

        test('applies regex rules to the text', () => {
            const text = 'Hello, world!';
            const result = applyRegexRules(text, rulesJson, 'process');
            expect(result).toBe('Hello, universe!');
        });

        test('validates the text format correctly', () => {
            const text = 'Hello, universe!';
            const result = applyRegexRules(text, rulesJson, 'validate');
            expect(result).toBe('No rules to apply.');
        });

        test('returns broken rules if the text format is incorrect', () => {
            const text = 'Hello, world!';
            const result = applyRegexRules(text, rulesJson, 'validate');
            expect(result).toBe('Rule "Replace world with universe" needs to be applied.');
        });

        test('generates a markdown document', () => {
            const result = applyRegexRules('', rulesJson, 'generate_document');
            expect(result).toContain('# Generated Document');
            expect(result).toContain('## Group 1');
            expect(result).toContain('### Replace world with universe');
            expect(result).toContain('- **Action**: replace');
            expect(result).toContain('- **Regex**: `world`');
            expect(result).toContain('- **Value**: universe');
            expect(result).not.toContain('### Inactive action');
        });
    });

    describe('_applyAction', () => {
        const testCases = [
            {
                description: 'apply match action',
                text: '<div>Hello, world!</div>',
                regex: '>([^<]+)<',
                action: { action: 'match', value: ' ' },
                variables: {},
                expected: 'Hello, world!',
            },
            {
                description: 'apply replace action',
                text: 'Hello, world!',
                regex: 'world',
                action: { action: 'replace', value: 'universe' },
                variables: {},
                expected: 'Hello, universe!',
            },
            {
                description: 'apply default action (no match or replace)',
                text: 'Hello, world!',
                regex: 'world',
                action: { action: 'unknown', value: 'universe' },
                variables: {},
                expected: 'Hello, world!',
            },
        ];

        testCases.forEach(({ description, text, regex, action, variables, expected }) => {
            test(description, () => {
                const result = _applyAction(text, regex, action as Action, variables);
                expect(result).toBe(expected);
            });
        });
    });

    describe('_removeQuotes', () => {
        const testCases = [
            {
                description: 'remove quotes from a simple string',
                text: '"Hello, world!"',
                regex: /"Hello, world!"/,
                expected: 'Hello, world!',
            },
            {
                description: 'remove quotes from a string with multiple quotes',
                text: '"Hello", "world!"',
                regex: /"Hello", "world!"/,
                expected: 'Hello, world!',
            },
            {
                description: 'remove quotes from a string with nested quotes',
                text: '"Hello, "world!""',
                regex: /"Hello, "world!""/,
                expected: 'Hello, world!',
            },
            {
                description: 'remove quotes from a string with no quotes',
                text: 'Hello, world!',
                regex: /Hello, world!/,
                expected: 'Hello, world!',
            },
            {
                description: 'remove quotes from a string with partial match',
                text: '"Hello, world!"',
                regex: /"Hello/,
                expected: 'Hello, world!"',
            },
            {
                description: 'no match, return original text',
                text: '"Hello, world!"',
                regex: /"Goodbye, world!"/,
                expected: '"Hello, world!"',
            },
        ];

        testCases.forEach(({ description, text, regex, expected }) => {
            test(description, () => {
                const result = _removeQuotes(text, regex);
                expect(result).toBe(expected);
            });
        });
    });

    describe('_extractMatchingText', () => {
        const testCases = [
            {
                description: 'extract text from simple HTML',
                text: '<div>Hello, world!</div>',
                regex: />([^<]+)</g,
                value: '|',
                expected: 'Hello, world!',
            },
            {
                description: 'extract text from nested HTML',
                text: '<div><p>Hello, <span>world!</span></p></div>',
                regex: />([^<]+)</g,
                value: '|',
                expected: 'Hello, |world!',
            },
            {
                description: 'extract text from multiple tags',
                text: '<div>Hello,</div><div>world!</div>',
                regex: />([^<]+)</g,
                value: '|',
                expected: 'Hello,|world!',
            },
            {
                description: 'extract text from XML',
                text: '<note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don\'t forget me this weekend!</body></note>',
                regex: />([^<]+)</g,
                value: '|',
                expected: 'Tove|Jani|Reminder|Don\'t forget me this weekend!',
            },
            {
                description: 'no match, return original text',
                text: '<div></div>',
                regex: />([^<]+)</g,
                value: '|',
                expected: '<div></div>',
            },
            {
                description: 'text is null, treat as empty string',
                text: null,
                regex: />([^<]+)</g,
                value: '|',
                expected: '',
            },
        ];

        testCases.forEach(({ description, text, regex, value, expected }) => {
            test(description, () => {
                const result = _extractMatchingText(text || '', regex, value);
                expect(result).toBe(expected);
            });
        });
    });

    describe('_replaceMatchingText', () => {
        const testCases = [
            {
                description: 'simple substitution',
                text: 'Hello, world!',
                regex: /world/,
                value: 'universe',
                variables: {},
                expected: 'Hello, universe!',
            },
            {
                description: 'substitution with regex groups',
                text: 'Hello, world!',
                regex: /(world)/,
                value: 'universe {1}',
                variables: {},
                expected: 'Hello, universe world!',
            },
            {
                description: 'substitution in multiple parts of the text',
                text: 'Hello, world! Hello, world!',
                regex: /world/g,
                value: 'universe',
                variables: {},
                expected: 'Hello, universe! Hello, universe!',
            },
            {
                description: 'no match, no substitution',
                text: 'Hello, world!',
                regex: /planet/,
                value: 'universe',
                variables: {},
                expected: 'Hello, world!',
            },
            {
                description: 'non-greedy substitution',
                text: 'Hello, world! Hello, world!',
                regex: /world/,
                value: 'universe',
                variables: {},
                expected: 'Hello, universe! Hello, world!',
            },
            {
                description: 'substitution in a specific block',
                text: 'Hello, [world]!',
                regex: /\[world\]/,
                value: '[universe]',
                variables: {},
                expected: 'Hello, [universe]!',
            },
            {
                description: 'substitution with variables',
                text: 'Hello, <VAR=name>!',
                regex: /<VAR=name>/,
                value: '<VAR=name>',
                variables: { name: 'world' },
                expected: 'Hello, world!',
            },
            {
                description: 'substitution with regex groups and variables',
                text: 'Hello, world!',
                regex: /(world)/,
                value: 'universe {1} <VAR=name>',
                variables: { name: 'Alice' },
                expected: 'Hello, universe world Alice!',
            },
            {
                description: 'text is null, treat as empty string',
                text: null,
                regex: /world/,
                value: 'universe',
                variables: {},
                expected: '',
            },
        ];

        testCases.forEach(({ description, text, regex, value, variables, expected }) => {
            test(description, () => {
                const result = _replaceMatchingText(text as string, regex, value, variables as Record<string, string>);
                expect(result).toBe(expected);
            });
        });
    });

    describe('_replaceVariables', () => {
        const testCases = [
            {
                description: 'replaces a single variable',
                input: 'Hello, <VAR=name>!',
                variables: { name: 'world' },
                expected: 'Hello, world!',
            },
            {
                description: 'replaces multiple variables',
                input: 'Hello, <VAR=greeting> <VAR=name>!',
                variables: { greeting: 'Hi', name: 'Alice' },
                expected: 'Hello, Hi Alice!',
            },
            {
                description: 'returns the original text if no variables are provided',
                input: 'Hello, world!',
                variables: {},
                expected: 'Hello, world!',
            },
            {
                description: 'returns the original text if no variables are present in the text',
                input: 'Hello, world!',
                variables: { name: 'Alice' },
                expected: 'Hello, world!',
            },
            {
                description: 'replaces variables partially present in the text',
                input: 'Hello, <VAR=name>!',
                variables: { name: 'world', greeting: 'Hi' },
                expected: 'Hello, world!',
            },
            {
                description: 'throws an error if the variables object is null',
                input: 'Hello, <VAR=name>!',
                variables: null,
                expectedError: 'The variables object is invalid.',
            },
            {
                description: 'throws an error if the variables object is undefined',
                input: 'Hello, <VAR=name>!',
                variables: undefined,
                expectedError: 'The variables object is invalid.',
            },
            {
                description: 'throws an error if the variables object is not an object',
                input: 'Hello, <VAR=name>!',
                variables: 'invalid' as unknown,
                expectedError: 'The variables object is invalid.',
            },
            {
                description: 'returns the original text if the variables object is missing necessary fields',
                input: 'Hello, <VAR=name>!',
                variables: { greeting: 'Hi' },
                expected: 'Hello, <VAR=name>!',
            },
        ];

        testCases.forEach(({ description, input, variables, expected, expectedError }) => {
            test(description, () => {
                if (expectedError) {
                    expect(() => _replaceVariables(input, variables as Record<string, string>)).toThrow(expectedError);
                } else {
                    const result = _replaceVariables(input, variables as Record<string, string>);
                    expect(result).toBe(expected);
                }
            });
        });
    });

    describe('_processEscapes', () => {
        const testCases = [
            { input: 'Hello,\\nworld!', expected: 'Hello,\nworld!' },
            { input: 'Hello,\\rworld!', expected: 'Hello,\rworld!' },
            { input: 'Hello,\\tworld!', expected: 'Hello,\tworld!' },
            { input: 'Hello,\\n\\r\\tworld!', expected: 'Hello,\n\r\tworld!' },
            { input: 'No escapes here!', expected: 'No escapes here!' },
            { input: 'Mixed \\n and \\t escapes', expected: 'Mixed \n and \t escapes' },
            { input: 'Multiple \\n\\n escapes', expected: 'Multiple \n\n escapes' },
            { input: 'Multiple \\t\\t escapes', expected: 'Multiple \t\t escapes' },
            { input: 'Multiple \\r\\r escapes', expected: 'Multiple \r\r escapes' },
            { input: 'Complex \\n\\t\\r escapes', expected: 'Complex \n\t\r escapes' },
        ];

        testCases.forEach(({ input, expected }) => {
            test(`processes escape sequences in "${input}"`, () => {
                const result = _processEscapes(input);
                expect(result).toBe(expected);
            });
        });
    });

    describe('_getActionSummary', () => {
        test('returns the markdown resume for an action', () => {
            const action: Action = {
                description: 'Replace world with universe',
                action: 'replace',
                regex: 'world',
                value: 'universe',
                active: true,
            };

            expect(() => _getActionSummary(action, null)).toThrow('The variables object is invalid.');
        });

        test('returns the markdown resume for an action with variables', () => {
            const action: Action = {
                description: 'Replace world with <VAR=planet>',
                action: 'replace',
                regex: 'world',
                value: '<VAR=planet>',
                active: true,
            };

            const variables = { planet: 'universe' };

            const result = _getActionSummary(action, variables);
            expect(result).toBe(
                `- **Action**: replace\n- **Regex**: \`world\`\n- **Value**: universe\n\n`
            );
        });
    });

    describe('_buildActionDescriptionToMarkdownDocument', () => {
        test('returns the markdown document for an action', () => {
            const action: Action = {
                description: 'Find parts in the text that meet the regex <regex/> and <action/> with <value/>',
                action: 'replace',
                regex: 'world',
                value: 'universe',
                active: true,
            };

            const result = _buildActionDescriptionToMarkdownDocument(action, {});
            expect(result).toBe('Find parts in the text that meet the regex **world** and **replace** with **universe**');
        });

        test('returns the markdown document for an action with variables', () => {
            const action: Action = {
                description: 'Find parts in the text that meet the regex <regex/> and <action/> with <value/>',
                action: 'replace',
                regex: 'world',
                value: '<VAR=planet>',
                active: true,
            };

            const variables = { planet: 'universe' };

            const result = _buildActionDescriptionToMarkdownDocument(action, variables);
            expect(result).toBe('Find parts in the text that meet the regex **world** and **replace** with **universe**');
        });

        test('throws an error if variables is null', () => {
            const action: Action = {
                description: 'Find parts in the text that meet the regex <regex/> and <action/> with <value/>',
                action: 'replace',
                regex: 'world',
                value: '<VAR=planet>',
                active: true,
            };

            expect(() => _buildActionDescriptionToMarkdownDocument(action, null)).toThrow('The variables object is invalid.');
        });

        test('returns the markdown document for an action with summary', () => {
            const action: Action = {
                description: 'Find parts in the text that meet the regex <regex/> and <action/> with <value/> and <summary/>',
                action: 'replace',
                regex: 'world',
                value: 'universe',
                active: true,
            };

            const result = _buildActionDescriptionToMarkdownDocument(action, {});
            expect(result).toBe(
                'Find parts in the text that meet the regex **world** and **replace** with **universe** and \n- **Action**: replace\n- **Regex**: `world`\n- **Value**: universe\n\n'
            );
        });
    });
});