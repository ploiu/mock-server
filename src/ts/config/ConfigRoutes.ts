import { RequestMethod } from '../request/RequestMethod.ts';
import { RouteTypes } from '../request/RouteTypes.ts';

export type ConfigRouteV1 = {
  /** the title of the route as displayed on the ui */
  title: string;
  /** the path that must be matched to trigger the route */
  url: string;
  /** the RequestMethod that must be matched to trigger the route */
  method: RequestMethod | '*';
  /** the headers delivered to the client */
  responseHeaders: Record<string, string> | Headers;
  /** the response body delivered to the client */
  // deno-lint-ignore no-explicit-any
  response: string | Record<string, any> | null;
  /** the response status delivered to the client */
  responseStatus: number;
};

export type ConfigRouteV2 = ConfigRouteV1 & {
  /** if the route can be matched on */
  isEnabled: boolean;
};

export type ConfigRouteV3 = ConfigRouteV2 & {
  /** the type of the route (see RouteTypes) */
  routeType: RouteTypes;
  /** the url to redirect to, if the route is a passthrough route */
  redirectUrl?: string;
};

export type ConfigRouteV4 = ConfigRouteV3 & {
  /** unique id (uuid) to help with identifying routes */
  id: string;
};
