import { AIOperation } from '@/amplify/functions/providers/IAIProvider';
import styles from "./OperationSelector.module.css";

interface OperationSelectorProps {
    value: AIOperation;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    provider: string;
}

export default function OperationSelector({ value, onChange, provider }: OperationSelectorProps) {
    const operations: { value: AIOperation; label: string }[] = [
        { value: 'upscaleImage', label: 'Upscale' },
    ];

    return (
        <div className={styles.container}>
            <label htmlFor="operation" className={styles.label}>Operation:</label>
            <select id="operation" value={value} onChange={onChange} className={styles.select}>
                {operations.map((op) => (
                    <option key={op.value} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
