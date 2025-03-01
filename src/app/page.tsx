'use client'

import { useState } from 'react'
import Split from 'react-split'

import { ProcessedTextEditor } from '@/components/processed-text-editor'
import { RegexRulesEditor } from '@/components/regex-rules-editor'

export default function Home() {
  const [originalText, setOriginalText] = useState<string>('')
  const [processedText, setProcessedText] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const _handleTextLoaded = (text: string) => {
    setOriginalText(text)
    setProcessedText(text)
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
          <div className="flex flex-col h-full overflow-auto">
            <RegexRulesEditor
              originalText={originalText}
              onTextProcessed={(text: string) => { setProcessedText(text) }}
              onError={(errorMessage: string) => { setError(errorMessage) }}
              onCleanError={() => { setError(null) }}
            />
          </div>

          <div className="flex flex-col h-full overflow-auto">
            <ProcessedTextEditor textLoaded={_handleTextLoaded} processedText={processedText}></ProcessedTextEditor>
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