'use client';

import Link from 'next/link';

/**
 * 통합 사이드바 내비게이션 컴포넌트
 * 커뮤니티 / 고객센터 / 업체관리 3개 페이지가 동일한 스타일을 공유합니다.
 * 이 파일 하나만 수정하면 3곳 모두 자동 반영됩니다.
 */

export interface SidebarNavItem {
    id: string;       // tab id (button 방식) 또는 href (Link 방식)
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href?: string;    // 있으면 Link, 없으면 button으로 렌더링
}

export interface SidebarSection {
    title?: string;   // 섹션 제목 (선택)
    items: SidebarNavItem[];
}

interface SidebarNavProps {
    title: string;                 // 사이드바 상단 제목 (예: "커뮤니티", "고객센터")
    sections: SidebarSection[];    // 메뉴 섹션 배열
    activeId: string;              // 현재 활성 탭/경로
    onItemClick?: (id: string) => void;  // button 방식일 때 탭 변경 핸들러
    footerLink?: { href: string; label: string };  // 하단 링크 (선택)
}

export function SidebarNav({ title, sections, activeId, onItemClick, footerLink }: SidebarNavProps) {
    return (
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* 상단 타이틀 */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 text-center">
                <span className="text-xl font-black text-gray-900">{title}</span>
            </div>

            {/* 메뉴 섹션들 */}
            {sections.map((section, idx) => (
                <div key={section.title || idx}>
                    {/* 섹션 구분선 */}
                    {idx > 0 && <div className="border-t border-gray-100" />}

                    {/* 섹션 소제목 */}
                    {section.title && (
                        <div className="px-4 pt-3 pb-1">
                            <span className="text-[11px] font-black text-gray-400 tracking-wider">
                                {section.title}
                            </span>
                        </div>
                    )}

                    <div className="px-2.5 pb-2 space-y-0.5">
                        {section.items.map((item) => {
                            const isActive = activeId === item.id || activeId === item.href;
                            const Icon = item.icon;

                            const className = `
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group text-left
                                ${isActive
                                    ? 'bg-orange-50 text-primary'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                            `;

                            const content = (
                                <>
                                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    <span className={`text-[14px] font-bold ${isActive ? 'text-primary' : ''}`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 bg-primary rounded-full" />
                                    )}
                                </>
                            );

                            // href가 있으면 Link, 없으면 button
                            if (item.href) {
                                return (
                                    <Link key={item.id} href={item.href} className={className}>
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onItemClick?.(item.id)}
                                    className={className}
                                >
                                    {content}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* 하단 링크 (선택) */}
            {footerLink && (
                <div className="px-4 py-3 border-t border-gray-100">
                    <Link href={footerLink.href} className="text-[11px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1">
                        ← {footerLink.label}
                    </Link>
                </div>
            )}
        </nav>
    );
}
