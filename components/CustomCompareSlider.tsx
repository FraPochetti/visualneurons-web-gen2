// components/CustomCompareSlider.tsx
"use client";
import React, { useState } from "react";

interface CustomCompareSliderProps {
    before: string;
    after: string;
}

export default function CustomCompareSlider({ before, after }: CustomCompareSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50);

    return (
        <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
            <div style={{
                position: "relative",
                overflow: "hidden"
            }}>
                {/* After image */}
                <img
                    src={after}
                    alt="After"
                    style={{
                        display: "block",
                        width: "100%",
                        height: "auto"
                    }}
                />

                {/* After label */}
                <div style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "rgba(0,0,0,0.7)",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    fontWeight: "bold"
                }}>
                    After
                </div>

                {/* Before image with clip */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: `${sliderPosition}%`,
                    height: "100%",
                    overflow: "hidden"
                }}>
                    <img
                        src={before}
                        alt="Before"
                        style={{
                            width: `${100 / (sliderPosition / 100)}%`,
                            maxWidth: "none",
                            height: "auto"
                        }}
                    />

                    {/* Before label */}
                    <div style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        fontWeight: "bold"
                    }}>
                        Before
                    </div>
                </div>

                {/* Slider line */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: `${sliderPosition}%`,
                    width: "4px",
                    height: "100%",
                    backgroundColor: "white",
                    boxShadow: "0 0 5px rgba(0,0,0,0.7)"
                }} />
            </div>

            <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                style={{ width: "100%", margin: "10px 0" }}
            />
        </div>
    );
}