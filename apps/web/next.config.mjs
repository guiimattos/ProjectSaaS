/** @type {import('next').NextConfig} */
const nextConfig = {
  // bullmq/ioredis só rodam no servidor; evita que o webpack tente empacotá-los no bundle.
  experimental: { serverComponentsExternalPackages: ["bullmq", "ioredis"] },
  images: { remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }] },
};
export default nextConfig;
