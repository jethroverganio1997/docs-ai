import { withContentCollections } from "@content-collections/next";

/** @type {import('next').NextConfig} */
const config = {
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

export default withContentCollections(config);
