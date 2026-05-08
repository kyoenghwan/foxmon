const fs = require('fs');
let code = fs.readFileSync('components/biz/JobEditorForm.tsx', 'utf8');

// 1. Add state variable
code = code.replace(/const \[activeTab, setActiveTab\] = useState<'job' \| 'detail'>\('job'\);/, 
`const [activeTab, setActiveTab] = useState<'job' | 'detail'>('job');
    const [activeModal, setActiveModal] = useState<'basic' | 'theme' | 'animation' | 'color' | null>(null);`);

// 2. Change Layout
code = code.replace(/\{\/\* ② 왼쪽\(미리보기\+로고\) & 오른쪽\(기본정보\) 그리드 \*\/\}\s*<div className="flex flex-col lg:flex-row gap-6">/, 
`{/* ② 배너 미리보기 & 로고 (상단) / 기본정보 (하단) */}
                    <div className="flex flex-col gap-6">`);

// 3. Remove w-full lg:w-[240px] shrink-0 space-y-4 from Left Column
code = code.replace(/<div className="w-full lg:w-\[240px\] shrink-0 space-y-4">/, 
`<div className="flex flex-wrap justify-center gap-6">`);

// 4. Find where the left column ends
const basicInfoMatch = code.match(/\{\/\* 오른쪽 컬럼 \(기본 정보\) \*\/\}\s*<div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 space-y-4">([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* ③ 등급별 배너 테마 설정 \*\/\}/);
let basicInfoBlock = '';
if (basicInfoMatch) {
    basicInfoBlock = basicInfoMatch[1] + '</div>\n                        </div>';
    
    // Add the buttons instead of Basic Info Block
    const buttonsBlock = `
                        {/* 설정 버튼 그룹 */}
                        {mode === 'AD' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <button type="button" onClick={() => setActiveModal('basic')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-primary hover:bg-orange-50 transition-all group">
                                    <Info className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                    <span className="text-[13px] font-bold text-gray-700 group-hover:text-primary">기본 정보 설정</span>
                                </button>
                                {form.tier === 'PREMIUM' && (
                                    <button type="button" onClick={() => setActiveModal('theme')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-yellow-500 hover:bg-yellow-50 transition-all group">
                                        <Crown className="w-6 h-6 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                                        <span className="text-[13px] font-bold text-gray-700 group-hover:text-yellow-600">테마 설정</span>
                                    </button>
                                )}
                                {form.tier === 'SPECIAL' && (
                                    <button type="button" onClick={() => setActiveModal('color')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-purple-500 hover:bg-purple-50 transition-all group">
                                        <span className="text-[20px]">⭐</span>
                                        <span className="text-[13px] font-bold text-gray-700 group-hover:text-purple-600">색상 설정</span>
                                    </button>
                                )}
                            </div>
                        )}
                        {mode === 'JOB' && (
                            <button type="button" onClick={() => setActiveModal('basic')} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-primary hover:bg-orange-50 transition-all group">
                                <Info className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                <span className="text-[14px] font-bold text-gray-700 group-hover:text-primary">기본 정보 입력 (채용공고/급여 등)</span>
                            </button>
                        )}
                        
                        {/* 하단 팝업: 기본 정보 */}
                        <Dialog open={activeModal === 'basic'} onOpenChange={(open) => !open && setActiveModal(null)}>
                            <DialogContent className="max-w-xl bg-white p-6 border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                                <div className="space-y-4">
    `;
    code = code.replace(basicInfoMatch[0], buttonsBlock + basicInfoMatch[1] + `
                                    <div className="pt-4 flex justify-end">
                                        <button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
                                            확인
                                        </button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {/* ③ 등급별 배너 테마 설정 */}
    `);
}

// 5. Transform Theme Block
const themeBlockMatch = code.match(/\{mode === 'AD' && form\.tier === 'PREMIUM' && \([\s\S]*?<\/div>\s*\)\}/);
if (themeBlockMatch) {
    let themeBlock = themeBlockMatch[0];
    // Convert to Dialog
    themeBlock = themeBlock.replace(/<div className="bg-white rounded-2xl border border-yellow-200 p-6 space-y-5">/, 
        `<DialogContent className="max-w-xl bg-white p-6 border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">\n                        <div className="space-y-5">`);
    themeBlock = themeBlock.replace(/\{mode === 'AD' && form\.tier === 'PREMIUM' && \(/, 
        `<Dialog open={activeModal === 'theme'} onOpenChange={(open) => !open && setActiveModal(null)}>`);
    
    // Replace the final </div>)}
    themeBlock = themeBlock.replace(/<\/div>\s*\)$/, 
        `<div className="pt-4 flex justify-end"><button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">확인</button></div></div></DialogContent></Dialog>`);
    
    code = code.replace(themeBlockMatch[0], themeBlock);
}

// 6. Transform Special Color Block
const colorBlockMatch = code.match(/\{mode === 'AD' && form\.tier === 'SPECIAL' && \([\s\S]*?<\/div>\s*\)\}/);
if (colorBlockMatch) {
    let colorBlock = colorBlockMatch[0];
    colorBlock = colorBlock.replace(/<div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-5">/, 
        `<DialogContent className="max-w-xl bg-white p-6 border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">\n                        <div className="space-y-5">`);
    colorBlock = colorBlock.replace(/\{mode === 'AD' && form\.tier === 'SPECIAL' && \(/, 
        `<Dialog open={activeModal === 'color'} onOpenChange={(open) => !open && setActiveModal(null)}>`);
    
    colorBlock = colorBlock.replace(/<\/div>\s*\)$/, 
        `<div className="pt-4 flex justify-end"><button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">확인</button></div></div></DialogContent></Dialog>`);
    
    code = code.replace(colorBlockMatch[0], colorBlock);
}

fs.writeFileSync('components/biz/JobEditorForm.tsx', code);
console.log('JobEditorForm transformed successfully!');
