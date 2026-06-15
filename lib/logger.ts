/**
 * Standard Logger for Functional Atomic Design System
 */
const ENABLE_LOGS = process.env.NEXT_PUBLIC_ENABLE_LOGS !== 'false';

if (ENABLE_LOGS) {
  console.log('⚛️ [SYSTEM] Logger Initialized');
}

export const nvLog = (type: 'FW' | 'AT', message: string, data?: any) => {
  if (!ENABLE_LOGS) return;
  const prefix = type === 'FW' ? '🖼️ [FRAMEWORK]' : '⚛️ [ATOM]';
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${time}] ${prefix} ${message}`, data || '');
};
