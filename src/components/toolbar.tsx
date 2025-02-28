// components/Toolbar.tsx
import React, { useRef } from 'react';

interface ToolbarProps {
    onSave: () => void;
    onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
    title: string;
    acceptTypes: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onSave, onLoad, title, acceptTypes }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-slate-800 p-3 flex items-center border border-slate-700 rounded-t justify-between">
            <span className="font-medium text-cyan-300">{title}</span>
            <div className="flex space-x-2">
                <button
                    onClick={onSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Salvar
                </button>
                <button
                    onClick={handleLoadClick}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Carregar
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onLoad}
                    className="hidden"
                    accept={acceptTypes}
                />
            </div>
        </div>
    );
};

