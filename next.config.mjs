/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  allowedDevOrigins: ['192.168.5.161'],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
