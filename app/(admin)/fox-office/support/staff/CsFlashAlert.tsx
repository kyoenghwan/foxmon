'use client';

import { useEffect } from 'react';

interface CsFlashAlertProps {
  message: string;
}

export default function CsFlashAlert({ message }: CsFlashAlertProps) {
  useEffect(() => {
    if (message) {
      // 전역 GlobalAlertProvider가 가로채서 고품격 모달로 띄워줍니다.
      window.alert(message);
      
      // 주소창에서 msg 쿼리 스트링을 정제하여 새로고침 시 계속 뜨지 않도록 처리
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('msg');
        url.searchParams.delete('type');
        window.history.replaceState({}, '', url.pathname + url.search);
      } catch (e) {
        console.error(e);
      }
    }
  }, [message]);

  return null;
}
