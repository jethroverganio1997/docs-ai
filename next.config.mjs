import { withContentCollections } from '@content-collections/next';

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pexipewlvozsyzoxkmgq.supabase.co",
        pathname: "/storage/v1/object/public/**", // allow all paths inside storage
      },
    ],
  },
};

export default withContentCollections(config);
