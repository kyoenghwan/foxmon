/** 근무 지역 — DB에는 콤마 구분 문자열 (예: "서울 강남구, 서울 서초구") */

export const MAX_DESIRED_SIGUNGU = 3;

export function parseDesiredLocations(value?: string | null): {
  sido: string;
  sigungus: string[];
} {
  if (!value?.trim()) return { sido: '', sigungus: [] };

  const trimmed = value.trim();
  if (trimmed === '해외' || trimmed.startsWith('해외 ')) {
    const detail = trimmed === '해외' ? '' : trimmed.slice('해외'.length).trim();
    return { sido: '해외', sigungus: detail ? [detail] : [] };
  }

  const segments = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return { sido: '', sigungus: [] };

  const firstTokens = segments[0].split(/\s+/).filter(Boolean);
  const sido = firstTokens[0] ?? '';
  const sigungus: string[] = [];

  for (const seg of segments) {
    if (seg === sido) continue;
    if (seg.startsWith(`${sido} `)) {
      const sg = seg.slice(sido.length).trim();
      if (sg) sigungus.push(sg);
    } else {
      const tokens = seg.split(/\s+/).filter(Boolean);
      if (tokens.length > 1 && tokens[0] === sido) {
        sigungus.push(tokens.slice(1).join(' '));
      }
    }
  }

  return {
    sido,
    sigungus: [...new Set(sigungus)].slice(0, MAX_DESIRED_SIGUNGU),
  };
}

export function formatDesiredLocations(sido: string, sigungus: string[]): string {
  if (!sido) return '';
  if (sido === '해외') {
    const detail = sigungus[0]?.trim();
    return detail ? `해외 ${detail}` : '해외';
  }
  const normalized = [...new Set(sigungus.map((s) => s.trim()).filter(Boolean))].slice(
    0,
    MAX_DESIRED_SIGUNGU
  );
  if (normalized.length === 0) return sido;
  return normalized.map((sg) => `${sido} ${sg}`.trim()).join(', ');
}

export function normalizeDesiredLocation(value?: string | null): string {
  const { sido, sigungus } = parseDesiredLocations(value);
  return formatDesiredLocations(sido, sigungus);
}

export function isSigunguSelected(sigungus: string[], name: string): boolean {
  return sigungus.includes(name);
}
