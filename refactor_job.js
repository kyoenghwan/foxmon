const fs = require('fs');
let code = fs.readFileSync('components/biz/JobEditorForm.tsx', 'utf8');

// 1. Add state variable
code = code.replace(/const \[activeTab, setActiveTab\] = useState<'job' \| 'detail'>\('job'\);/, 
`const [activeTab, setActiveTab] = useState<'job' | 'detail'>('job');
    const [activeModal, setActiveModal] = useState<'basic' | 'theme' | 'animation' | 'color' | null>(null);`);

// 2. Change the layout of preview & logo
// Replace: <div className="flex flex-col lg:flex-row gap-6"> -> <div className="flex flex-wrap justify-center gap-6">
// Wait, JobEditorForm has:
// <div className="flex flex-col lg:flex-row gap-6">
//    <div className="w-full lg:w-[240px] shrink-0 space-y-4">
//      [미리보기] + [로고]
//    </div>
//    <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
//      [기본정보]
//    </div>
// </div>

// We will replace this entire layout.
const gridMatch = code.match(/\{\/\* ② 왼쪽\(미리보기\+로고\) & 오른쪽\(기본정보\) 그리드 \*\/\}\s*<div className="flex flex-col lg:flex-row gap-6">([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* ③ 등급별 배너 테마 설정 \*\/\}/);
if (gridMatch) {
    let innerContent = gridMatch[0];
    
    // Extract the "기본 정보" content to put into a dialog
    const basicInfoMatch = innerContent.match(/\{\/\* 오른쪽 컬럼 \(기본 정보\) \*\/\}\s*<div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">([\s\S]*?)(?=<\/div>\s*<\/div>\s*\{\/\* ③ 등급별)/);
    
    // Actually, JobEditorForm is slightly different. The basic info is HUGE. 
    // It has "모집 조건", "급여 조건", "상세 업소 정보" below.
    // The user's screenshot and request specifically target the "배너 설정" (AdEditorForm). 
    // He mentions: "1. 기본정보 입력 2. 태마설정 3. 애니메이션 설정 4. 배너 배경색 설정".
    // JobEditorForm's basic info is the core of the Job posting, not just for the banner.
    // But to make it consistent, I should extract it.
}

console.log("Needs manual extraction for JobEditorForm due to structural differences.");
