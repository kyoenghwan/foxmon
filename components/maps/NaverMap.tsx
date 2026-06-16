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
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 1. DB에서 Client ID 가져오기 + 서버사이드 Geocoding 동시 실행
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const [mapRes, geoRes] = await Promise.all([
          fetch('/api/settings/map'),
          fetch(`/api/settings/geocode?query=${encodeURIComponent(address)}`)
        ]);

        const mapData = await mapRes.json();
        const geoData = await geoRes.json();

        if (cancelled) return;

        if (!mapData.clientId) {
          setError('지도 API 키가 설정되지 않았습니다.');
          setLoading(false);
          return;
        }

        setClientId(mapData.clientId);

        if (geoData.lat && geoData.lng) {
          setCoords({ lat: geoData.lat, lng: geoData.lng });
        } else {
          setCoords(null);
        }
      } catch {
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
      renderMap();
      return;
    }

    // 스크립트가 이미 추가되어 로딩 중인 경우 대기
    const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
    if (existingScript) {
      const checkLoaded = setInterval(() => {
        if (window.naver?.maps) {
          clearInterval(checkLoaded);
          renderMap();
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => renderMap();
    script.onerror = () => {
      setError('네이버 지도를 불러올 수 없습니다.');
      setLoading(false);
    };
    document.head.appendChild(script);
  }, [clientId, coords]);

  // 3. 지도 렌더링
  const renderMap = () => {
    if (!mapRef.current || !window.naver?.maps) return;

    const lat = coords?.lat ?? 37.5666805;
    const lng = coords?.lng ?? 126.9784147;
    const hasCoords = !!coords;

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
      new window.naver.maps.Marker({
        position,
        map,
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
