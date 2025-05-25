import React, { memo, useCallback } from 'react';
import styles from './ProviderSelector.module.css';

interface Provider {
    value: string;
    label: string;
    description?: string;
}

interface ProviderSelectorProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    excludeProviders?: string[];
    disabled?: boolean;
    className?: string;
    label?: string;
    required?: boolean;
}

const DEFAULT_PROVIDERS: Provider[] = [
    { value: "replicate", label: "Replicate", description: "High-quality AI models" },
    { value: "stability", label: "Stability AI", description: "Stable Diffusion models" },
    { value: "gemini", label: "Google Gemini", description: "Google's AI platform" }
];

export const ProviderSelector = memo<ProviderSelectorProps>(({
    value,
    onChange,
    excludeProviders = [],
    disabled = false,
    className,
    label = "Select Provider",
    required = false
}) => {
    const availableProviders = DEFAULT_PROVIDERS.filter(
        (provider: Provider) => !excludeProviders.includes(provider.value)
    );

    const handleChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(event);
    }, [onChange]);

    const selectId = "provider-select";

    return (
        <div className={`${styles.container} ${className || ''}`}>
            <label
                htmlFor={selectId}
                className={styles.label}
                aria-label={`${label}${required ? ' (required)' : ''}`}
            >
                {label}
                {required && <span className={styles.required} aria-label="required">*</span>}
            </label>
            <select
                id={selectId}
                value={value}
                onChange={handleChange}
                className={styles.select}
                disabled={disabled}
                required={required}
                aria-describedby={`${selectId}-description`}
                aria-invalid={!value && required ? 'true' : 'false'}
            >
                {!value && (
                    <option value="" disabled>
                        Choose a provider...
                    </option>
                )}
                {availableProviders.map(provider => (
                    <option
                        key={provider.value}
                        value={provider.value}
                        title={provider.description}
                    >
                        {provider.label}
                    </option>
                ))}
            </select>
            <div id={`${selectId}-description`} className={styles.description}>
                {value && availableProviders.find(p => p.value === value)?.description}
            </div>
        </div>
    );
});

ProviderSelector.displayName = 'ProviderSelector'; 