import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'components/biz/AdEditorForm.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Bypass validation in handleSubmit
const targetVal1 = `        if (!form.company || !form.title || !selectedSido || !selectedSigungu || !form.pay_type) {
            return alert('필수 입력 항목(*)을 모두 입력해주세요.');
        }`;
const replacementVal1 = `        // PREMIUM_MAIN 등급 배너 '직접 업로드' 모드일 경우 필수 입력 조건 우회 처리
        if (form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'upload') {
            if (!form.company) update('company', '배너 업체');
            if (!form.title) update('title', '프리미엄 메인 배너');
            if (!selectedSido || !selectedSigungu) {
                update('job_region_1', '전지역');
                update('job_region_2', '전지역');
            }
            if (!form.pay_type) {
                update('pay_type', '협의');
                update('pay_amount', '0');
            }
        } else {
            if (!form.company || !form.title || !selectedSido || !selectedSigungu || !form.pay_type) {
                return alert('필수 입력 항목(*)을 모두 입력해주세요.');
            }
        }`;
content = content.replace(targetVal1, replacementVal1);


// 2. Change helper text
const targetText2 = `PNG/JPG 지원<br/>
                                            가로 형태(1.5:1 비율) 권장`;
const replacementText2 = `지원 포맷: JPG, PNG, GIF (움직이는 이미지 가능)<br/>
                                            가로 형태(1.5:1 비율) 권장`;
content = content.replace(targetText2, replacementText2);


// 3. Wrap setting buttons and accordion
const targetSettingsStart = `{/* 설정 버튼 그룹 */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">`;
const replacementSettingsStart = `{/* 설정 버튼 그룹 및 아코디언 (PREMIUM_MAIN 업로드 모드에서는 숨김) */}
                        {!(form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'upload') && (
                            <>
                                {/* 설정 버튼 그룹 */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">`;
content = content.replace(targetSettingsStart, replacementSettingsStart);

// To find where to close the <>, we look for the end of the basic modal.
// In the original file, it looks EXACTLY like this:
const targetSettingsEnd = `                                            {form.pay_type !== '협의' && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-500 font-medium">원</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}
                    </div>

                    {/* ③ 등급별 배너 디자인 설정 */}`;

const replacementSettingsEnd = `                                            {form.pay_type !== '협의' && (
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-500 font-medium">원</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        )}
                        </>
                    )}
                    </div>

                    {/* ③ 등급별 배너 디자인 설정 */}`;
content = content.replace(targetSettingsEnd, replacementSettingsEnd);


// 4. Change PREMIUM_MAIN template condition
const targetDesignCond = `{mode === 'AD' && form.tier === 'PREMIUM_MAIN' && (`;
const replacementDesignCond = `{mode === 'AD' && form.tier === 'PREMIUM_MAIN' && form.premium_banner_mode === 'template' && (`;
content = content.replace(targetDesignCond, replacementDesignCond);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored AdEditorForm.tsx');
