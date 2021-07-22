import Route from "./Route.ts";
import Config from "../config/Config.ts";
import { ServerRequest } from "https://deno.land/std@0.100.0/http/mod.ts";

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
    this.routes = config.routes.map((it) => Route.fromObject(it));
  }

  /**
   * matches the request to a route object to be executed. If one is not found, null is returned
   * @param request
   * @param specialRoutes the list of extra routes to try and match on that are not a part of this object. This object should include things such as `UpdateConfigRoute` for example
   */
  public match(request: ServerRequest, specialRoutes: Route[]): Route | null {
    let matchingRoute: Route | null = null;
    const url = request.url;
    const method = request.method;
    // put specialRoutes first as they have priority
    const routesToMatchOn = [...specialRoutes, ...this.routes];
    for (let route of routesToMatchOn) {
      if (
        (route.method === method || method === "HEAD") &&
        route.doesUrlMatch(url)
      ) {
        matchingRoute = route;
        break;
      }
    }
    return matchingRoute;
  }
}
