import { RequestMethod } from '../../ts/request/RequestMethod.ts';
import { RouteTypes } from '../../ts/request/RouteTypes.ts';

export interface UIRoute {
  title: string;
  url: string;
  method: RequestMethod;
  responseHeaders?: string;
  response: string | null;
  responseStatus: number;
  isEnabled: boolean;
  routeType: RouteTypes;
  redirectUrl?: string;
}

export function stringifyUIRoute(route: UIRoute): string {
  const orderedKeys: string[] = Object.keys(route).sort();
  // typescript is silly
  const casted = route as unknown as Record<string, string | null>;
  let val = '';
  for (const key of orderedKeys) {
    val += casted[key]?.toString() ?? '';
  }
  return val;
}

export function newUIRoute(): UIRoute {
  return {
    title: '',
    url: '',
    method: RequestMethod.GET,
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  };
}
