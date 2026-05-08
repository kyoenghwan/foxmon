const fs = require('fs');

// 1. Update HelpSidebar.tsx
let helpSidebar = fs.readFileSync('components/help/HelpSidebar.tsx', 'utf8');
helpSidebar = helpSidebar.replace('export function HelpSidebar() {', 'export function HelpSidebar({ isMobile = false }: { isMobile?: boolean }) {');

const helpMobileRender = `
    if (isMobile) {
        return (
            <div className="w-full bg-white py-2">
                <div className="flex flex-wrap gap-1.5">
                    {sections.flatMap(s => s.items).map((item) => {
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
helpSidebar = helpSidebar.replace('return (', helpMobileRender + '\n    return (');
fs.writeFileSync('components/help/HelpSidebar.tsx', helpSidebar);

// 2. Update app/help/layout.tsx
let helpLayout = fs.readFileSync('app/help/layout.tsx', 'utf8');
helpLayout = helpLayout.replace(
    /<div className="flex gap-6 items-start">[\s\S]*?<div className="w-52 shrink-0 sticky top-\[130px\] hidden md:block">\s*<HelpSidebar \/>\s*<\/div>/,
    `<div className="md:hidden mb-4 sticky top-[136px] z-20 bg-white border-b pb-2">
                    <HelpSidebar isMobile />
                </div>
                <div className="flex gap-6 items-start">
                    <div className="w-52 shrink-0 sticky top-[130px] hidden md:block">
                        <HelpSidebar />
                    </div>`
);
fs.writeFileSync('app/help/layout.tsx', helpLayout);

console.log('Help layout updated');
