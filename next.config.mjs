/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  experimental: {
    ppr: "incremental",
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // allow any HTTPS domain
      },
    ],
  },
};

export default config;
