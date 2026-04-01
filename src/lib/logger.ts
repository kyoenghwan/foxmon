/**
 * Standard Logger for Functional Atomic Design System
 */
export const nvLog = (type: 'FW' | 'AT', message: string, data?: any) => {
  const prefix = type === 'FW' ? '🖼️ [FRAMEWORK]' : '⚛️ [ATOM]';
  const time = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${time}] ${prefix} ${message}`, data || '');
};
