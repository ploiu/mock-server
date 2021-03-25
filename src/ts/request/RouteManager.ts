import Route from "./Route.ts";
import Config from "../config/Config.ts";
import { ServerRequest } from "https://deno.land/std@0.91.0/http/mod.ts";

/**
 * Central location for matching requests to routes and executing the responses for those routes
 */
export default class RouteManager {
  private routes: Route[] = [];

  /**
	 * Sets up our routes based on the values in the config object
	 * @param {Config} config
	 */
  setupRoutes(config: Config) {
    this.routes = config.routes.map(Route.fromObject);
  }

  match(request: ServerRequest): Route | null {
    let matchingRoute: Route | null = null;
    const url = request.url;
    const method = request.method;
    for (let route of this.routes) {
      if (route.method === method) void 0;
    }
    return matchingRoute;
  }
}
