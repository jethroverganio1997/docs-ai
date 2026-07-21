/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  experimental: {
    ppr: "incremental",
  },
  reactStrictMode: true,
};

export default config;
