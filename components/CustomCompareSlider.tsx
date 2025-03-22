"use client";
import React, { useState } from "react";
import styles from "./CustomCompareSlider.module.css";

interface CustomCompareSliderProps {
    before: string;
    after: string;
}

export default function CustomCompareSlider({ before, after }: CustomCompareSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);

    return (
        <div className={styles.container}>
            {/* After image */}
            <img src={after} alt="After" className={styles.afterImage} />

            {/* Before image container */}
            <div className={styles.beforeContainer} style={{ width: `${sliderPosition}%` }}>
                <img src={before} alt="Before" className={styles.beforeImage} />
            </div>

            {/* Slider line with dynamic left position */}
            <div className={styles.sliderLine} style={{ left: `${sliderPosition}%` }} />

            {/* Range input */}
            <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className={styles.rangeInput}
            />
        </div>
    );
}
