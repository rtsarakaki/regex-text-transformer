'use client'

import dynamic from 'next/dynamic'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { Toolbar } from '@/components/toolbar'
import { loadTextFromLocalFile, Mode, saveTextToLocalFile } from '@/utils/text-processor'
import { useState } from 'react'

// Importar CodeMirror dinamicamente para evitar erros de SSR
const CodeMirror = dynamic(
    () => import('@uiw/react-codemirror').then((mod) => mod.default),
    { ssr: false }
)

interface ProcessedTextEditorProps {
    textLoaded: (text: string) => void
    processedText: string
    onChangeMode: (mode: Mode) => void
}

export const ProcessedTextEditor: React.FC<ProcessedTextEditorProps> = ({
    textLoaded: originalTextLoaded,
    processedText,
    onChangeMode
}) => {

    const [mode, setMode] = useState<Mode>('process');

    const handleCopy = () => {
        navigator.clipboard.writeText(processedText).then(() => {
            console.log('Texto copiado para a área de transferência');
        }).catch(err => {
            console.error('Erro ao copiar texto: ', err);
        });
    };

    const _handleLoadText = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const content = await loadTextFromLocalFile(event)
        originalTextLoaded(content)
    }

    const _handleSaveProcessedText = () => {
        saveTextToLocalFile(processedText, 'texto_processado.txt', 'text/plain')
    }

    const _handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newMode = event.target.value as Mode
        setMode(newMode)
        onChangeMode(newMode)
    }

    return (
        <>
            <Toolbar
                onSave={_handleSaveProcessedText}
                onLoad={_handleLoadText}
                onCopy={handleCopy}
                title="Output"
                acceptTypes="*/*"
            />
            <div className="flex items-center space-x-2">
                <label htmlFor="format" className="text-white">Mode:</label>
                <select id="format" value={mode} onChange={_handleModeChange} className="bg-gray-700 text-white p-1 rounded">
                    <option value="process">Transform</option>
                    <option value="validate">Validate</option>
                    <option value="generate_document">Document</option>
                </select>
            </div>
            <div className="flex-1 overflow-auto border border-slate-700 rounded-b">
                <CodeMirror
                    value={processedText}
                    height="100%"
                    theme={vscodeDark}
                    editable={false}
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true
                    }}
                />
            </div>
        </>
    )
}