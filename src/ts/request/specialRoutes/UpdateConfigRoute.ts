import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.100.0/http/mod.ts";
import Route from "../Route.ts";
import RouteManager from "../RouteManager.ts";
import { RequestMethod } from "../RequestMethod.ts";
import { readConfigFile } from "../../config/ConfigManager.ts";
import { LogManager } from "../../LogManager.ts";

/**
 * A special route that refreshes the config file for the mock server
 * Because of its nature, it should not be registered in the RouteManager
 * as invoking this route re-initializes the RouteManager's route list
 */
export default class UpdateConfigRoute extends Route {
  constructor(
    private configPath: string = "./config.json",
    private routeManager: RouteManager,
  ) {
    super(
      "Custom Update Config Route",
      "/refreshConfig?:location?",
      <RequestMethod> "POST",
      new Headers(),
      "Refreshed Config\n",
      200,
    );
  }

  doesUrlMatch(url: string = ""): boolean {
    return super.doesUrlMatch(url);
  }

  async execute(request: ServerRequest): Promise<Response> {
    LogManager.newEntry(request.url, request.method.toUpperCase());
    const args = this.parseVariablesFromUrl(request.url);
    const configPath = args.location ?? this.configPath;
    console.log(configPath);
    const newConfig = readConfigFile(configPath);
    this.routeManager.setupRoutes(newConfig);
    return <Response> {
      body: this.response,
      status: this.responseStatus,
    };
  }
}
