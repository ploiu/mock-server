import Route from "../Route.ts";
import { RequestMethod } from "../RequestMethod.ts";
import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.91.0/http/mod.ts";
import RouteManager from "../RouteManager.ts";
import { readConfigFile, writeConfigFile } from "../../config/ConfigManager.ts";

/**
 * handles saving the passed request json into our config file, and then refreshes the config
 */
export default class SaveRoutesRoute extends Route {
  constructor(private configLocation: string, private routeManager: RouteManager) {
    super(
      'Save Routes',
      '/mock-ui-save-routes',
      <RequestMethod>'POST',
      new Headers(),
      null,
      200
    );
  }

  async execute(request: ServerRequest): Promise<Response> {
    try {
      // our json is passed in as bytes, so we need to read them into a buffer and parse the buffer into a JSON string
      const buffer = new Uint8Array(Number(request.contentLength));
      await request.body.read(buffer);
      let requestJson = ''
      for (let charCode of buffer) {
        requestJson += String.fromCharCode(charCode);
      }
      // now that we have the json, we can format it and write it to our config file
      console.info('Saving Routes...')
      const config = readConfigFile(this.configLocation);
      // clear all config routes in order to re-write them
      config.routes = [];
      const rawRoutes = JSON.parse(requestJson);
      // routes must first be converted to an actual Route object
      for (let route of rawRoutes) {
        config.routes.push(Route.fromObject(route));
      }
      writeConfigFile(this.configLocation, config);
      return <Response>{
        body: '{"success": true}',
        status: 200
      }
    } catch (e) {
      console.error('Failed to save routes!')
      console.trace(e);
      return <Response>{
        body: '{"error": true}',
        status: 500
      }
    }
  }
}