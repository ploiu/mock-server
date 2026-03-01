import { type ConfigRouteV4 } from '../../ts/config/ConfigRoutes.ts';
import { RequestMethod } from '../../ts/request/RequestMethod.ts';
import { RouteTypes } from '../../ts/request/RouteTypes.ts';

export type UIRoute = Omit<ConfigRouteV4, 'responseHeaders'> & {
  responseHeaders?: string;
};

export function newUIRoute(): UIRoute {
  return {
    id: crypto.randomUUID(),
    title: '',
    url: '',
    method: RequestMethod.GET,
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  };
}
