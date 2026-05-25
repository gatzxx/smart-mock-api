export function toOpenApiPath(basePath: string, endpointPath: string): string {
  const fullPath = basePath === "/" ? endpointPath : `${basePath}${endpointPath}`;

  return fullPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
}

export function extractOpenApiPathParams(path: string): string[] {
  const matches = path.match(/:([A-Za-z0-9_]+)/g);

  if (!matches) {
    return [];
  }

  return matches.map((match) => match.slice(1));
}
