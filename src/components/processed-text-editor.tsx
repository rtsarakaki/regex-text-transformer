'use client'

import dynamic from 'next/dynamic'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { Toolbar } from '@/components/toolbar'
import { loadTextFromLocalFile, saveTextToLocalFile } from '@/utils/text-processor'

// Importar CodeMirror dinamicamente para evitar erros de SSR
const CodeMirror = dynamic(
    () => import('@uiw/react-codemirror').then((mod) => mod.default),
    { ssr: false }
)

interface ProcessedTextEditorProps {
    textLoaded: (text: string) => void
    processedText: string
}

export const ProcessedTextEditor: React.FC<ProcessedTextEditorProps> = ({
    textLoaded: originalTextLoaded,
    processedText
}) => {

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

    return (
        <>
            <Toolbar
                onSave={_handleSaveProcessedText}
                onLoad={_handleLoadText}
                onCopy={handleCopy}
                title="Texto Processado"
                acceptTypes="*/*"
            />
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