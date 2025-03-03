import { applyRegexRules, _applyAction, _removeQuotes, _extractMatchingText, _replaceMatchingText, _replaceVariables, _processEscapes } from './text-processor';
import { Action, RulesConfig } from '@/entities/rules-config';

describe('text-processor', () => {
    describe('applyRegexRules', () => {
        test('returns the original text if no rules are provided', () => {
            const text = 'Hello, world!';
            const result = applyRegexRules(text, '');
            expect(result).toBe(text);
        });

        test('applies regex rules to the text', () => {
            const text = 'Hello, world!';
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
            const result = applyRegexRules(text, JSON.stringify(rules));
            expect(result).toBe('Hello, universe!');
        });

        test('throws an error for invalid rules format', () => {
            const text = 'Hello, world!';
            const invalidRules = 'invalid rules';
            expect(() => applyRegexRules(text, invalidRules)).toThrow('Invalid rules format. Must be JSON or YAML.');
        });
    });

    describe('_applyAction', () => {
        const testCases = [
            {
                description: 'apply match action',
                text: '<div>Hello, world!</div>',
                regex: />([^<]+)</g,
                action: { action: 'match', value: ' ' },
                variables: {},
                expected: 'Hello, world!',
            },
            {
                description: 'apply replace action',
                text: 'Hello, world!',
                regex: /world/g,
                action: { action: 'replace', value: 'universe' },
                variables: {},
                expected: 'Hello, universe!',
            },
            {
                description: 'apply default action (no match or replace)',
                text: 'Hello, world!',
                regex: /world/g,
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

    // describe('saveTextToLocalFile', () => {
    //     test('creates a downloadable file', () => {
    //         const text = 'Hello, world!';
    //         const name = 'hello.txt';
    //         const type = 'text/plain';

    //         // Mock the createElement and appendChild methods
    //         const createElementSpy = jest.spyOn(document, 'createElement');
    //         const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    //         const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    //         // Mock URL.createObjectURL
    //         const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/12345');

    //         saveTextToLocalFile(text, name, type);

    //         expect(createElementSpy).toHaveBeenCalledWith('a');
    //         expect(appendChildSpy).toHaveBeenCalled();
    //         expect(removeChildSpy).toHaveBeenCalled();
    //         expect(createObjectURLSpy).toHaveBeenCalled();

    //         // Clean up mocks
    //         createElementSpy.mockRestore();
    //         appendChildSpy.mockRestore();
    //         removeChildSpy.mockRestore();
    //         createObjectURLSpy.mockRestore();
    //     });
    // });

    // describe('loadTextFromLocalFile', () => {
    //     test('loads text from a selected file', async () => {
    //         const fileContent = 'Hello, world!';
    //         const file = new File([fileContent], 'hello.txt', { type: 'text/plain' });
    //         const event = {
    //             target: {
    //                 files: [file],
    //             },
    //         } as React.ChangeEvent<HTMLInputElement>;

    //         const result = await loadTextFromLocalFile(event);
    //         expect(result).toBe(fileContent);
    //     });

    //     test('throws an error if no file is selected', async () => {
    //         const event = {
    //             target: {
    //                 files: [],
    //             },
    //         } as React.ChangeEvent<HTMLInputElement>;

    //         await expect(loadTextFromLocalFile(event)).rejects.toThrow('Nenhum arquivo selecionado');
    //     });
    // });
});