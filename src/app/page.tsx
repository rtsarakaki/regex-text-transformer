'use client'

import { useState } from 'react'
import Split from 'react-split'

import { ProcessedTextEditor } from '@/components/processed-text-editor'
import { RegexRulesEditor } from '@/components/regex-rules-editor'
import { ErrorMessage } from '@/components/error-message'

export default function Home() {
  const [originalText, setOriginalText] = useState<string>('')
  const [mode, setMode] = useState<'process' | 'validate' | 'generate_document'>('process')
  const [processedText, setProcessedText] = useState<string>('')
  const [alert, setAlert] = useState<string | null>(null)
  const [alertType, setAlertType] = useState<'error' | 'success'>('error')

  const _handleTextLoaded = (text: string) => {
    setOriginalText(text)
    setProcessedText(text)
  }

  const _handleError = (errorMessage: string) => {
    setAlert(errorMessage)
    setAlertType('error')
  }

  const _handleSuccess = (successMessage: string) => {
    setAlert(successMessage)
    setAlertType('success')
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
              mode={mode}
              onTextProcessed={(text: string) => { setProcessedText(text) }}
              onError={_handleError}
              onSuccess={_handleSuccess}
              onCleanAlert={() => { setAlert(null) }}
            />
          </div>

          <div className="flex flex-col h-full overflow-auto">
            <ProcessedTextEditor 
              textLoaded={_handleTextLoaded} 
              processedText={processedText}
              onChangeMode={(mode: 'process' | 'validate' | 'generate_document') => setMode(mode)}
            />
          </div>
        </Split>
      </main>

      {alert && (
        <ErrorMessage message={alert} type={alertType} onClose={() => setAlert(null)} />
      )}

      <footer className="bg-slate-800 text-center p-2 text-sm text-slate-400">
        Processador de Texto com Regras Regex © 2025
      </footer>
    </div>
  )
}