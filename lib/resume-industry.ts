import type { CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';

/** 희망 업종 — DB에는 콤마 구분 문자열, 폼에서는 배열로 사용 */

/** CATEGORY_1 + CATEGORY_2를 1차/2차 구분 없이 하나의 선택 목록으로 합침 */
export function buildFlatIndustryOptions(
  category1: CodeItem[],
  category2: CodeItem[]
): CodeItem[] {
  const active1 = [...category1]
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const parentOrder = new Map(active1.map((c, i) => [c.code_value, i]));

  const active2 = [...category2]
    .filter((c) => c.is_active)
    .sort((a, b) => {
      const pa = parentOrder.get(a.parent_code_value ?? '') ?? 999;
      const pb = parentOrder.get(b.parent_code_value ?? '') ?? 999;
      if (pa !== pb) return pa - pb;
      return a.sort_order - b.sort_order;
    });

  return [...active1, ...active2];
}

export function parseDesiredIndustries(value?: string | string[] | null): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function formatDesiredIndustries(industries?: string[]): string {
  if (!industries?.length) return '';
  return industries.join(', ');
}

export function isDesiredIndustrySelected(
  industries: string[] | undefined,
  codeValue: string,
  codeName: string
): boolean {
  return (industries || []).some((v) => v === codeValue || v === codeName);
}

export function resumeMatchesIndustryFilter(
  desiredIndustry: string | undefined | null,
  industryName: string
): boolean {
  const list = parseDesiredIndustries(desiredIndustry ?? undefined);
  return list.some((v) => v === industryName);
}
