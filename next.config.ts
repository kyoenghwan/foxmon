import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 개발 환경에서 파일시스템 캐시 비활성화
      // 알약 등 실시간 백신이 .next 캐시 파일을 잠가 발생하는
      // errno -4094 (UNKNOWN) 에러를 우회합니다.
      config.cache = false;
    }
    // Fabric.js 서버사이드 네이티브 canvas 모듈 외부화
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({ canvas: 'commonjs canvas' });
    }
    return config;
  },
};

export default withPWA(nextConfig);
