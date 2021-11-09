import Route from "../Route.ts";
import { RequestMethod } from "../RequestMethod.ts";
import { serveFile } from "https://deno.land/std@0.114.0/http/file_server.ts";

export default class UIRoute extends Route {
  constructor() {
    super(
      "UI",
      "/mock-server-ui",
      <RequestMethod> "GET",
      new Headers(),
      null,
      200,
    );
  }

  doesUrlMatch(url = ""): boolean {
    return url.toLowerCase().includes("/mock-server-ui") ||
      url.toLowerCase().includes("ui.css") ||
      url.toLowerCase().includes("ui.js") ||
      // we technically match on this since it's UI-related, but we don't serve any icon. This prevents the log from showing the requests for favicon.ico
      url.toLowerCase().includes("favicon.ico");
  }

  /**
   * handles serving the files to the browser
   * @param request
   */
  async execute(request: Request): Promise<Response> {
    if (request.url.toLowerCase().includes("/mock-server-ui")) {
      return await serveFile(request, "./generated/ui.html");
    } else if (request.url.toLowerCase().includes("ui.css")) {
      return await serveFile(request, "./generated/ui.css");
    } else if (request.url.toLowerCase().includes("ui.js")) {
      return await serveFile(request, "./generated/ui.js");
    } else {
      return new Response(null, { status: 404 });
    }
  }
}
