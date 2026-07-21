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
        hostname: "personal-118690287046-ap-northeast-1-an.s3.ap-northeast-1.amazonaws.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default config;
