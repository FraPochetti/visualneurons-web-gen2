// components/ProviderSelector.tsx
import React from 'react';

interface ProviderSelectorProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export default function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
    return (
        <div style={{ margin: "1rem 0" }}>
            <label htmlFor="provider-select">Select Provider: </label>
            <select id="provider-select" value={value} onChange={onChange}>
                <option value="replicate">Replicate</option>
                <option value="stability">Stability</option>
            </select>
        </div>
    );
}