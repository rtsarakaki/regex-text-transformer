'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { json } from '@codemirror/lang-json'
import yaml from 'js-yaml'
import { Toolbar } from '@/components/toolbar'
import { applyRegexRules, Mode, saveTextToLocalFile } from '@/utils/text-processor'
import { defaultRules, _escapeSpecialCharactersInRegex, RulesConfig, validateRulesConfigJson, validateRulesConfigYaml } from '@/entities/rules-config'

const CodeMirror = dynamic(
    () => import('@uiw/react-codemirror').then((mod) => mod.default),
    { ssr: false }
)

interface RegexRulesEditorProps {
    originalText: string
    mode: Mode
    onTextProcessed: (text: string) => void
    onError: (text: string) => void
    onSuccess: (text: string) => void
    onCleanAlert: () => void
}

export const RegexRulesEditor: React.FC<RegexRulesEditorProps> = ({
    originalText,
    mode,
    onTextProcessed,
    onError,
    onSuccess,
    onCleanAlert: onCleanError
}) => {
    const [rules, setRules] = useState<string>(defaultRules)
    const [format, setFormat] = useState<'json' | 'yaml'>('json');

    useEffect(() => {
        try {
            if (rules) {
                const resultado = applyRegexRules(originalText, rules, mode)
                onTextProcessed(resultado)
                onCleanError()
            }
        } catch (error) {
            onError(`Error processing text: ${(error as Error).message}`)
        }
    }, [rules, originalText, mode, onTextProcessed, onError, onCleanError])

    const handleCopy = () => {
        navigator.clipboard.writeText(rules).then(() => {
            onSuccess('Rules copied to clipboard');
        }).catch(err => {
            onError(`Error copying text to clipboard: ${err}`);
        });
    };

    const handleSaveRules = () => {
        saveTextToLocalFile(rules, 'rules.json', 'application/json');
    }

    const handleLoadRules = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const content = e.target?.result as string
                try {
                    const extension = file.name.split('.').pop()?.toLowerCase();
                    if (extension === 'json') {
                        validateRulesConfigJson(content);
                        setFormat('json');
                    } else if (extension === 'yaml' || extension === 'yml') {
                        validateRulesConfigYaml(content);
                        setFormat('yaml');
                    } else {
                        throw new Error('Unsupported file format');
                    }
                    setRules(content);
                    onSuccess('Rules loaded successfully');
                } catch (error) {
                    onError(`Invalid file: ${(error as Error).message}`);
                }
            }
            reader.readAsText(file)
        }
    }

    const parseRules = (text: string, format: 'json' | 'yaml'): RulesConfig => {
        if (format === 'json') {
            const escapedRules = _escapeSpecialCharactersInRegex(text);
            return JSON.parse(escapedRules) as RulesConfig;
        } else {
            return yaml.load(text) as RulesConfig;
        }
    };

    const handleFormatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newFormat = event.target.value as 'json' | 'yaml';
        try {
            const parsedRules = parseRules(rules, format);
            const convertedRules = newFormat === 'json' ? JSON.stringify(parsedRules, null, 2) : yaml.dump(parsedRules);
            setRules(convertedRules);
            setFormat(newFormat);
        } catch (error) {
            onError(`Error converting rules: ${(error as Error).message}`);
        }
    };

    return (
        <>
            <Toolbar
                onSave={handleSaveRules}
                onLoad={handleLoadRules}
                onCopy={handleCopy}
                title="JSON Rules"
                acceptTypes=".json,.yaml,.yml"
            />
            <div className="flex items-center space-x-2">
                <label htmlFor="format" className="text-white">Format:</label>
                <select id="format" value={format} onChange={handleFormatChange} className="bg-gray-700 text-white p-1 rounded">
                    <option value="json">JSON</option>
                    <option value="yaml">YAML</option>
                </select>
            </div>
            <div className="flex-1 overflow-auto border border-slate-700 rounded-b">
                <CodeMirror
                    value={rules}
                    height="100%"
                    theme={vscodeDark}
                    extensions={[json()]}
                    onChange={(value) => setRules(value)}
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: true,
                        autocompletion: true
                    }}
                    data-testid="code-editor"
                />
            </div>
        </>
    )
}