/** @type {import('next').NextConfig} */

const basePath = "/dsaguardian";

const nextConfig = {
  basePath,
  // Expose to client-side code so raw fetch("/api/…") calls can be prefixed.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // Native modules kept out of the bundler so they load at runtime.
  // (Renamed from experimental.serverComponentsExternalPackages in Next 15+.)
  serverExternalPackages: ["better-sqlite3", "pg"],
};

export default nextConfig;
