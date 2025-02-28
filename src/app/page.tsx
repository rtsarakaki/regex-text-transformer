'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { json } from '@codemirror/lang-json'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import Split from 'react-split'

import { Toolbar } from '@/components/toolbar'
import { processarTexto } from '@/utils/text-processor'

// Importar CodeMirror dinamicamente para evitar erros de SSR
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then((mod) => mod.default),
  { ssr: false }
)

export default function Home() {
  const [regras, setRegras] = useState<string>('')
  const [textoOriginal, setTextoOriginal] = useState<string>('')
  const [textoProcessado, setTextoProcessado] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const defaultRules = `{
  "actions": [
    {
      "description": "Eliminar formatação e deixar apenas tags com dados.",
      "action": "match",
      "regex": "<(Data)\\\\b[^>]*>(?<Texto>.*?)<\\\\/\\\\1>",
      "value": "\\n",
      "active": true
    },
    {
      "description": "Limpar tags XML e deixar apenas os dados.",
      "action": "replace",
      "regex": "<Data\\\\b[^>]*>|<\\\\/Data>",
      "value": "",
      "active": true
    }
  ]
}`

  // Processar o texto sempre que as regras ou texto original mudar
  useEffect(() => {
    try {
      if (regras && textoOriginal) {
        const resultado = processarTexto(textoOriginal, regras)
        setTextoProcessado(resultado)
        setError(null)
      }
    } catch (error) {
      setError(`Erro ao processar texto: ${(error as Error).message}`)
      console.error(error)
    }
  }, [regras, textoOriginal])

  // Inicializar com regras padrão
  useEffect(() => {
    setRegras(defaultRules)
  }, [defaultRules])

  // Funções para manipulação de arquivos
  const handleSaveRules = () => {
    const blob = new Blob([regras], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'regras.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
          setRegras(content)
          setError(null)
        } catch (error) {
          setError(`Arquivo JSON inválido: ${(error as Error).message}`)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleLoadText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setTextoOriginal(content)
      }
      reader.readAsText(file)
    }
  }

  const handleSaveProcessedText = () => {
    const blob = new Blob([textoProcessado], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'texto_processado.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 p-4 shadow-md">
        <h1 className="text-2xl font-bold text-cyan-400">Processador de Texto com Regras Regex</h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <Split
          className="flex h-full"
          sizes={[50, 50]}
          minSize={200}
          gutterSize={10}
          gutterAlign="center"
          direction="horizontal"
        >
          <div className="flex flex-col h-full">
            <Toolbar
              onSave={handleSaveRules}
              onLoad={handleLoadRules}
              title="Regras JSON"
              acceptTypes=".json"
            />
            <div className="flex-1 overflow-hidden border border-slate-700 rounded-b">
              <CodeMirror
                value={regras}
                height="100%"
                theme={vscodeDark}
                extensions={[json()]}
                onChange={(value) => setRegras(value)}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  autocompletion: true
                }}
              />
            </div>
          </div>

          <div className="flex flex-col h-full">
            <Toolbar
              onSave={handleSaveProcessedText}
              onLoad={handleLoadText}
              title="Texto Processado"
              acceptTypes=".txt,.xml"
            />
            <div className="flex-1 overflow-hidden border border-slate-700 rounded-b">
              <CodeMirror
                value={textoProcessado}
                height="100%"
                theme={vscodeDark}
                editable={false}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true
                }}
              />
            </div>
          </div>
        </Split>
      </main>

      {error && (
        <div className="bg-red-600 p-2 text-white">
          {error}
        </div>
      )}

      <footer className="bg-slate-800 text-center p-2 text-sm text-slate-400">
        Processador de Texto com Regras Regex © 2025
      </footer>
    </div>
  )
}