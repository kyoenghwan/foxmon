'use client';

import React, { useEffect, useRef, useState } from 'react';

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

  // 1. DB에서 Client ID 가져오기
  useEffect(() => {
    const fetchClientId = async () => {
      try {
        const res = await fetch('/api/settings/map');
        const data = await res.json();
        if (data.clientId) {
          setClientId(data.clientId);
        } else {
          setError('지도 API 키가 설정되지 않았습니다.');
          setLoading(false);
        }
      } catch {
        setError('지도 설정을 불러올 수 없습니다.');
        setLoading(false);
      }
    };
    fetchClientId();
  }, []);

  // 2. Client ID가 준비되면 네이버 지도 스크립트 로드
  useEffect(() => {
    if (!clientId) return;

    // 이미 로드된 경우 스킵
    if (window.naver?.maps) {
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.onload = () => initMap();
    script.onerror = () => {
      setError('네이버 지도를 불러올 수 없습니다.');
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // 스크립트 중복 방지를 위해 제거하지 않음 (한번 로드되면 재사용)
    };
  }, [clientId]);

  // 3. 지도 초기화 및 주소 검색
  const initMap = () => {
    if (!mapRef.current || !window.naver?.maps) return;

    // Geocoder 서브모듈 로드 대기
    window.naver.maps.onJSContentLoaded = () => {
      geocodeAndRender();
    };

    // 이미 로드된 경우 바로 실행
    if (window.naver.maps.Service) {
      geocodeAndRender();
    }
  };

  const geocodeAndRender = () => {
    if (!mapRef.current || !window.naver?.maps?.Service) return;

    window.naver.maps.Service.geocode(
      { query: address },
      (status: number, response: any) => {
        if (status !== 200 || !response?.v2?.addresses?.length) {
          // Geocoding 실패 시 기본 위치(서울 시청)로 표시
          renderMap(37.5666805, 126.9784147, false);
          return;
        }

        const result = response.v2.addresses[0];
        const lat = parseFloat(result.y);
        const lng = parseFloat(result.x);
        renderMap(lat, lng, true);
      }
    );
  };

  const renderMap = (lat: number, lng: number, hasMarker: boolean) => {
    if (!mapRef.current) return;

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

    if (hasMarker) {
      new window.naver.maps.Marker({
        position,
        map,
        icon: {
          content: `<div style="
            width: 32px; height: 32px; 
            background: #FF6B35; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg); 
            border: 3px solid white; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
          ">
            <span style="transform: rotate(45deg); color: white; font-size: 14px; font-weight: bold;">📍</span>
          </div>`,
          anchor: new window.naver.maps.Point(16, 32)
        }
      });
    }

    setLoading(false);
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
