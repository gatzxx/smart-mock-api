const PATH_PARAM_PATTERN = /:([A-Za-z0-9_]+)/g;

export function extractPathParamNames(path: string): string[] {
  const matches = path.match(PATH_PARAM_PATTERN);

  if (!matches) {
    return [];
  }

  return matches.map((match) => match.slice(1));
}

export function resolvePathParamValue(
  endpointPath: string,
  params: Record<string, string>,
  idField: string,
): string | undefined {
  const paramNames = extractPathParamNames(endpointPath);
  const paramName = paramNames.includes(idField) ? idField : paramNames[0];

  if (!paramName) {
    return undefined;
  }

  return params[paramName];
}
