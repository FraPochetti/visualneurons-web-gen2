"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./CustomCompareSlider.module.css";

interface CustomCompareSliderProps {
    before: string;
    after: string;
}

export default function CustomCompareSlider({ before, after }: CustomCompareSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const position = ((e.clientX - rect.left) / rect.width) * 100;
        setSliderPosition(Math.max(0, Math.min(100, position)));
    };

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    return (
        <div
            ref={containerRef}
            className={styles.container}
            onMouseMove={handleMouseMove}
        >
            {/* Labels */}
            <div className={styles.beforeLabel}>Before</div>
            <div className={styles.afterLabel}>After</div>

            {/* Before image - clipped to slider position from left */}
            <div
                className={styles.beforeContainer}
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
                <img src={before} alt="Before" className={styles.beforeImage} />
            </div>

            <div
                className={styles.afterContainer}
                style={{ clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)` }}
            >
                <img src={after} alt="After" className={styles.afterImage} />
            </div>

            {/* Slider line with handle */}
            <div
                className={styles.sliderLine}
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
            >
                <div className={styles.handle}></div>
            </div>

            {/* Range input */}
            <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className={styles.rangeInput}
                style={{
                    background: `linear-gradient(to right, #0088ff 0%, #0088ff ${sliderPosition}%, #fff ${sliderPosition}%, #fff 100%)`,
                }}
            />
        </div>
    );
}