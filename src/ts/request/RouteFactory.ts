import { ConfigRouteV4 } from '../config/ConfigRoutes.ts';
import Route from './Route.ts';
import { RouteTypes } from './RouteTypes.ts';
import { PassThroughRoute } from './specialRoutes/PassThroughRoute.ts';

/**
 * factory for creating routes from config entries based off of the entry's routeType
 */
export default class RouteFactory {
  static create(config: ConfigRouteV4): Route {
    switch (config.routeType) {
      case RouteTypes.DEFAULT:
        return this.createDefaultRoute(config);
      case RouteTypes.PASSTHROUGH:
        return this.createPassThroughRoute(config);
      default:
        throw 'bad route type: ' + config.routeType;
    }
  }

  private static createPassThroughRoute(
    config: ConfigRouteV4,
  ): PassThroughRoute {
    return new PassThroughRoute(
      config.id,
      config.title,
      config.url,
      config.method,
      config.isEnabled,
      config.redirectUrl!,
    );
  }

  private static createDefaultRoute(config: ConfigRouteV4): Route {
    let headers: Headers;
    if (!(config.responseHeaders instanceof Headers)) {
      headers = new Headers();
      for (const [key, value] of Object.entries(config.responseHeaders)) {
        headers.set(key, value);
      }
    } else {
      headers = config.responseHeaders;
    }
    return new Route(
      config.id,
      config.title,
      config.url,
      config.method,
      headers,
      // return response if it's a string
      (typeof config.response === 'string')
        ? config.response
        : config.response !== null && config.response !== undefined
        ? JSON.stringify(config.response)
        : null,
      Number(config.responseStatus),
      config.isEnabled,
      config.routeType,
    );
  }
}
