// components/CompareSlider.tsx
import React from "react";
import ReactCompareImage from "react-compare-image";

interface CompareSliderProps {
    before: string;
    after: string;
}

export default function CompareSlider({ before, after }: CompareSliderProps) {
    return (
        <div style={{ maxWidth: "100%", margin: "0 auto" }}>
            <ReactCompareImage
                leftImage={before}
                rightImage={after}
                sliderPositionPercentage={0.5}
                handleSize={40}  // optional
            />
        </div>
    );
}
