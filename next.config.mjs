/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: "export", // Required for Electron
  distDir: "out",
  trailingSlash: true,
  // The following is only used in development mode
  ...(process.env.NODE_ENV === "development" && {
    // Disable output: 'export' in development
    output: undefined,
  }),
};

export default nextConfig;
