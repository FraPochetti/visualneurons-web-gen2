import React from 'react';
import styles from "./ProviderSelector.module.css";

interface ProviderSelectorProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
    return (
        <div className={styles.container}>
            <label htmlFor="provider-select" className={styles.label}>Select Provider: </label>
            <select id="provider-select" value={value} onChange={onChange} className={styles.select}>
                <option value="replicate">Replicate</option>
                <option value="stability">Stability</option>
                <option value="gemini">Gemini</option>
            </select>
        </div>
    );
}
