import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { json } from '@codemirror/lang-json'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { Toolbar } from '@/components/toolbar'
import { loadTextFromLocalFile, saveTextToLocalFile } from '@/utils/text-processor'
import { validateRulesConfig } from '@/entities/rules-config'

// Importar CodeMirror dinamicamente para evitar erros de SSR
const CodeMirror = dynamic(
    () => import('@uiw/react-codemirror').then((mod) => mod.default),
    { ssr: false }
)

const defaultRules = `{
  "groups": [
  {
    "title": "Descreva o grupo de regras",
    "actions": [
        {
        "description": "Descreva qual será a transformação",
        "action": "match",
        "regex": "expressão regular",
        "value": "valor a substituir o que for encontrado pela expressão regular",
        "active": true
        },
        {
        "description": "Descreva qual será a transformação",
        "action": "replace",
        "regex": "expressão regular",
        "value": "valor a substituir o que for encontrado pela expressão regular",
        "active": true
        }
    ]
}`

const RulesEditor: React.FC = () => {
    const [rules, setRules] = useState<string>('')

    useEffect(() => {
        setRules(defaultRules)
    }, [])

    const _handleSaveRules = () => {
        saveTextToLocalFile(rules, 'regras.json', 'application/json')
    }

    const _handleLoadRules = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const content = await loadTextFromLocalFile(event)
        try {
            // Verificar se é um JSON válido
            validateRulesConfig(JSON.parse(content))
            setRules(content)
        } catch (error) {
            console.error(`Arquivo JSON inválido: ${(error as Error).message}`)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <Toolbar
                onSave={_handleSaveRules}
                onLoad={_handleLoadRules}
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
        </div>
    )
}

export default RulesEditor