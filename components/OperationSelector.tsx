import { AIOperation } from '@/amplify/functions/providers/IAIProvider';
import { OPERATION_MAP } from '@/amplify/functions/providers/operationMap';
import styles from "./OperationSelector.module.css";

interface OperationSelectorProps {
    value: AIOperation;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    provider: string;
}


export default function OperationSelector({ value, onChange, provider }: OperationSelectorProps) {
    // Get operations supported by the current provider
    const supportedOperations = OPERATION_MAP[provider] || ['upscaleImage'];

    // Map operations to user-friendly labels
    const operationLabels: Record<string, string> = {
        'upscaleImage': 'Upscale',
        'outpaint': 'Outpaint',
        'inpaint': 'Edit Image',
    };

    // Generate options list
    const availableOperations = supportedOperations.map(op => ({
        value: op,
        label: operationLabels[op] || op
    }));

    return (
        <div className={styles.container}>
            <label htmlFor="operation" className={styles.label}>Operation:</label>
            <select
                id="operation"
                value={supportedOperations.includes(value) ? value : supportedOperations[0]}
                onChange={onChange}
                className={styles.select}
            >
                {availableOperations.map((op) => (
                    <option key={op.value} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>
        </div>
    );
}