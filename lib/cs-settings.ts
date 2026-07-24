/** 고객센터 site_settings 키 및 업무시간·자동응답 파싱 */

export const CS_SETTING_KEYS = [
  'cs_hours_start',
  'cs_hours_end',
  'cs_hours_days',
  'cs_timezone',
  'cs_msg_in_hours',
  'cs_msg_after_hours',
  'cs_automation_enabled',
  'cs_automation_rules',
] as const;

export type CsSettings = {
  hoursStart: string;
  hoursEnd: string;
  /** 0=일 … 6=토 */
  days: number[];
  timezone: string;
  messageInHours: string;
  messageAfterHours: string;
  automationEnabled: boolean;
  automationRulesJson: string;
};

export const DEFAULT_CS_SETTINGS: CsSettings = {
  hoursStart: '09:00',
  hoursEnd: '18:00',
  days: [1, 2, 3, 4, 5],
  timezone: 'Asia/Seoul',
  messageInHours:
    '문의해 주셔서 감사합니다. 담당자가 확인 후 순서대로 답변드리겠습니다. 잠시만 기다려 주세요.',
  messageAfterHours:
    '안녕하세요. 폭스몬 고객센터입니다. 업무시간 외에는 실시간 응대가 어려우니 1:1 문의를 남겨주시면 확인하는 대로 신속히 처리해 드리겠습니다.',
  automationEnabled: false,
  automationRulesJson: '[]',
};

export function parseCsSettings(map?: Record<string, string | undefined> | null): CsSettings {
  const daysRaw = map?.cs_hours_days?.trim();
  const days = daysRaw
    ? daysRaw
        .split(',')
        .map((d) => parseInt(d.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
    : DEFAULT_CS_SETTINGS.days;

  return {
    hoursStart: map?.cs_hours_start?.trim() || DEFAULT_CS_SETTINGS.hoursStart,
    hoursEnd: map?.cs_hours_end?.trim() || DEFAULT_CS_SETTINGS.hoursEnd,
    days: days.length ? days : DEFAULT_CS_SETTINGS.days,
    timezone: map?.cs_timezone?.trim() || DEFAULT_CS_SETTINGS.timezone,
    messageInHours: map?.cs_msg_in_hours?.trim() || DEFAULT_CS_SETTINGS.messageInHours,
    messageAfterHours: map?.cs_msg_after_hours?.trim() || DEFAULT_CS_SETTINGS.messageAfterHours,
    automationEnabled: map?.cs_automation_enabled === 'true',
    automationRulesJson: map?.cs_automation_rules?.trim() || DEFAULT_CS_SETTINGS.automationRulesJson,
  };
}

export function csSettingsToPayload(settings: CsSettings): Record<string, string> {
  return {
    cs_hours_start: settings.hoursStart,
    cs_hours_end: settings.hoursEnd,
    cs_hours_days: settings.days.join(','),
    cs_timezone: settings.timezone,
    cs_msg_in_hours: settings.messageInHours,
    cs_msg_after_hours: settings.messageAfterHours,
    cs_automation_enabled: settings.automationEnabled ? 'true' : 'false',
    cs_automation_rules: settings.automationRulesJson || '[]',
  };
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function getZonedWeekdayAndMinutes(date: Date, timezone: string): { day: number; minutes: number } {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    day: dayMap[parts.weekday] ?? 0,
    minutes: parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10),
  };
}

/** 현재 시각이 설정된 업무 요일·시간 안인지 */
export function isWithinBusinessHours(
  settings: CsSettings,
  now: Date = new Date()
): boolean {
  const { day, minutes } = getZonedWeekdayAndMinutes(now, settings.timezone);
  if (!settings.days.includes(day)) return false;
  const start = parseHm(settings.hoursStart);
  const end = parseHm(settings.hoursEnd);
  if (start <= end) return minutes >= start && minutes < end;
  return minutes >= start || minutes < end;
}

export function businessHoursLabel(settings: CsSettings): string {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const days =
    settings.days.length === 7
      ? '매일'
      : settings.days.map((d) => dayNames[d]).join(', ');
  return `${days} ${settings.hoursStart}~${settings.hoursEnd} (${settings.timezone})`;
}
