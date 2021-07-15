import { serve } from "https://deno.land/std@0.91.0/http/mod.ts";
import { parse } from "https://deno.land/std@0.91.0/flags/mod.ts";
import Config from "./config/Config.ts";
import { readConfigFile } from "./config/ConfigManager.ts";
import {
  cyan,
  green,
  magenta,
  yellow,
} from "https://deno.land/std@0.91.0/fmt/colors.ts";
import RouteManager from "./request/RouteManager.ts";
import Route from "./request/Route.ts";
import UpdateConfigRoute from "./request/specialRoutes/UpdateConfigRoute.ts";
import UIRoute from "./request/specialRoutes/UIRoute.ts";

const helpText = `
	USAGE: MockServer [flags]
	
	flags:
	--port,    -p    The port number to run the mock server on. Defaults to 8000
	--config,  -c    The location of the config file. Defaults to ./config.json
	--load-ui, -l    Start up with UI
	--help,    -h    Show this help message
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
  const loadUI: boolean = parsedArgs["load-ui"] ?? parsedArgs.l ?? false;
  await startMockServer(port, configLocation, loadUI);
}

/**
 * Starts the mock server and starts listening for requests
 * @param {number} port
 * @param {string} configLocation
 * @param {boolean} loadUI
 */
export async function startMockServer(
  port: number = 8000,
  configLocation: string,
  loadUI: boolean,
) {
  // set up config and start on our port
  const server = serve({ port: port });
  const routeManager = new RouteManager();
  console.log("reading routes from config");
  if (loadUI) {
    console.log("generating ui file");
    createUIFile();
  }
  const config: Config = readConfigFile(configLocation);
  routeManager.setupRoutes(config);
  // setup our special routes
  const specialRoutes = setupSpecialRoutes(configLocation, routeManager);
  // tell the user that everything is ready
  console.log(green("Routes set up!"));
  console.log(`Mock server started on port ${cyan(String(port))}`);
  if (loadUI) {
    console.log(
      `To open the UI, navigate to ${
        magenta("http://localhost:" + port + "/mock-server-ui")
      }`,
    );
  }
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

/**
 * Creates the UI html file
 */
function createUIFile() {
  ////// DO NOT ALTER BELOW THIS LINE - IT IS THE STRING CONTENTS OF ../html/ui.html AND SHOULD BE TREATED AS GENERATED CODE
  const uiHtml: string =
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Ploiu Mock Server</title>\n    <style>\n        :root {\n            --primary: #7C35AA;\n            --secondary: #8D99AE;\n            --success: #A5C882;\n            --error: #CD533B;\n            --body-background: #333;\n        }\n\n        body, html {\n            width: 100%;\n            height: 100%;\n            background-color: var(--body-background);\n            overflow: hidden;\n        }\n    </style>\n</head>\n<body>\n<div id="main">\n\n</div>\n</body>\n</html>\n';
  ////// END GENERATED CODE
  try {
    Deno.removeSync("./ui.html");
  } catch (e) {
  }
  Deno.writeTextFileSync("./ui.html", uiHtml);
}

function setupSpecialRoutes(
  configLocation: string,
  routeManager: RouteManager,
): Route[] {
  return [
    new UpdateConfigRoute(configLocation, routeManager),
    new UIRoute(routeManager),
  ];
}
