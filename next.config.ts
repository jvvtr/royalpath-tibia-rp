import type { NextConfig } from "next";

function normalizeBasePath(value: string | undefined) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

const isGitHubPages = process.env.DEPLOY_TARGET === "github-pages";
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath,
      trailingSlash: true,
      images: {
        unoptimized: true,
      },
    }
  : {};

export default nextConfig;
