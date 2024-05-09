import { UIRoute } from '../models/index.ts';

const url = 'VITE_BASE_URL' in import.meta.env
  ? import.meta.env.VITE_BASE_URL
  : '';

export async function fetchRoutes(): Promise<UIRoute[]> {
  const res = await fetch(`${url}/mock-server-routes`);
  if (res.status === 200) {
    return res.json();
  } else {
    throw await res.text();
  }
}

export async function saveRoutes(routes: UIRoute[]): Promise<undefined> {
  const body = JSON.stringify(routes);
  const res = await fetch(`${url}/mock-ui-save-routes`, {
    method: 'POST',
    body,
  });
  if (res.status === 200) {
    const body: { success?: boolean; error?: boolean } = await res.json();
    if (!body.success) {
      throw 'Failed to save routes. Check server log for details.';
    }
  } else {
    throw await res.text();
  }
}

export function stringifyRoute(route: UIRoute): string {
  return route.title + route.url + route.method + route.response +
    route.responseStatus + route.isEnabled + route.routeType;
}
