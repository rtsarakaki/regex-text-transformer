'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { json } from '@codemirror/lang-json'
import { Toolbar } from '@/components/toolbar'
import { applyRegexRules, saveTextToLocalFile } from '@/utils/text-processor'

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
    "actions": [
        {
        "description": "Limpar tags XML e deixar apenas os dados.",
        "action": "replace",
        "regex": "",
        "value": "",
        "active": true
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
                    // Verificar se é um JSON válido
                    JSON.parse(content)
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
                title="Regras JSON"
                acceptTypes=".json"
            />
            <div className="flex-1 overflow-hidden border border-slate-700 rounded-b">
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