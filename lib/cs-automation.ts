export type CsAutomationRule = {
  keywords: string[];
  reply: string;
};

export function parseCsAutomationRules(json: string): CsAutomationRule[] {
  try {
    const parsed = JSON.parse(json || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        keywords: Array.isArray(row?.keywords)
          ? row.keywords.map((k: unknown) => String(k).trim()).filter(Boolean)
          : [],
        reply: String(row?.reply || '').trim(),
      }))
      .filter((r) => r.keywords.length > 0 && r.reply);
  } catch {
    return [];
  }
}

/** 고객 메시지에 키워드 규칙이 매칭되면 해당 자동 답변 반환 */
export function matchCsAutomationReply(
  customerContent: string,
  rules: CsAutomationRule[]
): string | null {
  const text = customerContent.trim().toLowerCase();
  if (!text || !rules.length) return null;

  for (const rule of rules) {
    const hit = rule.keywords.some((kw) => text.includes(kw.trim().toLowerCase()));
    if (hit) return rule.reply;
  }
  return null;
}
