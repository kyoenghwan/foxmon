import { NextResponse } from 'next/server';
import { nvLog } from '@/lib/logger';

export async function POST(req: Request) {
  const trace: string[] = [];
  try {
    // 1. raw 텍스트로 바디 전체를 안전하게 읽어옵니다.
    const rawText = await req.text();
    nvLog('FW', `KMC Callback 수신 - rawText 길이: ${rawText.length}`);
    trace.push(`[CALLBACK] 수신된 rawText: ${rawText.substring(0, 100)}...`);

    let dataString = '';

    // 2. data= 접두사 파싱 처리
    if (rawText.startsWith('data=')) {
      dataString = rawText.substring(5); // 'data=' 이후 부분 추출
    } else {
      // data=로 시작하지 않는 경우, 전체 텍스트가 데이터일 가능성도 고려하여 폴백 처리
      dataString = rawText;
    }

    if (!dataString) {
      nvLog('FW', '❌ KMC Callback - data 파라미터 없음');
      return NextResponse.json({ success: false, error: 'Missing data parameter', trace }, { status: 400 });
    }

    let encryptMOKKeyToken = '';

    // 3. 이중 URL 디코딩 및 JSON 파싱 시도
    try {
      // 3-1. 1차 디코딩
      const firstDecoded = decodeURIComponent(dataString);
      trace.push(`[CALLBACK] 1차 디코딩 완료: ${firstDecoded.substring(0, 100)}...`);

      // 3-2. 2차 디코딩
      const secondDecoded = decodeURIComponent(firstDecoded);
      trace.push(`[CALLBACK] 2차 디코딩 완료: ${secondDecoded.substring(0, 100)}...`);

      // 3-3. JSON 파싱
      const resultObj = JSON.parse(secondDecoded);
      encryptMOKKeyToken = resultObj.encryptMOKKeyToken || '';
    } catch (e: any) {
      nvLog('FW', `⚠️ KMC Callback - 이중 디코딩 및 파싱 실패: ${e.message}. 단일 디코딩 파싱 및 일반 파싱으로 폴백을 시도합니다.`);
      trace.push(`[CALLBACK] 이중 디코딩 실패: ${e.message}`);

      // 폴백 1: 단일 디코딩 파싱 시도
      try {
        const decoded = decodeURIComponent(dataString);
        const resultObj = JSON.parse(decoded);
        encryptMOKKeyToken = resultObj.encryptMOKKeyToken || '';
      } catch (err1: any) {
        // 폴백 2: 디코딩 없이 직접 JSON 파싱 시도
        try {
          const resultObj = JSON.parse(dataString);
          encryptMOKKeyToken = resultObj.encryptMOKKeyToken || '';
        } catch (err2: any) {
          nvLog('FW', '❌ KMC Callback - 모든 데이터 파싱 실패');
          return NextResponse.json({ success: false, error: 'Failed to parse data parameter', trace }, { status: 400 });
        }
      }
    }

    if (!encryptMOKKeyToken) {
      nvLog('FW', '❌ KMC Callback - encryptMOKKeyToken 추출 실패');
      return NextResponse.json({ success: false, error: 'encryptMOKKeyToken is missing in response', trace }, { status: 400 });
    }

    nvLog('FW', `✅ KMC Callback 성공 - encryptMOKKeyToken 획득: ${encryptMOKKeyToken.substring(0, 15)}...`);
    
    return NextResponse.json({
      success: true,
      encryptMOKKeyToken
    });

  } catch (error: any) {
    nvLog('FW', `❌ KMC Callback 에러: ${error.message}`);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const encryptMOKKeyToken = searchParams.get('encryptMOKKeyToken');

    if (!encryptMOKKeyToken) {
      return NextResponse.json({ success: false, error: 'Missing encryptMOKKeyToken in query string' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      encryptMOKKeyToken
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
