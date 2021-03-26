import { serve } from "https://deno.land/std@0.91.0/http/mod.ts";
import { parse } from "https://deno.land/std@0.91.0/flags/mod.ts";
import Config from "./config/Config.ts";
import { readConfigFile } from "./config/ConfigManager.ts";
import {
  cyan,
  green,
  yellow,
} from "https://deno.land/std@0.91.0/fmt/colors.ts";
import RouteManager from "./request/RouteManager.ts";
import Route from "./request/Route.ts";
import UpdateConfigRoute from "./request/UpdateConfigRoute.ts";

const helpText = `
	USAGE: MockServer [flags]
	
	flags:
	--port,   -p    The port number to run the mock server on. Defaults to 8000
	--config, -c    The location of the config file. Defaults to ./config.json
	--help,   -h    Show this help message
	`;

// different functionality if run from command line
if (import.meta.main) {
  const { args } = Deno;
  const parsedArgs = parse(args);
  if (parsedArgs.help || parsedArgs.h) {
    console.log(helpText);
    Deno.exit(0);
  }
  const port: number = parsedArgs.port ?? parsedArgs.p ?? 8000;
  const configLocation: string = parsedArgs.config ?? parsedArgs.c ??
    "./config.json";
  await startMockServer(port, configLocation);
}

/**
 * Starts the mock server and starts listening for requests
 * @param {number} port
 * @param configLocation
 */
export async function startMockServer(
  port: number = 8000,
  configLocation: string,
) {
  // set up config and start on our port
  const server = serve({ port: port });
  const routeManager = new RouteManager();
  console.log("reading routes from config");
  const config: Config = readConfigFile(configLocation);
  routeManager.setupRoutes(config);
  // setup our special routes
  const specialRoutes = setupSpecialRoutes(configLocation, routeManager);
  // tell the user that everything is ready
  console.log(green("Routes set up!"));
  console.log(`Mock server started on port ${cyan(String(port))}`);
  // match each request and execute them
  for await (let request of server) {
    const route = routeManager.match(request, specialRoutes);
    if (route) {
      request.respond(await route.execute(request));
    } else {
      console.log(
        yellow(
          `requested route ${request.url}, method ${request.method} not found`,
        ),
      );
      request.respond({
        status: 404,
        body: "",
      });
    }
  }
}

function setupSpecialRoutes(
  configLocation: string,
  routeManager: RouteManager,
): Route[] {
  return [
    new UpdateConfigRoute(configLocation, routeManager),
  ];
}
