import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Toolbar } from './toolbar';

describe('Toolbar', () => {
    const handleSave = jest.fn();
    const handleLoad = jest.fn();
    const handleCopy = jest.fn();
    const title = 'Regras JSON';
    const acceptTypes = '.json,.yaml,.yml';

    beforeEach(() => {
        render(
            <Toolbar
                onSave={handleSave}
                onLoad={handleLoad}
                onCopy={handleCopy}
                title={title}
                acceptTypes={acceptTypes}
            />
        );
    });

    test('renders the correct title', () => {
        const titleElement = screen.getByText(title);
        expect(titleElement).toBeInTheDocument();
    });

    test('renders the Save, Load, and Copy buttons', () => {
        const saveButton = screen.getByText(/Salvar/i);
        const loadButton = screen.getByText(/Carregar/i);
        const copyButton = screen.getByText(/Copiar/i);

        expect(saveButton).toBeInTheDocument();
        expect(loadButton).toBeInTheDocument();
        expect(copyButton).toBeInTheDocument();
    });

    test('calls the onSave function when the Save button is clicked', () => {
        const saveButton = screen.getByText(/Salvar/i);
        fireEvent.click(saveButton);
        expect(handleSave).toHaveBeenCalled();
    });

    test('calls the onLoad function when a file is selected', () => {
        const loadButton = screen.getByText(/Carregar/i);
        fireEvent.click(loadButton);

        const fileInput = screen.getByTestId('file-input');
        const file = new File(['dummy content'], 'example.json', { type: 'application/json' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(handleLoad).toHaveBeenCalled();
    });

    test('calls the onCopy function when the Copy button is clicked', () => {
        const copyButton = screen.getByText(/Copiar/i);
        fireEvent.click(copyButton);
        expect(handleCopy).toHaveBeenCalled();
    });
});