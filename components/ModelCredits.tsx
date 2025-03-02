// components/ModelCredits.tsx
import React from 'react';

type ModelCreditsProps = {
    modelName: string;
    modelUrl: string;
};

export default function ModelCredits({ modelName, modelUrl }: ModelCreditsProps) {
    return (
        <div style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
            <span>Powered by </span>
            <a href={modelUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#000", textDecoration: "underline" }}>
                {modelName}
            </a>
        </div>
    );
}
