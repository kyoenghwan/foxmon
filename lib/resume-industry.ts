import type { CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';

/** 희망 업종 — DB에는 콤마 구분 문자열, 폼에서는 배열로 사용 */
export const MAX_DESIRED_INDUSTRIES = 3;
export const OTHER_INDUSTRY_CODE = 'CAT1_OTHER';
export const OTHER_INDUSTRY_LABEL = '기타';

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
  return industries.slice(0, MAX_DESIRED_INDUSTRIES).join(', ');
}

export function normalizeDesiredIndustries(
  industries?: string | string[] | null
): string[] {
  return parseDesiredIndustries(industries).slice(0, MAX_DESIRED_INDUSTRIES);
}

export function isDesiredIndustrySelected(
  industries: string[] | undefined,
  codeValue: string,
  codeName: string
): boolean {
  return (industries || []).some((v) => v === codeValue || v === codeName);
}

function resumeHasIndustryToken(
  resumeIndustries: string[],
  token: string
): boolean {
  return resumeIndustries.some((v) => v === token);
}

/** 업종 필터: 이력서에 저장된 업종(최대 3개)과 검색 업종·상하위 업종 매칭 */
export function getCustomOtherIndustry(
  industries: string[] | undefined,
  options: { code_value: string; code_name: string }[]
): string {
  const known = new Set(
    options.flatMap((o) => [o.code_value, o.code_name, OTHER_INDUSTRY_LABEL, OTHER_INDUSTRY_CODE])
  );
  return (industries || []).find((i) => !known.has(i)) ?? '';
}

export function isOtherIndustryChecked(
  industries: string[] | undefined,
  options: { code_value: string; code_name: string }[]
): boolean {
  if (!industries?.length) return false;
  if (
    industries.some((i) => i === OTHER_INDUSTRY_LABEL || i === OTHER_INDUSTRY_CODE)
  ) {
    return true;
  }
  return !!getCustomOtherIndustry(industries, options);
}

export function applyOtherIndustryText(
  industries: string[],
  otherText: string,
  options: { code_value: string; code_name: string }[]
): string[] {
  const custom = getCustomOtherIndustry(industries, options);
  const withoutOther = industries.filter((i) => {
    if (i === OTHER_INDUSTRY_LABEL || i === OTHER_INDUSTRY_CODE) return false;
    return i !== custom;
  });
  const trimmed = otherText.trim();
  if (!trimmed) {
    return [...withoutOther, OTHER_INDUSTRY_LABEL];
  }
  return [...withoutOther, trimmed];
}

export function resumeMatchesIndustryFilter(
  desiredIndustry: string | undefined | null,
  filterName: string,
  filterCodeValue?: string,
  allOptions?: CodeItem[]
): boolean {
  const resumeIndustries = parseDesiredIndustries(desiredIndustry ?? undefined);
  if (resumeIndustries.length === 0) return false;

  if (
    resumeHasIndustryToken(resumeIndustries, filterName) ||
    (filterCodeValue && resumeHasIndustryToken(resumeIndustries, filterCodeValue))
  ) {
    return true;
  }

  if (!allOptions?.length || !filterCodeValue) return false;

  const filterItem = allOptions.find(
    (o) => o.code_value === filterCodeValue || o.code_name === filterName
  );
  if (!filterItem) return false;

  // 1차 업종으로 검색 시 → 해당 2차 업종을 선택한 이력서도 포함
  const childTokens = allOptions
    .filter((o) => o.parent_code_value === filterItem.code_value)
    .flatMap((c) => [c.code_name, c.code_value]);
  if (childTokens.some((t) => resumeHasIndustryToken(resumeIndustries, t))) {
    return true;
  }

  // 2차 업종으로 검색 시 → 상위 1차를 선택한 이력서도 포함
  if (filterItem.parent_code_value) {
    const parent = allOptions.find((o) => o.code_value === filterItem.parent_code_value);
    if (
      parent &&
      (resumeHasIndustryToken(resumeIndustries, parent.code_name) ||
        resumeHasIndustryToken(resumeIndustries, parent.code_value))
    ) {
      return true;
    }
  }

  return false;
}
