export const BAD_WORDS_LIST = [
  // 성매매 및 조건만남 관련
  "성매매", "조건만남", "조건 만남", "스폰", "스폰서", "애인대행", "원나잇", "투잡(성적", "2차", "티켓다방",
  // 불법 업소 및 은어
  "오피", "오피스텔", "안마방", "안마", "휴게텔", "키스방", "립카페", "핸플", "대딸", "건마", 
  "풀싸롱", "하드코어", "페티쉬", "스와핑",
  // 청소년 유해 및 범죄
  "마약", "대포통장", "보이스피싱", "불법도박", "도박", "꽁머니", "토토", "사설토토"
];

/**
 * 텍스트 내에 금지어가 포함되어 있는지 확인합니다. (게시글 차단용)
 * @param text 검사할 텍스트
 * @returns { hasBadWord: boolean, word?: string } 포함 여부와 발견된 첫 번째 금지어
 */
export function checkBadWords(text: string): { hasBadWord: boolean; word?: string } {
  if (!text) return { hasBadWord: false };
  
  // 공백 및 특수문자를 제거하여 우회(예: 성 매 매, 성!매@매) 검사할 수도 있으나,
  // 현재는 가장 단순하고 확실한 포함(includes) 검사만 수행.
  const normalizedText = text.replace(/[\s~!@#$%^&*()_+|<>?:{}]/g, "");

  for (const word of BAD_WORDS_LIST) {
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
export function maskBadWords(text: string): string {
  if (!text) return text;

  let maskedText = text;
  for (const word of BAD_WORDS_LIST) {
    // 단어 길이만큼 * 생성 (예: 성매매 -> ***)
    const asterisk = "*".repeat(word.length);
    // 대소문자 구분 없이 전역 치환 (RegExp 사용 시 정규식 특수문자 이스케이프 주의)
    // 금지어 사전에 정규식 특수문자가 없다고 가정
    const regex = new RegExp(word, "g");
    maskedText = maskedText.replace(regex, asterisk);
  }

  return maskedText;
}
