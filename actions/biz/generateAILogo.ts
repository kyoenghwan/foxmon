"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/auth";
import OpenAI from "openai";

export async function generateAILogo(companyName: string) {
    if (!companyName) {
        return { success: false, error: "업체명을 입력해주세요." };
    }

    // 1. 유저 인증
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "로그인이 필요합니다." };
    }
    const userId = session.user.id;

    const supabase = supabaseAdmin;

    // 2. 유저 정보 (무료 횟수 및 포인트) 조회
    const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('free_ai_logos_remaining, paid_points, bonus_points')
        .eq('id', userId)
        .single();

    if (userError || !userRecord) {
        return { success: false, error: "사용자 정보를 조회할 수 없습니다." };
    }

    const freeCount = userRecord.free_ai_logos_remaining || 0;
    const requiredPoints = 100;

    let isUsingFree = freeCount > 0;

    if (!isUsingFree) {
        const totalPoints = (userRecord.paid_points || 0) + (userRecord.bonus_points || 0);
        if (totalPoints < requiredPoints) {
            return { success: false, error: `포인트가 부족합니다. (필요: ${requiredPoints}P)` };
        }
    }

    // 3. 관리자 설정에서 OpenAI API Key 조회
    const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('key_value')
        .eq('key_name', 'openai_api_key')
        .single();

    if (settingsError || !settingsData || !settingsData.key_value) {
        return { success: false, error: "시스템 환경설정 오류: API 키가 등록되지 않았습니다." };
    }

    const apiKey = settingsData.key_value;

    try {
        // 4. OpenAI 호출
        const openai = new OpenAI({ apiKey });

        const prompt = `Create a spectacular, high-impact typographical logo centered entirely around the exact text "${companyName}". 
The text "${companyName}" MUST be written out explicitly, large, bold, and highly legible as the absolute centerpiece of the image. 
Style: A flashy, vibrant, modern, premium nightclub, luxury brand, or esports team aesthetic. 
Use rich, bright neon colors, 3D text effects, glossy gradients, or metallic textures. 
The background should be either completely clean, dark and sleek, or have explosive colorful energy that complements the text but doesn't obscure it. 
No abstract symbols unless they directly decorate the main text. Ensure the exact spelling "${companyName}" is featured perfectly.`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
        });

        const b64Data = response.data[0].b64_json;
        if (!b64Data) {
            return { success: false, error: "이미지 생성 실패" };
        }

        const imageUrl = `data:image/png;base64,${b64Data}`;

        // 5. 차감 로직 수행 (생성 성공 시에만)
        if (isUsingFree) {
            // 무료 횟수 차감
            const { error: updateError } = await supabase
                .from('users')
                .update({ free_ai_logos_remaining: freeCount - 1 })
                .eq('id', userId);
            
            if (updateError) {
                console.error("무료 횟수 차감 실패:", updateError);
            }
        } else {
            // 포인트 100P 차감 
            let newBonus = userRecord.bonus_points || 0;
            let newPaid = userRecord.paid_points || 0;

            if (newBonus >= requiredPoints) {
                newBonus -= requiredPoints;
            } else {
                const remainingToDeduct = requiredPoints - newBonus;
                newBonus = 0;
                newPaid -= remainingToDeduct;
            }

            const { error: deductError } = await supabase
                .from('users')
                .update({ 
                    bonus_points: newBonus,
                    paid_points: newPaid
                })
                .eq('id', userId);

            if (deductError) {
                console.error("포인트 차감 업데이트 실패:", deductError);
            } else {
                // 로그 기록
                await supabase.from('point_transactions').insert({
                    user_id: userId,
                    type: 'SPEND',
                    amount: requiredPoints,
                    balance_after: newBonus + newPaid,
                    description: '✨ AI 로고 생성'
                });
            }
        }

        // 성공 응답 (수정된 잔여 정보 포함)
        return { 
            success: true, 
            data: imageUrl,
            usedFree: isUsingFree,
            remainingFree: isUsingFree ? freeCount - 1 : 0
        };

    } catch (err: any) {
        console.error("OpenAI API 에러:", err);
        return { success: false, error: err.message || "AI 연결 중 오류가 발생했습니다." };
    }
}
