"use client";
import React, { memo } from "react";
import styles from "./VerticalCompare.module.css";

interface VerticalCompareProps {
    before: string;
    after: string;
    className?: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export const VerticalCompare = memo<VerticalCompareProps>(({
    before,
    after,
    className,
    beforeLabel = "Before",
    afterLabel = "After"
}) => {
    return (
        <div
            className={`${styles.verticalContainer} ${className || ''}`}
            role="img"
            aria-label="Vertical image comparison"
        >
            <div className={styles.section}>
                <h3 className={styles.label}>{beforeLabel}</h3>
                <img
                    src={before}
                    alt={`${beforeLabel} comparison image`}
                    className={styles.image}
                    loading="lazy"
                />
            </div>
            <div className={styles.section}>
                <h3 className={styles.label}>{afterLabel}</h3>
                <img
                    src={after}
                    alt={`${afterLabel} comparison image`}
                    className={styles.image}
                    loading="lazy"
                />
            </div>
        </div>
    );
});

VerticalCompare.displayName = "VerticalCompare"; 