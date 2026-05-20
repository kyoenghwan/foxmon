/** 이력서 SNS — UI 행과 DB `sns_links` / 레거시 `sns_type`·`sns_id` 매핑 */

export const RESUME_SNS_PRESETS = ['카카오톡', '라인', '텔레그램', '인스타그램'] as const;

export type ResumeSnsFormRow = { type: string; value: string };

export function isResumeSnsPreset(type: string): boolean {
  return (RESUME_SNS_PRESETS as readonly string[]).includes(type);
}

/** 셀렉트 박스에 표시할 값 (프리셋이 아니면 "기타") */
export function resumeSnsSelectValue(type: string): string {
  if (!type) return '';
  if (isResumeSnsPreset(type)) return type;
  return '기타';
}

export function resumeToSnsRows(resume: {
  sns_links?: unknown;
  sns_type?: string;
  sns_id?: string;
}): ResumeSnsFormRow[] {
  const raw = resume.sns_links;
  if (Array.isArray(raw) && raw.length > 0) {
    const rows = raw
      .map((x: Record<string, unknown>) => ({
        type: String(x?.type ?? x?.channel ?? '').trim(),
        value: String(x?.value ?? x?.account ?? x?.sns_id ?? '').trim(),
      }))
      .filter((r) => r.type || r.value);
    if (rows.length > 0) return rows;
  }
  if (resume.sns_type || resume.sns_id) {
    return [
      {
        type: (resume.sns_type || '').trim(),
        value: (resume.sns_id || '').trim(),
      },
    ];
  }
  return [{ type: '', value: '' }];
}

/** 저장 시: 종류·아이디 모두 있는 행만 */
export function sanitizeResumeSnsRows(rows: ResumeSnsFormRow[]): { type: string; value: string }[] {
  return rows
    .map((r) => ({ type: r.type.trim(), value: r.value.trim() }))
    .filter((r) => r.type && r.value);
}

const MAX_SNS_ROWS = 10;

export function appendEmptySnsRow(rows: ResumeSnsFormRow[]): ResumeSnsFormRow[] | null {
  if (rows.length >= MAX_SNS_ROWS) return null;
  return [...rows, { type: '', value: '' }];
}

/** sns_links + 첫 항목을 레거시 컬럼에도 기록 (기존 조회·화면 호환) */
export function buildResumeSnsPayload(rows: ResumeSnsFormRow[]): {
  sns_links: { type: string; value: string }[];
  sns_type?: string;
  sns_id?: string;
} {
  const cleaned = sanitizeResumeSnsRows(rows);
  const first = cleaned[0];
  return {
    sns_links: cleaned,
    sns_type: first?.type ?? '',
    sns_id: first?.value ?? '',
  };
}
