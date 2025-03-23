"use client";
import React from "react";
import styles from "./VerticalCompare.module.css";

interface VerticalCompareProps {
    before: string;
    after: string;
}

export default function VerticalCompare({ before, after }: VerticalCompareProps) {
    return (
        <div className={styles.verticalContainer}>
            <div className={styles.section}>
                <h3>Before</h3>
                <img src={before} alt="Before" className={styles.image} />
            </div>
            <div className={styles.section}>
                <h3>After</h3>
                <img src={after} alt="After" className={styles.image} />
            </div>
        </div>
    );
}
