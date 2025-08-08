"use client";
import React, { useState, useRef, useEffect, memo, useCallback } from "react";
import styles from "./CustomCompareSlider.module.css";

interface CustomCompareSliderProps {
    before: string;
    after: string;
    className?: string;
    onSliderChange?: (position: number) => void;
}

export const CustomCompareSlider = memo<CustomCompareSliderProps>(({
    before,
    after,
    className,
    onSliderChange
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const updateSliderPosition = useCallback((position: number) => {
        const clampedPosition = Math.max(0, Math.min(100, position));
        setSliderPosition(clampedPosition);
        onSliderChange?.(clampedPosition);
    }, [onSliderChange]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const position = ((e.clientX - rect.left) / rect.width) * 100;
        updateSliderPosition(position);
    }, [isDragging, updateSliderPosition]);

    const handleRangeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateSliderPosition(Number(e.target.value));
    }, [updateSliderPosition]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        let newPosition = sliderPosition;

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                newPosition = Math.max(0, sliderPosition - 1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                newPosition = Math.min(100, sliderPosition + 1);
                break;
            case 'Home':
                e.preventDefault();
                newPosition = 0;
                break;
            case 'End':
                e.preventDefault();
                newPosition = 100;
                break;
            default:
                return;
        }

        updateSliderPosition(newPosition);
    }, [sliderPosition, updateSliderPosition]);

    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mouseup', handleGlobalMouseUp);
            document.addEventListener('mouseleave', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('mouseleave', handleGlobalMouseUp);
        };
    }, [isDragging]);

    return (
        <div
            ref={containerRef}
            className={`${styles.container} ${className || ''}`}
            onMouseMove={handleMouseMove}
            role="img"
            aria-label="Image comparison slider"
        >
            {/* Labels */}
            <div className={styles.beforeLabel} aria-hidden="true">
                Before
            </div>
            <div className={styles.afterLabel} aria-hidden="true">
                After
            </div>

            {/* Before image - clipped to slider position from left */}
            <div
                className={styles.beforeContainer}
                style={{
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                }}
            >
                <img
                    src={before}
                    alt="Before comparison"
                    className={styles.beforeImage}
                    loading="lazy"
                />
            </div>

            {/* After image - clipped to slider position from right */}
            <div
                className={styles.afterContainer}
                style={{
                    clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`
                }}
            >
                <img
                    src={after}
                    alt="After comparison"
                    className={styles.afterImage}
                    loading="lazy"
                />
            </div>

            {/* Slider line with handle */}
            <div
                className={styles.sliderLine}
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={handleMouseDown}
                role="slider"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                aria-label={`Comparison slider at ${Math.round(sliderPosition)}%`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(sliderPosition)}
            >
                <div className={styles.handle} aria-hidden="true"></div>
            </div>

            {/* Range input for accessibility */}
            <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={handleRangeChange}
                className={styles.rangeInput}
                style={{
                    background: `linear-gradient(to right, #0088ff 0%, #0088ff ${sliderPosition}%, #fff ${sliderPosition}%, #fff 100%)`,
                }}
                aria-label="Image comparison slider"
            />
        </div>
    );
});

CustomCompareSlider.displayName = "CustomCompareSlider"; 