import React from 'react';
import styles from "./ProviderSelector.module.css";

interface ProviderSelectorProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    excludeProviders?: string[];
}

export default function ProviderSelector({ value, onChange, excludeProviders = [] }: ProviderSelectorProps) {
    const providers = [
        { value: "replicate", label: "Replicate" },
        { value: "stability", label: "Stability" },
        { value: "gemini", label: "Gemini" }
    ].filter(p => !excludeProviders.includes(p.value));

    return (
        <div className={styles.container}>
            <label htmlFor="provider-select" className={styles.label}>Select Provider: </label>
            <select id="provider-select" value={value} onChange={onChange} className={styles.select}>
                {providers.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                ))}
            </select>
        </div>
    );
}
