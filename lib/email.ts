import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@foxmon.co.kr';

/**
 * 아이디 찾기 결과 이메일 발송 (마스킹된 아이디)
 */
export async function sendFindIdEmail(
  toEmail: string,
  userName: string,
  maskedIds: Array<{ masked_id: string; created_at: string }>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const idList = maskedIds
      .map(item => {
        const date = new Date(item.created_at).toLocaleDateString('ko-KR');
        return `• ${item.masked_id} (가입일: ${date})`;
      })
      .join('\n');

    const { error } = await getResend().emails.send({
      from: `FOXMON <${FROM_EMAIL}>`,
      to: toEmail,
      subject: '[FOXMON] 아이디 찾기 결과',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:'Pretendard',sans-serif;padding:32px;">
          <h2 style="color:#7c3aed;margin-bottom:8px;">FOXMON 아이디 찾기</h2>
          <p style="color:#666;font-size:14px;margin-bottom:24px;">
            <strong>${userName}</strong>님의 가입된 아이디입니다.
          </p>
          <div style="background:#f5f3ff;border:1px solid #e9e5ff;border-radius:12px;padding:20px;margin-bottom:24px;">
            <pre style="margin:0;font-size:14px;color:#333;line-height:1.8;">${idList}</pre>
          </div>
          <p style="color:#999;font-size:12px;">
            본인이 요청하지 않은 경우, 이 메일을 무시하세요.
          </p>
        </div>
      `,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * 비밀번호 재설정 링크 이메일 발송
 */
export async function sendResetPasswordEmail(
  toEmail: string,
  userName: string,
  resetUrl: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await getResend().emails.send({
      from: `FOXMON <${FROM_EMAIL}>`,
      to: toEmail,
      subject: '[FOXMON] 비밀번호 재설정',
      html: `
        <div style="max-width:480px;margin:0 auto;font-family:'Pretendard',sans-serif;padding:32px;">
          <h2 style="color:#7c3aed;margin-bottom:8px;">FOXMON 비밀번호 재설정</h2>
          <p style="color:#666;font-size:14px;margin-bottom:24px;">
            <strong>${userName}</strong>님, 아래 버튼을 클릭하여 비밀번호를 재설정하세요.<br/>
            이 링크는 <strong>15분간</strong> 유효합니다.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;">
              비밀번호 재설정하기
            </a>
          </div>
          <p style="color:#999;font-size:12px;">
            버튼이 작동하지 않으면 아래 링크를 복사해서 브라우저에 붙여넣으세요:<br/>
            <a href="${resetUrl}" style="color:#7c3aed;word-break:break-all;">${resetUrl}</a>
          </p>
          <p style="color:#999;font-size:12px;margin-top:24px;">
            본인이 요청하지 않은 경우, 이 메일을 무시하세요. 비밀번호는 변경되지 않습니다.
          </p>
        </div>
      `,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
