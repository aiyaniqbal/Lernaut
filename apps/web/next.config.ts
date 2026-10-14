import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8000' : '');
const ttsUrl =
  process.env.BACKEND_TTS_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8001' : '');

const nextConfig: NextConfig = {
  async rewrites() {
    const rewrites = [];
    if (backendUrl) {
      rewrites.push({
        source: '/pyapi/:path*',
        destination: `${backendUrl}/:path*`,
      });
    }
    if (ttsUrl) {
      rewrites.push({
        source: '/tts/:path*',
        destination: `${ttsUrl}/:path*`,
      });
    }
    return rewrites;
  },
  allowedDevOrigins: ['192.168.29.108'],
};

export default nextConfig;
