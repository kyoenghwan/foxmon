'use client';

import React, { useEffect, useRef, useState } from 'react';
import { nvLog } from '@/lib/logger';

declare global {
  interface Window {
    naver: any;
  }
}

interface NaverMapProps {
  address: string;
}

export default function NaverMap({ address }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 1. DB에서 Client ID 가져오기 + 서버사이드 Geocoding 동시 실행
  useEffect(() => {
    let cancelled = false;
    nvLog('FW', `[NaverMap] 컴포넌트 초기화 - 주소: "${address}"`);

    const init = async () => {
      try {
        nvLog('FW', `[NaverMap] DB설정 및 좌표 변환 API 호출 시작...`);
        const [mapRes, geoRes] = await Promise.all([
          fetch('/api/settings/map'),
          fetch(`/api/settings/geocode?query=${encodeURIComponent(address)}`)
        ]);

        const mapData = await mapRes.json();
        const geoData = await geoRes.json();

        if (cancelled) {
          nvLog('FW', `[NaverMap] 컴포넌트 언마운트로 작업 취소됨`);
          return;
        }

        nvLog('FW', `[NaverMap] API 응답 수신`, { mapData, geoData });

        if (!mapData.clientId) {
          nvLog('FW', `[NaverMap] 에러 - 지도 API 키(Client ID)가 설정되지 않음`);
          setError('지도 API 키가 설정되지 않았습니다.');
          setLoading(false);
          return;
        }

        setClientId(mapData.clientId);

        if (geoData.lat && geoData.lng) {
          nvLog('FW', `[NaverMap] 주소 변환 성공 - 좌표:`, { lat: geoData.lat, lng: geoData.lng });
          setCoords({ lat: geoData.lat, lng: geoData.lng });
        } else {
          nvLog('FW', `[NaverMap] 경고 - 주소 변환 결과 없음 (기본 서울시청 위치 사용)`, { error: geoData.error });
          setCoords(null);
        }
      } catch (err: any) {
        nvLog('FW', `[NaverMap] 에러 - API 호출 중 오류 발생:`, err);
        if (!cancelled) {
          setError('지도 설정을 불러올 수 없습니다.');
          setLoading(false);
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [address]);

  // 2. Client ID + 좌표가 준비되면 네이버 지도 스크립트 로드
  useEffect(() => {
    if (!clientId) return;

    // 이미 로드된 경우
    if (window.naver?.maps) {
      nvLog('FW', `[NaverMap] 네이버 지도 객체가 이미 window.naver.maps에 로드되어 있음 -> 바로 렌더링`);
      renderMap();
      return;
    }

    // 스크립트가 이미 추가되어 로딩 중인 경우 대기
    const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
    if (existingScript) {
      nvLog('FW', `[NaverMap] 네이버 지도 스크립트가 이미 DOM에 존재함. 완료 대기 중...`);
      const checkLoaded = setInterval(() => {
        if (window.naver?.maps) {
          nvLog('FW', `[NaverMap] 대기하던 스크립트 로드 완료 감지 -> 렌더링 시작`);
          clearInterval(checkLoaded);
          renderMap();
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    nvLog('FW', `[NaverMap] 네이버 지도 JS 스크립트 동적 로드 시작 (ncpClientId: ${clientId})`);
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.onload = () => {
      nvLog('FW', `[NaverMap] 네이버 지도 스크립트 로드 완료(onload) -> 렌더링 시작`);
      renderMap();
    };
    script.onerror = (err) => {
      nvLog('FW', `[NaverMap] 에러 - 네이버 지도 스크립트 로드 실패(onerror)`, err);
      setError('네이버 지도를 불러올 수 없습니다.');
      setLoading(false);
    };
    document.head.appendChild(script);
  }, [clientId, coords]);

  // 3. 지도 렌더링
  const renderMap = () => {
    if (!mapRef.current) {
      nvLog('FW', `[NaverMap] 에러 - 지도 컨테이너 엘리먼트(mapRef)가 없음`);
      return;
    }
    if (!window.naver?.maps) {
      nvLog('FW', `[NaverMap] 에러 - window.naver.maps 객체가 존재하지 않음`);
      return;
    }

    const lat = coords?.lat ?? 37.5666805;
    const lng = coords?.lng ?? 126.9784147;
    const hasCoords = !!coords;

    nvLog('FW', `[NaverMap] 네이버 지도 객체 생성 시작 - 좌표:`, { lat, lng });

    try {
      const position = new window.naver.maps.LatLng(lat, lng);
      const map = new window.naver.maps.Map(mapRef.current, {
        center: position,
        zoom: 16,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_LEFT,
          style: window.naver.maps.ZoomControlStyle.SMALL
        }
      });

      if (hasCoords) {
        nvLog('FW', `[NaverMap] 지도 마커 생성 완료`);
        new window.naver.maps.Marker({
          position,
          map,
        });
      }

      nvLog('FW', `[NaverMap] 지도 렌더링 완료 및 로딩 해제`);
      setLoading(false);
    } catch (err) {
      nvLog('FW', `[NaverMap] 에러 - 지도 객체 생성 중 예외 발생:`, err);
      setError('지도를 초기화하는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="w-full h-[200px] bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 text-[13px] font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-gray-400 text-[13px] font-medium">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
            지도를 불러오는 중...
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-[250px] md:h-[300px]" />
    </div>
  );
}
