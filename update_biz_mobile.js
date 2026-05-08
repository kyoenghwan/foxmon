const fs = require('fs');

// 1. Update BizSidebar.tsx
let bizSidebar = fs.readFileSync('components/biz/BizSidebar.tsx', 'utf8');
bizSidebar = bizSidebar.replace('export function BizSidebar() {', 'export function BizSidebar({ isMobile = false }: { isMobile?: boolean }) {');

const bizMobileRender = `
    if (isMobile) {
        return (
            <div className="w-full bg-white py-2">
                <div className="flex flex-wrap gap-1.5">
                    {sections[0].items.map((item) => {
                        const isActive = activeId === item.id || activeId === item.href;
                        return (
                            <Link
                                key={item.id}
                                href={item.href || '#'}
                                className={\`px-4 py-2 rounded-full text-[13px] font-bold transition-all whitespace-nowrap \${
                                    isActive
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }\`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        );
    }
`;
bizSidebar = bizSidebar.replace('return (', bizMobileRender + '\n    return (');
fs.writeFileSync('components/biz/BizSidebar.tsx', bizSidebar);

// 2. Update app/biz/layout.tsx
let bizLayout = fs.readFileSync('app/biz/layout.tsx', 'utf8');
bizLayout = bizLayout.replace(
    /<div className="flex gap-6 items-start">[\s\S]*?<div className="w-52 shrink-0 sticky top-\[130px\]">\s*<BizSidebar \/>\s*<\/div>/,
    `<div className="md:hidden mb-4 sticky top-[136px] z-20 bg-white border-b pb-2">
                    <BizSidebar isMobile />
                </div>
                <div className="flex gap-6 items-start">
                    {/* 좌측 사이드바 */}
                    <div className="w-52 shrink-0 sticky top-[130px] hidden md:block">
                        <BizSidebar />
                    </div>`
);
fs.writeFileSync('app/biz/layout.tsx', bizLayout);

console.log('Biz layout updated');
