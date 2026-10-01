import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/auth/sign-in',
        destination: '/login',
        permanent: false,
      },
      {
        source: '/auth/sign-up',
        destination: '/register',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
