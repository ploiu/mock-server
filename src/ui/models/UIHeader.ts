export interface UIHeader {
  name: string;
  value: string;
  // used for loop keys TODO maybe remove
  readonly id: string;
}

export function fromBackendHeader(entry: [string, string]): UIHeader {
  const [name, value] = entry;
  return { name, value, id: crypto.randomUUID() };
}

export function toHeaderMap(headers: UIHeader[]) {
  const combined: Record<string, string> = {};
  headers.forEach(({ name, value }) => combined[name] = value);
  return combined;
}
