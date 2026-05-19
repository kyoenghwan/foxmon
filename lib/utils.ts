import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskName(name: string) {
    if (!name || name === '익명') return '익명';
    if (name.length <= 2) return name.substring(0, 1) + '*';
    if (name.length === 3) return name.substring(0, 1) + '*' + name.substring(2);
    // 4글자 이상: 앞 2글자만 노출하고 나머지는 *
    return name.substring(0, 2) + '*'.repeat(name.length - 2);
}
