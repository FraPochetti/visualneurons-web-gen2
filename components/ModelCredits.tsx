import React from 'react';
import styles from "./ModelCredits.module.css";

type ModelCreditsProps = {
    modelName: string;
    modelUrl?: string;
};

export default function ModelCredits({ modelName, modelUrl }: ModelCreditsProps) {
    return (
        <div className={styles.container}>
            <span>Powered by </span>
            <a href={modelUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
                {modelName}
            </a>
        </div>
    );
}
