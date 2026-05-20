import type { CodeItem } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';

/** 이력서·구인에서 쓰는 태그 마스터 (통합 전 AMENITY + KEYWORD) */
export const TAG_LIST_TYPES = ['KEYWORD', 'AMENITY'] as const;

/** KEYWORD + AMENITY를 하나의 선택 목록으로 합침 (이름·코드값 중복 제거) */
export function buildUnifiedTagOptions(codes: CodeItem[]): CodeItem[] {
  const items = codes
    .filter(
      (c) =>
        TAG_LIST_TYPES.includes(c.list_type as (typeof TAG_LIST_TYPES)[number]) &&
        c.is_active
    )
    .sort((a, b) => {
      const typeOrder = a.list_type === 'KEYWORD' ? 0 : 1;
      const typeOrderB = b.list_type === 'KEYWORD' ? 0 : 1;
      if (typeOrder !== typeOrderB) return typeOrder - typeOrderB;
      return a.sort_order - b.sort_order;
    });

  const seenNames = new Set<string>();
  const seenValues = new Set<string>();
  const result: CodeItem[] = [];

  for (const item of items) {
    if (seenValues.has(item.code_value)) continue;
    if (seenNames.has(item.code_name)) continue;
    seenNames.add(item.code_name);
    seenValues.add(item.code_value);
    result.push(item);
  }
  return result;
}

export function mergeSelectedTagCodes(
  keywords?: string[] | null,
  amenities?: string[] | null
): string[] {
  return [...new Set([...(keywords ?? []), ...(amenities ?? [])])];
}

export function isTagSelected(
  selected: string[] | undefined,
  item: Pick<CodeItem, 'code_value' | 'code_name'>
): boolean {
  return (selected ?? []).some((v) => v === item.code_value || v === item.code_name);
}

export function resolveTagName(codeOrName: string, options: CodeItem[]): string {
  const match = options.find(
    (c) =>
      TAG_LIST_TYPES.includes(c.list_type as (typeof TAG_LIST_TYPES)[number]) &&
      (c.code_value === codeOrName || c.code_name === codeOrName)
  );
  return match?.code_name ?? codeOrName;
}

export function resolveTagNames(codes: string[], options: CodeItem[]): string[] {
  return codes.map((c) => resolveTagName(c, options));
}
