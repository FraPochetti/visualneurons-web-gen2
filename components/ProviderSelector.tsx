// components/ProviderSelector.tsx
import React from "react";
import styles from "./ProviderSelector.module.css";

interface ProviderSelectorProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    allowedProviders?: string[]; // optional filter
}

export default function ProviderSelector({
    value,
    onChange,
    allowedProviders,
}: ProviderSelectorProps) {
    // Full set of providers you support
    const allProviders = [
        { value: "replicate", label: "Replicate" },
        { value: "stability", label: "Stability" },
        { value: "gemini", label: "Gemini" },
        // { value: "openai", label: "OpenAI" }, // add if needed
    ];

    // If allowedProviders is passed, filter the list; otherwise, use all
    const providersToShow = allowedProviders
        ? allProviders.filter((p) => allowedProviders.includes(p.value))
        : allProviders;

    return (
        <div className={styles.container}>
            <label htmlFor="provider-select" className={styles.label}>
                Select Provider:
            </label>
            <select
                id="provider-select"
                value={value}
                onChange={onChange}
                className={styles.select}
            >
                {providersToShow.map((p) => (
                    <option key={p.value} value={p.value}>
                        {p.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
