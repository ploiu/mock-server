//deno-lint-ignore-file no-explicit-any
import Route from './Route.ts';
import Config from '../config/Config.ts';
import RouteFactory from './RouteFactory.ts';

/**
 * Central location for matching requests to routes and executing the responses for those routes
 */
export default class RouteManager {
  public routes: Route[] = [];

  /**
   * Sets up our routes based on the values in the config object
   * @param {Config} config
   */
  public setupRoutes(config: Config) {
    // @ts-ignore there's no type to cast it to aside from Object, and typescript doesn't like that either
    this.routes = config.routes.map((it: any) => RouteFactory.create(it));
  }

  /**
   * matches the request to a route object to be executed. If one is not found, null is returned
   * @param request
   * @param specialRoutes the list of extra routes to try and match on that are not a part of this object. This object should include things such as `UpdateConfigRoute` for example
   * @param port
   */
  public match(
    request: Request,
    specialRoutes: Route[],
    port: number,
  ): Route | null {
    let matchingRoute: Route | null = null;
    const url = request.url.replace(/(?<=http:\/\/)127\.0\.0\.1/, 'localhost')
      .split(
        new RegExp(`localhost:${port}`),
      )[1];
    const method = request.method;
    // put specialRoutes first as they have priority
    const routesToMatchOn = [...specialRoutes, ...this.routes];
    for (const route of routesToMatchOn) {
      if (
        (route.method === method || method === 'HEAD') &&
        route.doesUrlMatch(url) &&
        route.isEnabled
      ) {
        matchingRoute = route;
        break;
      }
    }
    return matchingRoute;
  }
}
