export function hashSeedKey(seedKey: string): number {
  let hash = 0;

  for (let index = 0; index < seedKey.length; index += 1) {
    hash = (hash << 5) - hash + seedKey.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function resolveRouteSeedKey(
  routePath: string,
  params: Record<string, string>,
): string {
  let resolvedPath = routePath;

  for (const [paramName, paramValue] of Object.entries(params)) {
    resolvedPath = resolvedPath.replace(`:${paramName}`, paramValue);
  }

  return resolvedPath;
}
