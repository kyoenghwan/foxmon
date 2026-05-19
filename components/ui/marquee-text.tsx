'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function MarqueeText({ children, className = '', style }: MarqueeTextProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };
        const timer = setTimeout(checkOverflow, 100);
        window.addEventListener('resize', checkOverflow);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkOverflow);
        };
    }, [children]);

    const displayClass = className.replace(/truncate|line-clamp-\d/g, '').trim();

    return (
        <div ref={containerRef} className="w-full min-w-0 overflow-hidden relative flex items-center" style={style}>
            {isOverflowing ? (
                <div
                    className={`${displayClass} whitespace-nowrap inline-block`}
                    style={{ animation: 'marquee-scroll 8s linear infinite' }}
                >
                    <span className="mr-12">{children}</span>
                    <span>{children}</span>
                </div>
            ) : (
                <div ref={textRef} className={`${className} whitespace-nowrap`}>
                    {children}
                </div>
            )}
        </div>
    );
}
