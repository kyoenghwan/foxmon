import { NextResponse } from 'next/server';
import { FA_REGISTER_FLOW } from '@/src/atoms/fa/auth/FA_REGISTER_FLOW';
import { nvLog } from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        nvLog('FW', '회원가입 요청 API 진입', { loginId: body.loginId, role: body.role });

        // Execute the atomic registration flow (handles Validation, Duplicate Checking, Hash, and DB Insert)
        const result = await FA_REGISTER_FLOW({
            loginId: body.loginId,
            password: body.password,
            email: body.email,
            name: body.name,
            nickname: body.nickname,
            role: body.role,
            birthDate: body.birthDate,
            gender: body.gender,
            phoneNumber: body.phoneNumber,
            nationality: body.nationality,
            is_age_verified: body.is_age_verified || false,
            smsConsent: body.smsConsent || false,
            business_name: body.business_name,
            representative_name: body.representative_name,
            business_number: body.business_number,
            business_category: body.business_category,
            opening_date: body.opening_date
        });

        if (!result.success) {
            nvLog('FW', '회원가입 정책/로직 거부', { message: result.message });
            return NextResponse.json(
                { success: false, message: result.message },
                { status: 400 }
            );
        }

        nvLog('FW', '회원가입 성공 응답 반환', { loginId: body.loginId });
        return NextResponse.json(
            { success: true, message: result.message },
            { status: 201 }
        );

    } catch (error: any) {
        nvLog('FW', '회원가입 API 서버 내부 오류', error.message);
        return NextResponse.json(
            { success: false, message: '서버 내부 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
