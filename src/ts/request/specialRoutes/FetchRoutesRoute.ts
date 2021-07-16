import Route from "../Route.ts";
import RouteManager from "../RouteManager.ts";
import { RequestMethod } from "../RequestMethod.ts";
import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.100.0/http/mod.ts";

export default class FetchRoutesRoute extends Route {
  /** Routes not provided by the user */
  private excludedRoutes = [
    "/mock-server-routes",
    "/mock-server-ui",
    "/refreshConfig",
    "/mock-ui-save-routes",
  ];

  constructor(private routeManager: RouteManager) {
    super(
      "Fetch Routes",
      "/mock-server-routes",
      <RequestMethod> "GET",
      new Headers(),
      null,
      200,
    );
    this.responseHeaders.append("Content-Type", "application/json");
  }

  async execute(request: ServerRequest): Promise<Response> {
    // get all the routes in the route manager
    const routes = this.routeManager.routes.filter((it: Route) =>
      !this.excludedRoutes.includes(it.url)
    );
    return <Response> {
      body: JSON.stringify(routes),
      status: 200,
    };
  }
}
