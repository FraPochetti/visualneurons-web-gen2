// components/CompareSlider.tsx
import React from "react";
import ReactCompareImage from "react-compare-image";

interface CompareSliderProps {
    before: string;
    after: string;
}

export default function CompareSlider({ before, after }: CompareSliderProps) {
    return (
        <div className="compare-slider-container">
            <ReactCompareImage
                leftImage={before}
                rightImage={after}
                sliderPositionPercentage={0.5}
            />
        </div>
    );
}
