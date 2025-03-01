'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { json } from '@codemirror/lang-json'
import { Toolbar } from '@/components/toolbar'
import { applyRegexRules, saveTextToLocalFile } from '@/utils/text-processor'
import { validateRulesConfig } from '@/entities/rules-config'

// Importar CodeMirror dinamicamente para evitar erros de SSR
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
    const [rules, setRules] = useState<string>('')

    const defaultRules = `{
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
}`

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

    useEffect(() => {
        setRules(defaultRules)
    }, [defaultRules])

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
                    validateRulesConfig(content)
                    setRules(content)
                    onCleanError()
                } catch (error) {
                    onError(`Arquivo JSON inválido: ${(error as Error).message}`)
                }
            }
            reader.readAsText(file)
        }
    }

    return (
        <>
            <Toolbar
                onSave={handleSaveRules}
                onLoad={handleLoadRules}
                onCopy={handleCopy}
                title="Regras JSON"
                acceptTypes=".json"
            />
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