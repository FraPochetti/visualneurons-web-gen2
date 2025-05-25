import React, { memo } from "react";
import styles from "./ModelCredits.module.css";

interface ModelCreditsProps {
    modelName: string;
    modelUrl?: string;
    className?: string;
}

export const ModelCredits = memo<ModelCreditsProps>(({
    modelName,
    modelUrl,
    className
}) => {
    return (
        <div
            className={`${styles.container} ${className || ''}`}
            role="contentinfo"
            aria-label="Model attribution"
        >
            <span>Powered by </span>
            {modelUrl ? (
                <a
                    href={modelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                    aria-label={`Learn more about ${modelName} model`}
                >
                    {modelName}
                </a>
            ) : (
                <span className={styles.modelName}>{modelName}</span>
            )}
        </div>
    );
});

ModelCredits.displayName = "ModelCredits"; 