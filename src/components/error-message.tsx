import React, { useEffect, useState } from 'react'

interface ErrorMessageProps {
    message: string
    type: 'error' | 'success'
    onClose: () => void
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, type, onClose }) => {
    const [visible, setVisible] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false)
            onClose()
        }, 3000)

        return () => clearTimeout(timer)
    }, [onClose])

    if (!visible) {
        return null
    }

    return (
        <div className={`p-4 rounded ${type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white`}>
            {message}
        </div>
    )
}