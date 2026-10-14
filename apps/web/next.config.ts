import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
      {
        source: '/tts/:path*',
        destination: 'http://127.0.0.1:8001/:path*',
      },
    ];
  },
  allowedDevOrigins: ['192.168.29.108'],
};

export default nextConfig;
