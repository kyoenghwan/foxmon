/** 고객센터 메신저 검색 필터 */

export type CsRoomSearchFilters = {
  loginId?: string;
  dateFrom?: string;
  dateTo?: string;
  content?: string;
};

/** date input(YYYY-MM-DD) → ISO bounds (KST 기준 일 단위) */
export function csDateRangeToIso(filters: CsRoomSearchFilters): {
  fromIso?: string;
  toIso?: string;
} {
  const from = filters.dateFrom?.trim();
  const to = filters.dateTo?.trim();
  return {
    fromIso: from ? `${from}T00:00:00+09:00` : undefined,
    toIso: to ? `${to}T23:59:59.999+09:00` : undefined,
  };
}

export function hasActiveCsSearch(filters?: CsRoomSearchFilters): boolean {
  if (!filters) return false;
  return !!(
    filters.loginId?.trim() ||
    filters.dateFrom?.trim() ||
    filters.dateTo?.trim() ||
    filters.content?.trim()
  );
}
