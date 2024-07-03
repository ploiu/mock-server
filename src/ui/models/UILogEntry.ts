export interface UILogEntry {
  url: string | null;
  method: string | null;
  // deno-lint-ignore no-explicit-any
  body: any;
  requestHeaders: Record<string, string> | null;
  timestamp: number;
  message: string | null;
}

export type ErrorUILogEntry = UILogEntry & {
  url: null;
  method: null;
  body: null;
  message: string;
  headers: Record<never, never>;
};

export type SuccessUILogEntry = UILogEntry & {
  url: string;
  method: string;
  requestHeaders: Record<string, string>;
  message: null;
};

export function isSuccess(entry: UILogEntry): entry is SuccessUILogEntry {
  return entry.message === null;
}

export function isError(entry: UILogEntry): entry is ErrorUILogEntry {
  return entry.message !== null;
}
