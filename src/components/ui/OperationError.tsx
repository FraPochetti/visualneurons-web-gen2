import React, { useState } from 'react';

interface OperationErrorProps {
    message: string;
    details?: string;
    canRetry?: boolean;
    onRetry?: () => void;
}

export const OperationError: React.FC<OperationErrorProps> = ({ message, details, canRetry = false, onRetry }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: 4 }} role="alert">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                    <strong>Error:</strong> {message}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {details && (
                        <button type="button" className="button" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails}>
                            {showDetails ? 'Hide details' : 'Show details'}
                        </button>
                    )}
                    {canRetry && onRetry && (
                        <button type="button" className="button" onClick={onRetry}>Try again</button>
                    )}
                </div>
            </div>
            {showDetails && details && (
                <pre style={{ marginTop: 8, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                    {details}
                </pre>
            )}
        </div>
    );
};


