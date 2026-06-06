import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Drop the `X-Powered-By: Next.js` response header — it adds nothing for
  // users and only advertises the stack to the network.
  poweredByHeader: false,
};

export default nextConfig;
