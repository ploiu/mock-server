import { UILogEntry } from '../models/UILogEntry.ts';

const url = 'VITE_BASE_URL' in import.meta.env
  ? import.meta.env.VITE_BASE_URL
  : '';

export async function fetchLogs(): Promise<UILogEntry[]> {
  const res = await fetch(`${url}/mock-server-logs`);
  if (res.status === 200) {
    return res.json();
  } else {
    throw await res.text();
  }
}
