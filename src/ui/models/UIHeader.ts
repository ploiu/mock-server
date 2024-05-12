export function parseBackendHeaders(headers: Record<string, string>): string {
  return Object.entries(headers)
    .map(([key, value]) => key + ': ' + value)
    .join('\n')
    .trim();
}

export function validateHeaderInput(input: string): boolean {
  input = input.trim();
  if (input === '') {
    return true;
  }
  const invalidLines = input.split(/\r?\n/).filter((line) =>
    !line.trim().match(/[^ \t\r\n]+?:[ \t]*[^ \t\r\n]+/)
  );
  return invalidLines.length === 0;
}

export function parseFrontendHeaders(headers: string): Record<string, string> {
  headers = headers.trim();
  if (headers === '') {
    return {};
  }
  return headers.split(/\r?\n/)
    .map((it) => {
      const key = it.substring(0, it.indexOf(':')).trim();
      const value = it.substring(it.indexOf(':') + 1).trim();
      return { [key]: value };
    })
    .reduce((combined, current) => ({ ...combined, ...current }));
}
