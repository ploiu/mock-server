import { RouteTypes } from '../../ts/request/RouteTypes.ts';
import {
  parseBackendHeaders,
  parseFrontendHeaders,
} from '../models/UIHeader.ts';
import { UIRoute } from '../models/index.ts';

const url = 'VITE_BASE_URL' in import.meta.env
  ? import.meta.env.VITE_BASE_URL
  : '';

export async function fetchRoutes(): Promise<UIRoute[]> {
  const res = await fetch(`${url}/mock-server-routes`);
  if (res.status === 200) {
    // deno-lint-ignore no-explicit-any
    const parsedBody: Record<string, any>[] = await res.json();
    return parsedBody.map((it) => {
      it.responseHeaders = parseBackendHeaders(it.responseHeaders);
      return it as UIRoute;
    });
  } else {
    throw await res.text();
  }
}

export async function saveRoutes(routes: UIRoute[]): Promise<void> {
  const formatted = routes.map((route) => {
    // deno-lint-ignore no-explicit-any
    const detyped: Record<string, any> = { ...route };
    if (route.routeType === RouteTypes.DEFAULT) {
      detyped.responseHeaders = parseFrontendHeaders(detyped.responseHeaders);
    }
    return detyped;
  });
  const body = JSON.stringify(formatted);
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
