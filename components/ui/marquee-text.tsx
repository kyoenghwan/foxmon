'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function MarqueeText({ children, className = '', style }: MarqueeTextProps) {
    const measureRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && measureRef.current) {
                setIsOverflowing(measureRef.current.scrollWidth > containerRef.current.clientWidth);
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
            {/* 항상 마운트되는 측정용 텍스트 (레이아웃에 영향 없음) */}
            <span
                ref={measureRef}
                className={`${className} pointer-events-none absolute left-0 top-0 whitespace-nowrap opacity-0`}
                aria-hidden
            >
                {children}
            </span>
            {isOverflowing ? (
                <div
                    className={`${displayClass} whitespace-nowrap inline-block`}
                    style={{ animation: 'marquee-scroll 8s linear infinite' }}
                >
                    <span className="mr-12">{children}</span>
                    <span>{children}</span>
                </div>
            ) : (
                <div className={`${className} whitespace-nowrap min-w-0`}>{children}</div>
            )}
        </div>
    );
}
