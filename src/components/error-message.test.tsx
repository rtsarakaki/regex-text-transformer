import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import React from 'react';
import { ErrorMessage } from './error-message';

describe('ErrorMessage', () => {
    test('renders the error message with a red background', () => {
        const message = 'This is an error message';
        render(<ErrorMessage message={message} />);

        const errorMessageElement = screen.getByText(message);
        expect(errorMessageElement).toBeInTheDocument();
        expect(errorMessageElement).toHaveClass('bg-red-600');
        expect(errorMessageElement).toHaveTextContent(message);
    });
});