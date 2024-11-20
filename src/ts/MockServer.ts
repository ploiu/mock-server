import { cyan, green, magenta } from '@std/fmt/colors';
import { emptyDirSync } from '@std/fs';
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
import { type ScriptDefinition, validateArgs } from '@ploiu/arg-helper';

import uiComponents from './generatedUi.ts';
import {
  LogRoute as NewLogRoute,
  LogTypes,
} from './request/specialRoutes/NewLogRoute.ts';

const definition: ScriptDefinition = {
  arguments: [
    {
      name: 'port',
      shortName: 'p',
      required: false,
      description:
        'The port number to run the mock server on. Defaults to 8000',
      validationFunction: (val) => !val || typeof val === 'number',
      validationFailedMessage: (val) => `Invalid port number ${val}`,
    },
    {
      name: 'config',
      shortName: 'c',
      required: false,
      description: 'the config file location to load config and routes from',
    },
    {
      name: 'load-ui',
      shortName: 'l',
      required: false,
      description: 'whether or not to load the browser ui. Defaults to true',
      validationFunction: (val) =>
        val === undefined || typeof val === 'boolean',
    },
  ],
  scriptDescription:
    'Starts up a mock server that allows you to intercept requests and return whatever response you want. You need to point your new requests to this server in order for it to function',
};

// different functionality if run from command line
if (import.meta.main) {
  const parsedArgs = validateArgs({ args: Deno.args, definition });
  const port = parsedArgs.port ?? parsedArgs.p ?? 8000;
  const configLocation: string = parsedArgs.config ?? parsedArgs.c ??
    './config.json';
  const loadUI: boolean = parsedArgs['load-ui'] ?? parsedArgs.l ?? true;
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
  try {
    emptyDirSync('./generated');
  } catch { /*no-op*/ }
  Deno.writeTextFileSync('./generated/ui.html', uiComponents.uiHtml);
  Deno.writeTextFileSync('./generated/ui.css', uiComponents.uiCss);
  Deno.writeTextFileSync('./generated/ui.js', uiComponents.uiJs);
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
    new NewLogRoute(),
  ];
}
