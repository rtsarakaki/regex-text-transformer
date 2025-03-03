import React from 'react'
import { render } from '@testing-library/react'
import { RegexRulesEditor } from './regex-rules-editor'

describe('RegexRulesEditor', () => {
    const originalText = 'Hello world'
    const onTextProcessed = jest.fn()
    const onError = jest.fn()
    const onCleanError = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should render without crashing', () => {
        const { getByText, getByRole } = render(
            <RegexRulesEditor
                originalText={originalText}
                onTextProcessed={onTextProcessed}
                onError={onError}
                onCleanError={onCleanError}
            />
        )

        // Verifica se o título "JSON Rules" está presente
        expect(getByText('JSON Rules')).toBeInTheDocument()

        // Verifica se o seletor de formato está presente
        expect(getByRole('combobox')).toBeInTheDocument()

    })
})