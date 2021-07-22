import Route from "../Route.ts";
import RouteManager from "../RouteManager.ts";
import { RequestMethod } from "../RequestMethod.ts";
import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.100.0/http/mod.ts";
import { serveFile } from "https://deno.land/std@0.100.0/http/file_server.ts";
import { LogManager } from "../../LogManager.ts";

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
      url.toLowerCase().includes("ui.css") ||
      url.toLowerCase().includes("ui.js");
  }

  /**
     * handles serving the files to the browser
     * @param request
     */
  async execute(request: ServerRequest): Promise<Response> {
    LogManager.newEntry(request.url, request.method.toUpperCase());
    if (request.url.toLowerCase().includes("/mock-server-ui")) {
      return await serveFile(request, "./generated/ui.html");
    } else if (request.url.toLowerCase().includes("ui.css")) {
      return await serveFile(request, "./generated/ui.css");
    } else if (request.url.toLowerCase().includes("ui.js")) {
      return await serveFile(request, "./generated/ui.js");
    } else {
      return <Response> {
        body: "",
        status: 404,
      };
    }
  }
}
