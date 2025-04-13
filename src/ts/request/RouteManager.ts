import Route from './Route.ts';
import Config from '../config/Config.ts';
import RouteFactory from './RouteFactory.ts';
import { ConfigRouteV3 } from '../config/ConfigRoutes.ts';

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
    this.routes = config.routes.map((it: object) =>
      RouteFactory.create(it as ConfigRouteV3)
    );
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
    const url = request.url.replace(/(?<=http:\/\/)127\.0\.0\.1/, 'localhost')
      .split(
        new RegExp(`localhost:${port}`),
      )[1];
    const method = request.method;
    // put specialRoutes first as they have priority
    const routesToMatchOn = [...specialRoutes, ...this.routes];
    const matches = routesToMatchOn.filter((route) =>
      route.isEnabled &&
      (route.method === method || method === 'HEAD' ||
        route.method === '*') &&
      route.doesUrlMatch(url)
    );
    // sort on specificity so that we can get the most accurate match if there are multiples
    const sorted = matches.sort((a, b) => b.specificity - a.specificity);
    return sorted[0] ?? null;
  }
}
