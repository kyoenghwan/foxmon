const fs = require('fs');
let code = fs.readFileSync('components/biz/AdEditorForm.tsx', 'utf8');

// The layout right now:
// {mode === 'AD' && (
//     <div className="flex flex-wrap justify-center gap-6">
//          [배너 미리보기 block]
//          [로고 업로드 block]
//     </div>
// )}
//
// {/* 하단 컬럼 (기본 정보) */}
// <div className="w-full bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
//      [기본 정보 내용]
// </div>

// Instead of parsing with regex, I'll extract the blocks and replace them.

// 1. Find the "하단 컬럼 (기본 정보)"
const basicInfoMatch = code.match(/\{\/\* 하단 컬럼 \(기본 정보\) \*\/\}([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* ③ 등급별 배너 디자인 설정 \*\/\}/);
let basicInfoBlock = '';
if (basicInfoMatch) {
    basicInfoBlock = basicInfoMatch[1] + '</div>\n                        </div>';
    // Remove it from original place, and add the Buttons there
    const buttonsBlock = `
                        {/* 설정 버튼 그룹 */}
                        {mode === 'AD' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <button type="button" onClick={() => setActiveModal('basic')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:border-primary hover:bg-orange-50 transition-all group">
                                    <Info className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                    <span className="text-[13px] font-bold text-gray-700 group-hover:text-primary">기본 정보 설정</span>
                                </button>
                                {(form.tier === 'PREMIUM' || form.tier === 'SPECIAL') && (
                                    <button type="button" onClick={() => setActiveModal('theme')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:border-yellow-500 hover:bg-yellow-50 transition-all group">
                                        <Crown className="w-6 h-6 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                                        <span className="text-[13px] font-bold text-gray-700 group-hover:text-yellow-600">테마 설정</span>
                                    </button>
                                )}
                                {form.tier === 'PREMIUM' && (
                                    <button type="button" onClick={() => setActiveModal('animation')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:border-purple-500 hover:bg-purple-50 transition-all group">
                                        <span className="text-[24px]">✨</span>
                                        <span className="text-[13px] font-bold text-gray-700 group-hover:text-purple-600">애니메이션 설정</span>
                                    </button>
                                )}
                                {form.tier !== 'PREMIUM_MAIN' && form.tier !== 'GENERAL' && (
                                    <button type="button" onClick={() => setActiveModal('color')} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                        <Palette className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-[13px] font-bold text-gray-700 group-hover:text-blue-600">배경색 설정</span>
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* mode === 'JOB' 인 경우 기본 정보 입력 버튼 */}
                        {mode === 'JOB' && (
                            <button type="button" onClick={() => setActiveModal('basic')} className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-gray-200 bg-white hover:border-primary hover:bg-orange-50 transition-all group">
                                <Info className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                <span className="text-[14px] font-bold text-gray-700 group-hover:text-primary">기본 정보 입력 (채용공고/급여 등)</span>
                            </button>
                        )}
    `;
    code = code.replace(basicInfoMatch[0], buttonsBlock + '\n\n                    {/* ③ 등급별 배너 디자인 설정 */}');
}

// 2. Find Theme Block
const themeBlockMatch = code.match(/\{mode === 'AD' && \(form\.tier === 'PREMIUM' \|\| form\.tier === 'SPECIAL'\) && \([\s\S]*?<\/div>\s*\)\}/);
let themeBlockStr = '';
if (themeBlockMatch) {
    themeBlockStr = themeBlockMatch[0];
    code = code.replace(themeBlockMatch[0], ''); // Remove from original flow
}

// 3. Find Color Block
const colorBlockMatch = code.match(/\{mode === 'AD' && form\.tier !== 'PREMIUM_MAIN' && \([\s\S]*?<\/div>\s*\)\}/);
let colorBlockStr = '';
if (colorBlockMatch) {
    colorBlockStr = colorBlockMatch[0];
    code = code.replace(colorBlockMatch[0], ''); // Remove from original flow
}

// 4. Extract Animation from within ThemeBlockStr if needed, but since it's intertwined, 
// let's separate Theme and Animation inside the popup.
// Wait! The Theme block has both `테마 선택` and `액션(애니메이션) 선택 (프리미엄 전용)`.
// We can just put the Theme selection in the Theme Modal, and the Animation in the Animation modal.
// Let's modify them directly.

// We will construct the Dialogs block
const dialogsBlock = `
            {/* 팝업 모달들 */}
            <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent className="max-w-[95%] w-[600px] bg-white p-0 border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    {/* 상단 헤더 대신 모달 닫기 버튼은 DialogContent 내장 기본 사용 (또는 커스텀) */}
                    <div className="p-6">
                        {activeModal === 'basic' && (
                            ${basicInfoBlock.replace('w-full bg-white rounded-2xl border border-gray-100 p-6', 'w-full')}
                        )}
                        
                        {activeModal === 'theme' && (
                            <div>
                                <h3 className="font-black text-[18px] text-gray-800 mb-6 flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-yellow-500" />
                                    테마 설정
                                </h3>
                                {/* 테마 선택 */}
                                <div>
                                    <label className="text-[13px] font-bold text-gray-600 mb-3 block">테마 선택</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {PREMIUM_THEMES.map(theme => (
                                            <button
                                                key={theme.key}
                                                type="button"
                                                onClick={() => { update('theme', theme.key); }}
                                                className={\`flex flex-col items-center gap-2 py-3 px-1 rounded-xl border-2 transition-all text-center \${
                                                    form.theme === theme.key ? 'border-gray-900 bg-gray-100 ring-2 ring-gray-400' : 'border-gray-100 hover:border-gray-300'
                                                }\`}
                                            >
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.color }} />
                                                <span className="text-[11px] font-black text-gray-600 leading-none">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
                                        확인
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeModal === 'animation' && (
                            <div>
                                <h3 className="font-black text-[18px] text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="text-[20px]">✨</span>
                                    애니메이션 설정
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[13px] font-bold text-gray-600 mb-3 block">액션(애니메이션) 선택</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {ACTION_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => update('action_type', opt.value)}
                                                className={\`py-3 px-2 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center \${
                                                    form.action_type === opt.value
                                                        ? 'border-primary bg-orange-50 text-primary ring-1 ring-primary/30'
                                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                }\`}
                                            >
                                                <p className="font-black text-[13px] whitespace-nowrap">{opt.label}</p>
                                                <p className="text-[11px] mt-1 text-gray-400 leading-tight">{opt.desc}</p>
                                            </button>
                                        ))}
                                        </div>
                                    </div>

                                    {form.action_type !== 'none' && (
                                        <div className="pt-2">
                                            <label className="text-[13px] font-bold text-gray-600 mb-3 block">액션 강도</label>
                                            <div className="flex gap-3">
                                            {EFFECT_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => update('effect_intensity', opt.value)}
                                                    className={\`flex-1 py-3 rounded-xl border-2 text-center transition-all \${
                                                        form.effect_intensity === opt.value
                                                            ? 'border-primary bg-orange-50 text-primary ring-1 ring-primary/30'
                                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }\`}
                                                >
                                                    <p className="font-black text-[14px]">{opt.label}</p>
                                                    <p className="text-[11px] mt-1 text-gray-400">{opt.desc}</p>
                                                </button>
                                            ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4 flex justify-end">
                                        <button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
                                            확인
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeModal === 'color' && (
                            <div>
                                <h3 className="font-black text-[18px] text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="text-[20px]">🎨</span>
                                    배너 배경색 설정
                                </h3>
                                
                                <div className="space-y-6">
                                    {/* 색상 선택 */}
                                    <div>
                                        <label className="text-[13px] font-bold text-gray-600 mb-3 block">색상 선택</label>
                                        <div className="flex gap-3 flex-wrap">
                                            {COLOR_PALETTE.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => update('color', color)}
                                                    className={\`w-12 h-12 rounded-full transition-all \${form.color === color ? 'ring-4 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}\`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* 배경 투명도 선택 */}
                                    <div className="pt-4">
                                        <label className="text-[13px] font-bold text-gray-600 mb-3 flex justify-between">
                                            <span>배경 투명도 (적용 농도)</span>
                                            <span className="text-blue-600 font-black text-[15px]">{form.bg_opacity || '10'}%</span>
                                        </label>
                                        <div className="flex items-center gap-4 py-2 px-1">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                step="1"
                                                value={form.bg_opacity || '10'} 
                                                onChange={(e) => update('bg_opacity', e.target.value)}
                                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-gray-400 font-medium px-1 mt-2">
                                            <span>투명함 (0%)</span>
                                            <span>진하게 (100%)</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button type="button" onClick={() => setActiveModal(null)} className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
                                            확인
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
`;

// Insert dialogsBlock before the final closing </div> of the component.
// Actually, it's easier to insert it right before the manual entry dialog.
code = code.replace(/<Dialog open=\{isManualEntryOpen\}/, dialogsBlock + '\n\n            <Dialog open={isManualEntryOpen}');

fs.writeFileSync('components/biz/AdEditorForm.tsx', code);
console.log('AdEditorForm successfully transformed!');
