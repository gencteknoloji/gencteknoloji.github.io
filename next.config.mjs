/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  allowedDevOrigins: ['*.loca.lt', 'localhost', '127.0.0.1']
};

export default nextConfig;
