import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // 개발 환경에서 파일시스템 캐시 비활성화
      // 알약 등 실시간 백신이 .next 캐시 파일을 잠가 발생하는
      // errno -4094 (UNKNOWN) 에러를 우회합니다.
      config.cache = false;
    }
    return config;
  },
};

export default withPWA(nextConfig);
