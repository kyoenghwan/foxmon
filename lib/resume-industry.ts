/** 희망 업종 — DB에는 콤마 구분 문자열, 폼에서는 배열로 사용 */
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
