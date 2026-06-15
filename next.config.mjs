/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native modules kept out of the bundler so they load at runtime.
  // (Renamed from experimental.serverComponentsExternalPackages in Next 15+.)
  serverExternalPackages: ["better-sqlite3", "pg"],
};

export default nextConfig;
