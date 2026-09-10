const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("▶️ execute_sql RPC를 사용하여 FAQ 추가 시도...");

  const answerContent = `여우몬 서비스 내 광고 등록 절차를 안내해 드립니다.

**1. 비즈니스 회원(업체 권한) 전환 및 1차 인증**
- 마이페이지에서 국세청 홈택스 실시간 연동을 통한 사업자 번호 인증(1차 인증)을 진행해주셔야 합니다.

**2. 2차 이미지 서류 검수 신청**
- 프리미엄 광고 집행을 위해서는 사업자등록증 이미지 서류를 추가 업로드하여 관리자의 2차 승인이 완료되어야 결제 및 집행이 가능합니다.

**3. 포인트 충전**
- 광고 집행(프리미엄, 스페셜 등)에는 전용 포인트가 사용됩니다. 
- [업체관리 > 포인트 관리] 메뉴에서 무통장 입금 신청을 해주시면 관리자 확인 즉시 영업일 기준 1일 이내에 포인트가 지급됩니다.

**4. 광고 등록 에디터 실행**
- 메인 화면 우측 상단 [업체관리] > [광고/배너 관리] 탭으로 이동하여 원하는 광고 상품(프리미엄 메인, 사이드 배너 등)을 선택한 후 에디터를 통해 문구와 배너 이미지를 등록합니다.
- 결제하기 버튼을 누르면 보유한 포인트가 차감되며 심사 후 광고 게재가 시작됩니다.`;

  // SQL 이스케이프 처리
  const escapedAnswer = answerContent.replace(/'/g, "''");

  const sql = `
    INSERT INTO public.faqs (category_id, category, question, answer, answer_format, sort_order, is_active, target_role)
    VALUES (
      '1c773cd2-de4a-4fa2-982a-c8cb96b8fccf', 
      '광고 문의', 
      '[업체 전용] 광고 등록은 어떻게 하나요?', 
      '${escapedAnswer}', 
      'markdown', 
      12, 
      true, 
      'EMPLOYER'
    );
  `;

  try {
    const { data, error } = await supabase.rpc('execute_sql', { sql });
    if (error) {
      console.error("❌ SQL 실행 에러:", error);
    } else {
      console.log("🎉 성공적으로 광고 등록 FAQ 글이 삽입되었습니다! 결과:", data || "OK");
    }
  } catch (err) {
    console.error("❌ 예외 발생:", err);
  }
}

run();
