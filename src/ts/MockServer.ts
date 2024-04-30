import { cyan, emptyDirSync, green, magenta, parse } from './deps.ts';
import Config from './config/Config.ts';
import { readConfigFile } from './config/ConfigManager.ts';
import RouteManager from './request/RouteManager.ts';
import Route from './request/Route.ts';
import UpdateConfigRoute from './request/specialRoutes/UpdateConfigRoute.ts';
import UIRoute from './request/specialRoutes/UIRoute.ts';
import FetchRoutesRoute from './request/specialRoutes/FetchRoutesRoute.ts';
import SaveRoutesRoute from './request/specialRoutes/SaveRoutesRoute.ts';
import LogRoute from './request/specialRoutes/LogRoute.ts';
import LogManager from './LogManager.ts';
import './extensions/HeaderExtensions.ts';

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
  const port = parsedArgs.port ?? parsedArgs.p ?? 8000;
  const configLocation: string = parsedArgs.config ?? parsedArgs.c ??
    './config.json';
  const loadUI: boolean = parsedArgs['load-ui'] ?? parsedArgs.l ?? false;
  startMockServer(port, configLocation, loadUI);
}

/**
 * Starts the mock server and starts listening for requests
 * @param {number} port
 * @param {string} configLocation
 * @param {boolean} loadUI
 */
export function startMockServer(
  port = 8000,
  configLocation: string,
  loadUI: boolean,
) {
  // set up config and start on our port
  const routeManager = new RouteManager();
  console.log('reading routes from config');
  if (loadUI) {
    console.log('generating ui file');
    createUIFiles();
  }
  const config: Config = readConfigFile(configLocation);
  routeManager.setupRoutes(config);
  // setup our special routes
  const specialRoutes = setupSpecialRoutes(configLocation, routeManager);
  // tell the user that everything is ready
  console.log(green('Routes set up!'));
  console.log(`Mock server started on port ${cyan(String(port))}`);
  if (loadUI) {
    console.log(
      `To open the UI, navigate to ${
        magenta('http://localhost:' + port + '/mock-server-ui')
      }`,
    );
  }
  startServing(port, specialRoutes, routeManager);
}

/**
 * Listens for requests on the server and responds to them in kind until the server is closed
 * @param port
 * @param specialRoutes
 * @param routeManager
 */
function startServing(
  port: number,
  specialRoutes: Route[],
  routeManager: RouteManager,
) {
  // match each request and execute them
  const handler = async (request: Request) => {
    const route = routeManager.match(request, specialRoutes, port);
    if (route) {
      // don't use await because it will block the rest of the thread if any route takes a long time
      try {
        return await route.execute(request);
      } catch (exception) {
        const message = (typeof exception !== 'string')
          ? exception.message
          : exception;
        if (
          !message.toLowerCase().includes('forcibly closed') &&
          !message.toLowerCase().includes('connection was aborted')
        ) {
          // re-throw the exception because it's probably serious
          throw exception;
        } else {
          return new Response();
        }
      }
    } else {
      // new log saying the route wasn't found
      LogManager.newEntry(
        null,
        null,
        null,
        null,
        `requested route ${
          Route.getPath(request.url)
        }, method ${request.method} not found`,
      );
      return new Response('', {
        status: 404,
      });
    }
  };
  Deno.serve({ port, handler });
}

/**
 * Creates the UI html file
 */
function createUIFiles() {
  ////// DO NOT ALTER BELOW THIS LINE - IT IS THE STRING CONTENTS OF ../ui/ui.html & ../ui/ui.css AND SHOULD BE TREATED AS GENERATED CODE
  //deno-lint-ignore no-inferrable-types
  const uiHtml: string =
'<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/vite.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>Vite + Vue + TS</title>\n    <script type="module" crossorigin src="/assets/index-CgjqxnQb.js"></script>\n    <link rel="stylesheet" crossorigin href="/assets/index-DG_VaUly.css">\n  </head>\n  <body>\n    <div id="app"></div>\n  </body>\n</html>\n';
  //deno-lint-ignore no-inferrable-types
  const uiCss: string =
'\n:root{font-family:Inter,system-ui,Avenir,Helvetica,Arial,sans-serif;line-height:1.5;font-weight:400;color-scheme:light dark;color:#ffffffde;background-color:#242424;font-synthesis:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}a{font-weight:500;color:#646cff;text-decoration:inherit}a:hover{color:#535bf2}body{margin:0;display:flex;place-items:center;min-width:320px;min-height:100vh}h1{font-size:3.2em;line-height:1.1}button{border-radius:8px;border:1px solid transparent;padding:.6em 1.2em;font-size:1em;font-weight:500;font-family:inherit;background-color:#1a1a1a;cursor:pointer;transition:border-color .25s}button:hover{border-color:#646cff}button:focus,button:focus-visible{outline:4px auto -webkit-focus-ring-color}.card{padding:2em}#app{max-width:1280px;margin:0 auto;padding:2rem;text-align:center}@media (prefers-color-scheme: light){:root{color:#213547;background-color:#fff}a:hover{color:#747bff}button{background-color:#f9f9f9}}.read-the-docs[data-v-8fe7e3eb]{color:#888}.logo[data-v-cae44242]{height:6em;padding:1.5em;will-change:filter}.logo[data-v-cae44242]:hover{filter:drop-shadow(0 0 2em #646cffaa)}.logo.vue[data-v-cae44242]:hover{filter:drop-shadow(0 0 2em #42b883aa)}\n';
  //deno-lint-ignore no-inferrable-types
  const uiJs: string = '';
  ////// END GENERATED CODE
  try {
    emptyDirSync('./generated');
  } catch { /*no-op*/ }
  Deno.writeTextFileSync('./generated/ui.html', uiHtml);
  Deno.writeTextFileSync('./generated/ui.css', uiCss);
  Deno.writeTextFileSync('./generated/ui.js', uiJs);
}

function setupSpecialRoutes(
  configLocation: string,
  routeManager: RouteManager,
): Route[] {
  return [
    new UpdateConfigRoute(configLocation, routeManager),
    new UIRoute(),
    new FetchRoutesRoute(routeManager),
    new SaveRoutesRoute(configLocation, routeManager),
    new LogRoute(),
  ];
}
