import Route from "../Route.ts";
import { RequestMethod } from "../RequestMethod.ts";
import RouteManager from "../RouteManager.ts";
import { readConfigFile, writeConfigFile } from "../../config/ConfigManager.ts";
import { readAll } from "https://deno.land/std@0.111.0/streams/conversion.ts";
import { readerFromStreamReader } from "https://deno.land/std@0.111.0/streams/conversion.ts";

/**
 * handles saving the passed request json into our config file, and then refreshes the config
 */
export default class SaveRoutesRoute extends Route {
  constructor(
    private configLocation: string,
    private routeManager: RouteManager,
  ) {
    super(
      "Save Routes",
      "/mock-ui-save-routes",
      <RequestMethod> "POST",
      new Headers(),
      null,
      200,
    );
  }

  async execute(request: Request): Promise<Response> {
    try {
      // our json is passed in as bytes, so we need to read them into a buffer and parse the buffer into a JSON string
      const requestBody: ReadableStream | null = request.body;
      let requestJson = "";
      if (requestBody) {
        const buffer = await readAll(
          readerFromStreamReader(request.body!.getReader()),
        );
        for (let charCode of buffer) {
          requestJson += String.fromCharCode(charCode);
        }
      }
      const config = readConfigFile(this.configLocation);
      // clear all config routes in order to re-write them
      config.routes = [];
      const rawRoutes = JSON.parse(requestJson);
      // routes must first be converted to an actual Route object
      for (let route of rawRoutes) {
        config.routes.push(Route.fromObject(route));
      }
      writeConfigFile(this.configLocation, config);
      this.routeManager.setupRoutes(config);
      return new Response('{"success": true}', { status: 200 });
    } catch (e) {
      console.error("Failed to save routes!");
      console.trace(e);
      return new Response('{"error": true}', { status: 500 });
    }
  }
}
