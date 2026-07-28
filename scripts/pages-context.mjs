const DEFAULT_OWNER = "jvvtr";
const DEFAULT_REPOSITORY = "royalpath-tibia-rp";

function normalizeBasePath(value) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function withTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

export function getPagesContext(environment = process.env) {
  const repositoryParts = (environment.GITHUB_REPOSITORY ?? "").split("/");
  const owner =
    environment.GITHUB_REPOSITORY_OWNER ??
    repositoryParts.at(-2) ??
    DEFAULT_OWNER;
  const repository = repositoryParts.at(-1) || DEFAULT_REPOSITORY;
  const isUserSite =
    repository.toLowerCase() === `${owner.toLowerCase()}.github.io`;
  const inferredBasePath = isUserSite ? "" : `/${repository}`;
  const basePath = normalizeBasePath(
    environment.NEXT_PUBLIC_BASE_PATH ??
      environment.PAGES_BASE_PATH ??
      inferredBasePath,
  );
  const siteUrl = withTrailingSlash(
    environment.NEXT_PUBLIC_SITE_URL ??
      environment.PAGES_BASE_URL ??
      `https://${owner}.github.io${basePath}`,
  );

  return { basePath, owner, repository, siteUrl };
}
