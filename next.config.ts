/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 必须添加这一行
  images: {
    unoptimized: true, // 静态导出必须禁用 Next.js 的默认图片优化
  },
};

export default nextConfig;