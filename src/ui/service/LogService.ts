const url = 'VITE_BASE_URL' in import.meta.env
  ? import.meta.env.VITE_BASE_URL
  : '';

export function fetchLogs(): EventSource {
  const source = new EventSource(url + '/mock-server-logs');
  return source;
}
