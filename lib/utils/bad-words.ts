import { QA_GET_COMMON_CODES } from '@/src/atoms/qa/master/QA_GET_COMMON_CODES';

// 인메모리 캐시 (서버 비용 최적화)
let cachedBadWords: string[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1분

/**
 * DB에서 금지어 목록을 동적으로 가져옵니다 (1분 캐싱).
 */
export async function getBadWordsList(): Promise<string[]> {
  const now = Date.now();
  if (cachedBadWords.length > 0 && (now - cacheTimestamp < CACHE_TTL_MS)) {
    return cachedBadWords;
  }

  // DB에서 BAD_WORDS 그룹의 활성 코드 목록을 가져옵니다
  const res = await QA_GET_COMMON_CODES('BAD_WORDS', true);
  if (res.success && res.data) {
    cachedBadWords = res.data.map(code => code.code_value);
    cacheTimestamp = now;
  }
  return cachedBadWords;
}

/**
 * 텍스트 내에 금지어가 포함되어 있는지 확인합니다. (게시글 차단용)
 * @param text 검사할 텍스트
 * @returns { hasBadWord: boolean, word?: string } 포함 여부와 발견된 첫 번째 금지어
 */
export async function checkBadWords(text: string): Promise<{ hasBadWord: boolean; word?: string }> {
  if (!text) return { hasBadWord: false };
  
  const badWords = await getBadWordsList();
  if (badWords.length === 0) return { hasBadWord: false };

  const normalizedText = text.replace(/[\s~!@#$%^&*()_+|<>?:{}]/g, "");

  for (const word of badWords) {
    if (text.includes(word) || normalizedText.includes(word)) {
      return { hasBadWord: true, word };
    }
  }

  return { hasBadWord: false };
}

/**
 * 텍스트 내의 금지어를 '***'로 마스킹합니다. (채팅용)
 * @param text 마스킹할 원본 텍스트
 * @returns 마스킹이 완료된 텍스트
 */
export async function maskBadWords(text: string): Promise<string> {
  if (!text) return text;

  const badWords = await getBadWordsList();
  if (badWords.length === 0) return text;

  let maskedText = text;
  for (const word of badWords) {
    const asterisk = "*".repeat(word.length);
    // 정규식 특수문자 이스케이프 처리
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedWord, "gi");
    maskedText = maskedText.replace(regex, asterisk);
  }

  return maskedText;
}

