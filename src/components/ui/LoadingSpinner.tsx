import React from 'react';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    className?: string;
}

export function LoadingSpinner({
    size = 'medium',
    message = 'Loading...',
    className = ''
}: LoadingSpinnerProps): JSX.Element {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <div className={`loading-container ${className}`}>
            <div
                className={`loading-spinner ${sizeClasses[size]}`}
                role="status"
                aria-label={message}
            >
                <div className="spinner-border"></div>
            </div>
            {message && (
                <p className="loading-message">{message}</p>
            )}
        </div>
    );
} 