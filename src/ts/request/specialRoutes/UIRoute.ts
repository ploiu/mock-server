import Route from "../Route.ts";
import RouteManager from "../RouteManager.ts";
import { RequestMethod } from "../RequestMethod.ts";
import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.100.0/http/mod.ts";
import { serveFile } from "https://deno.land/std@0.100.0/http/file_server.ts";

export default class UIRoute extends Route {
  constructor(
    private routeManager: RouteManager,
  ) {
    super(
      "UI",
      "/mock-server-ui",
      <RequestMethod> "GET",
      new Headers(),
      null,
      200,
    );
  }

  doesUrlMatch(url: string = ""): boolean {
    return url.toLowerCase().includes("/mock-server-ui") ||
      url.toLowerCase().includes("ui.css");
  }

  /**
   * handles serving the files to the browser
   * @param request
   */
  async execute(request: ServerRequest): Promise<Response> {
    // log that the route was hit
    const color = super.getColorForMethod(
      <RequestMethod> request.method.toUpperCase(),
    );
    console.log(color(` ${request.method.toUpperCase()} `) + " " + request.url);
    if (request.url.toLowerCase().includes("/mock-server-ui")) {
      return await serveFile(request, "./ui.html");
    } else if (request.url.toLowerCase().includes("ui.css")) {
      return await serveFile(request, "./ui.css");
    } else {
      return <Response> {
        body: "",
        status: 404,
      };
    }
  }
}
