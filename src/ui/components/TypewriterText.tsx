"use client";

import { useState, useEffect } from "react";

interface TypewriterTextProps {
    texts: string[];
    fonts: string[];
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
    className?: string;
}

export function TypewriterText({
    texts,
    fonts,
    typingSpeed = 20,
    deletingSpeed = 10,
    pauseDuration = 500,
    className = "",
}: TypewriterTextProps) {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [currentFontIndex, setCurrentFontIndex] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let lastTime = 0;
        let frameId: number;

        const animate = (time: number) => {
            if (!lastTime) lastTime = time;
            const deltaTime = time - lastTime;

            const fullText = texts[currentTextIndex];
            const speed = isDeleting ? deletingSpeed : typingSpeed;

            if (deltaTime >= speed) {
                lastTime = time;

                if (!isDeleting) {
                    if (displayText.length < fullText.length) {
                        setDisplayText(fullText.substring(0, displayText.length + 1));
                    } else {
                        // Wait for pause duration
                        cancelAnimationFrame(frameId);
                        setTimeout(() => setIsDeleting(true), pauseDuration);
                        return;
                    }
                } else {
                    if (displayText.length > 0) {
                        setDisplayText(fullText.substring(0, displayText.length - 1));
                    } else {
                        setIsDeleting(false);
                        setCurrentTextIndex((prev) => (prev + 1) % texts.length);
                        setCurrentFontIndex((prev) => (prev + 1) % fonts.length);
                    }
                }
            }
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [displayText, isDeleting, currentTextIndex, texts, typingSpeed, deletingSpeed, pauseDuration, fonts.length]);

    return (
        <span
            className={className}
            style={{ fontFamily: fonts[currentFontIndex] }}
        >
            {displayText}
            <span className="animate-pulse border-r-2 border-sage ml-1"></span>
        </span>
    );
}
