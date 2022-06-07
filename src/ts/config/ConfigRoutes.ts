import { RequestMethod } from '../request/RequestMethod.ts';
import { RouteTypes } from '../request/RouteTypes.ts';

export interface ConfigRouteV1 {
  title: string;
  url: string;
  method: RequestMethod;
  responseHeaders: Record<string, string> | Headers;
  // deno-lint-ignore no-explicit-any
  response: string | Record<string, any> | null;
  responseStatus: number;
}

export interface ConfigRouteV2 extends ConfigRouteV1 {
  isEnabled: boolean;
}

export interface ConfigRouteV3 extends ConfigRouteV2 {
  routeType: RouteTypes;
  redirectUrl?: string;
}
