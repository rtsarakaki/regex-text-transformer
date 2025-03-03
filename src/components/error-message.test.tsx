import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { ErrorMessage } from './error-message'

describe('ErrorMessage', () => {
    test('renders the error message with a red background', () => {
        const message = 'This is an error message'
        render(<ErrorMessage message={message} type="error" onClose={jest.fn()} />)

        const errorMessageElement = screen.getByText(message)
        expect(errorMessageElement).toBeInTheDocument()
        expect(errorMessageElement).toHaveClass('bg-red-600')
        expect(errorMessageElement).toHaveTextContent(message)
    })

    test('renders the success message with a green background', () => {
        const message = 'This is a success message'
        render(<ErrorMessage message={message} type="success" onClose={jest.fn()} />)

        const successMessageElement = screen.getByText(message)
        expect(successMessageElement).toBeInTheDocument()
        expect(successMessageElement).toHaveClass('bg-green-600')
        expect(successMessageElement).toHaveTextContent(message)
    })

    test('message disappears after 3 seconds and calls onClose', async () => {
        const message = 'This message will disappear'
        const onClose = jest.fn()
        render(<ErrorMessage message={message} type="error" onClose={onClose} />)

        const errorMessageElement = screen.getByText(message)
        expect(errorMessageElement).toBeInTheDocument()

        await waitFor(() => {
            expect(errorMessageElement).not.toBeInTheDocument()
            expect(onClose).toHaveBeenCalled()
        }, { timeout: 4000 })
    })
})