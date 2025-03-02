'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { json } from '@codemirror/lang-json'
import yaml from 'js-yaml'
import { Toolbar } from '@/components/toolbar'
import { applyRegexRules, saveTextToLocalFile } from '@/utils/text-processor'
import { defaultRules, escapeSpecialCharactersInRegex, RulesConfig, validateRulesConfigJson, validateRulesConfigYaml } from '@/entities/rules-config'

const CodeMirror = dynamic(
    () => import('@uiw/react-codemirror').then((mod) => mod.default),
    { ssr: false }
)

interface RegexRulesEditorProps {
    originalText: string
    onTextProcessed: (text: string) => void
    onError: (text: string) => void
    onCleanError: () => void
}

export const RegexRulesEditor: React.FC<RegexRulesEditorProps> = ({
    originalText,
    onTextProcessed,
    onError,
    onCleanError
}) => {
    const [rules, setRules] = useState<string>(defaultRules)
    const [format, setFormat] = useState<'json' | 'yaml'>('json');

    useEffect(() => {
        try {
            if (rules && originalText) {
                const resultado = applyRegexRules(originalText, rules)
                onTextProcessed(resultado)
                onCleanError()
            }
        } catch (error) {
            onError(`Erro ao processar texto: ${(error as Error).message}`)
            console.error(error)
        }
    }, [rules, originalText, onTextProcessed, onError, onCleanError])

    const handleCopy = () => {
        navigator.clipboard.writeText(rules).then(() => {
            console.log('Texto copiado para a área de transferência');
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
        });
    };

    const handleSaveRules = () => {
        saveTextToLocalFile(rules, 'regras.json', 'application/json')
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
                        throw new Error('Formato de arquivo não suportado');
                    }
                    setRules(content);
                    onCleanError();
                } catch (error) {
                    onError(`Arquivo inválido: ${(error as Error).message}`);
                }
            }
            reader.readAsText(file)
        }
    }

    const parseRules = (text: string, format: 'json' | 'yaml'): RulesConfig => {
        if (format === 'json') {
            const escapedRules = escapeSpecialCharactersInRegex(text);
            return JSON.parse(escapedRules) as RulesConfig;
        } else {
            return yaml.load(text) as RulesConfig;
        }
    };

    const validateRules = (parsedRules: RulesConfig) => {
        return validateRulesConfigJson(JSON.stringify(parsedRules));
    };

    const handleValidate = () => {
        try {
            const parsedRules = parseRules(rules, format);
            const rulesConfig = validateRules(parsedRules);
            console.log('Regras validadas:', rulesConfig);
        } catch (error) {
            console.error('Erro ao validar regras:', error);
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
            onError(`Erro ao converter regras: ${(error as Error).message}`);
        }
    };

    return (
        <>
            <Toolbar
                onSave={handleSaveRules}
                onLoad={handleLoadRules}
                onCopy={handleCopy}
                title="Regras JSON"
                acceptTypes=".json,.yaml,.yml"
            />
            <div className="flex items-center space-x-2">
                <label htmlFor="format" className="text-white">Formato:</label>
                <select id="format" value={format} onChange={handleFormatChange} className="bg-gray-700 text-white p-1 rounded">
                    <option value="json">JSON</option>
                    <option value="yaml">YAML</option>
                </select>
                <button onClick={handleValidate} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200">
                    Validar
                </button>
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
                />
            </div>
        </>
    )
}