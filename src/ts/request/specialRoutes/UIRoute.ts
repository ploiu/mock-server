import Route from "../Route.ts";
import RouteManager from "../RouteManager.ts";
import { RequestMethod } from "../RequestMethod.ts";
import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.91.0/http/mod.ts";
import { serveFile } from "https://deno.land/std@0.91.0/http/file_server.ts";

export default class UIRoute extends Route {
  constructor(
    private routeManager: RouteManager,
  ) {
    super(
      "UI",
      "/mock-server-ui",
      <RequestMethod> "GET",
      {},
      null,
      200,
    );
  }

  doesUrlMatch(url: string = ""): boolean {
    return super.doesUrlMatch(url);
  }

  async execute(request: ServerRequest): Promise<void> {
    return super.execute(request);
  }
}
