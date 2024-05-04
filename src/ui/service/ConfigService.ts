import { UIRoute } from '../models/index.ts';

export function fetchRoutes(): Promise<UIRoute[]> {
  return fetch('/mock-server-routes')
    .then((res) =>
      res.status === 200
        ? res.json()
        : res.text().then((text) => Promise.reject(text))
    );
}
