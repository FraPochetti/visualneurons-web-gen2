// components/OperationSelector.tsx
import { AIOperation } from '@/amplify/functions/providers/IAIProvider';

interface OperationSelectorProps {
    value: AIOperation;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    provider: string;
}

export default function OperationSelector({ value, onChange, provider }: OperationSelectorProps) {
    // We'll start with just upscaleImage, but more operations can be added later
    const operations: { value: AIOperation; label: string }[] = [
        { value: 'upscaleImage', label: 'Upscale' },
        // Add more as they're implemented
    ];

    return (
        <div>
            <label htmlFor="operation">Operation: </label>
            <select id="operation" value={value} onChange={onChange} className="select">
                {operations.map((op) => (
                    <option key={op.value} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>
        </div>
    );
}