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
import FetchRoutesRoute from "./request/specialRoutes/FetchRoutesRoute.ts";

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
'<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Ploiu Mock Server</title>\n    <link rel="stylesheet" href="ui.css">\n</head>\n<body>\n<div id="main" class="container">\n    <h1>Ploiu Mock Server</h1>\n    <!--main area, this contains the route list and the editor panel for that route-->\n    <div id="edit-route-view" v-if="currentView === \'editRoute\'">\n        <div id="route-panel">\n            <div class="grid one-x-two">\n                <h3>Routes</h3>\n                <button class="primary outline">Save</button>\n            </div>\n            <ul class="route-list">\n                <li class="clickable" v-for="(route, index) in routes" :key="index"\n                    :class="{selected: selectedRoute === route}" @click="selectedRoute = route">\n                    {{route.title}}\n                </li>\n            </ul>\n        </div>\n        <div id="route-editor" v-if="selectedRoute.title ?? false">\n            <!--row with route name-->\n            <div id="route-name">\n                <h5>Route Name</h5>\n                <input v-model="selectedRoute.title" class="full-width">\n            </div>\n            <!--row with request method and url-->\n            <div id="method-and-url">\n                <h3>Current Route</h3>\n                <div class="input-group" id="method-url-bar">\n                    <select id="requestMethod" v-model="selectedRoute.method">\n                        <option :value="method" v-for="method in requestMethods">{{method}}</option>\n                    </select>\n                    <input type="text" id="requestUrl" v-model="selectedRoute.url" placeholder="url">\n                </div>\n            </div>\n            <!--row with response headers-->\n            <div id="response-headers">\n                <h5>Response Headers</h5>\n                <table>\n                    <thead>\n                    <tr>\n                        <th>Name</th>\n                        <th>Value</th>\n                    </tr>\n                    </thead>\n                    <tbody>\n                    <tr v-for="(header, index) in selectedRoute.responseHeaders" :key="index">\n                        <td>\n                            <input type="text" v-model="header.name">\n                        </td>\n                        <td>\n                            <input type="text" v-model="header.value">\n                        </td>\n                    </tr>\n                    </tbody>\n                </table>\n            </div>\n            <!--row with response body-->\n            <div id="response-body">\n                <h5>Response Body</h5>\n                <textarea v-model="selectedRoute.response" class="full-width"></textarea>\n            </div>\n        </div>\n    </div>\n</div>\n<script src="https://unpkg.com/vue@3.1.4"></script>\n<script>\n  const ui = {\n    data() {\n      return {\n        /** @type {Route[]}; the routes the user has set up*/\n        routes: [],\n        /** @type {Route}; the current route the user is editing*/\n        selectedRoute: {},\n        requestMethods: [\n          \'GET\', \'PUT\', \'POST\', \'DELETE\', \'HEAD\', \'CONNECT\', \'OPTIONS\', \'TRACE\', \'PATCH\'\n        ],\n        // the visible view for the UI\n        currentView: \'editRoute\'\n      }\n    },\n    methods: {\n      /** splits a header map into a list of single headers so that they can be edited on the UI*/\n      groupHeaders(headers = {}) {\n        const grouped = []\n        for (let [key, value] of Object.entries(headers)) {\n          grouped.push({\n            name: key,\n            value: value\n          })\n        }\n        // assign a new id for each grouped header\n        for (let i = 0; i < grouped.length; i++) {\n          grouped[i].id = i\n        }\n        return grouped\n      },\n      /** condenses a list of headers down into a single object to send back to the server */\n      condenseHeaders(headers = []) {\n        const condensed = {}\n        for (let grouped of headers) {\n          condensed[grouped.name] = grouped.value\n        }\n        return condensed\n      }\n    },\n    async mounted() {\n      const routes = await (await fetch(\'/mock-server-routes\')).json()\n      if (routes) {\n        for (let route of routes) {\n          route.responseHeaders = this.groupHeaders(route.responseHeaders)\n        }\n        this.routes = routes\n      }\n    }\n  }\n  Vue.createApp(ui).mount(\'#main\')\n</script>\n</body>\n</html>\n';
  const uiCss: string =':root {\n  --primary: #7C35AA;\n  --secondary: #8D99AE;\n  --success: #A5C882;\n  --error: #CD533B;\n  --body-background: #333;\n  --text: #dfd8e3;\n  --darker-background: #111;\n}\nbody,\nhtml {\n  width: 100%;\n  height: 100%;\n  background-color: var(--body-background);\n  overflow: hidden;\n  color: var(--text);\n  font-family: "Fira Code", Consolas, monospace;\n}\n.container {\n  padding: 0 2em;\n}\n#route-panel {\n  resize: horizontal;\n  border-right: 1px solid var(--secondary);\n  padding-right: 2em;\n  margin-right: 2em;\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n#route-panel .route-list {\n  list-style-type: none;\n  padding-left: 0;\n}\n#route-panel .route-list > li.clickable {\n  padding: 0.5em;\n  border-radius: 6px;\n  background-color: var(--darker-background);\n  margin: 0.5em 0;\n}\n#route-panel .route-list > li.clickable:hover {\n  background-color: var(--secondary);\n  cursor: pointer;\n}\n#route-panel .route-list > li.clickable.selected {\n  background-color: var(--primary);\n}\n#edit-route-view {\n  display: grid;\n  grid-auto-columns: 20% 80%;\n}\n#route-editor {\n  grid-column-start: 2;\n  grid-column-end: 3;\n  display: grid;\n  grid-auto-columns: auto auto auto;\n  grid-auto-rows: auto auto auto auto;\n}\n#route-editor #method-and-url #route-name {\n  grid-row-start: 1;\n  grid-row-end: 2;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\n#route-editor #method-and-url #method-url-bar {\n  grid-row-start: 2;\n  grid-row-end: 3;\n  display: grid;\n  grid-auto-columns: 10% auto;\n}\n#route-editor #method-and-url #method-url-bar > select {\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n#route-editor #method-and-url #method-url-bar > input {\n  grid-column-start: 2;\n  grid-column-end: 3;\n}\n#route-editor #method-and-url #response-headers {\n  grid-row-start: 3;\n  grid-row-end: 4;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\n#route-editor #method-and-url #response-body {\n  grid-row-start: 4;\n  grid-row-end: 5;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\nselect,\ninput,\ntextarea {\n  border-radius: 6px;\n  padding: 1em;\n  background-color: var(--darker-background);\n  color: var(--text);\n  border-color: var(--secondary);\n  border-width: 1px;\n  border-style: solid;\n}\nselect:focus,\ninput:focus,\ntextarea:focus {\n  border-color: var(--primary);\n  outline: none;\n}\nselect.full-width,\ninput.full-width,\ntextarea.full-width {\n  width: 98%;\n}\n.input-group > select:first-child,\n.input-group input:first-child {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n  border-right: none;\n}\n.input-group > select:not(:first-child),\n.input-group input:not(:first-child) {\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.input-group > select:last-child,\n.input-group input:last-child {\n  border-top-right-radius: 6px;\n  border-bottom-right-radius: 6px;\n}\ntable {\n  width: 100%;\n}\ntable td > input {\n  width: 95%;\n}\nbutton {\n  padding: 0.5em 1.25em;\n  border-style: solid;\n  cursor: pointer;\n  border-radius: 6px;\n}\nbutton.primary {\n  background-color: #7C35AA;\n  border-color: #602983;\n}\nbutton.primary:hover {\n  background-color: #6e2f97;\n}\nbutton.primary:active {\n  background-color: #602983;\n}\nbutton.primary.outline {\n  background-color: transparent;\n  color: #7C35AA;\n  border-color: #7C35AA;\n}\nbutton.primary.outline:hover {\n  background-color: #7C35AA;\n  color: #83ca55;\n}\nbutton.primary.outline:active {\n  background-color: #602983;\n}\nbutton.secondary {\n  background-color: #8D99AE;\n  border-color: #6f7e99;\n}\nbutton.secondary:hover {\n  background-color: #7e8ca3;\n}\nbutton.secondary:active {\n  background-color: #6f7e99;\n}\nbutton.secondary.outline {\n  background-color: transparent;\n  color: #8D99AE;\n  border-color: #8D99AE;\n}\nbutton.secondary.outline:hover {\n  background-color: #8D99AE;\n  color: #726651;\n}\nbutton.secondary.outline:active {\n  background-color: #6f7e99;\n}\nbutton.success {\n  background-color: #A5C882;\n  border-color: #8cb85f;\n}\nbutton.success:hover {\n  background-color: #98c070;\n}\nbutton.success:active {\n  background-color: #8cb85f;\n}\nbutton.success.outline {\n  background-color: transparent;\n  color: #A5C882;\n  border-color: #A5C882;\n}\nbutton.success.outline:hover {\n  background-color: #A5C882;\n  color: #5a377d;\n}\nbutton.success.outline:active {\n  background-color: #8cb85f;\n}\nbutton.error {\n  background-color: #CD533B;\n  border-color: #aa402b;\n}\nbutton.error:hover {\n  background-color: #be4830;\n}\nbutton.error:active {\n  background-color: #aa402b;\n}\nbutton.error.outline {\n  background-color: transparent;\n  color: #CD533B;\n  border-color: #CD533B;\n}\nbutton.error.outline:hover {\n  background-color: #CD533B;\n  color: #32acc4;\n}\nbutton.error.outline:active {\n  background-color: #aa402b;\n}\n.grid {\n  display: grid;\n}\n.grid.one-x-two {\n  grid-template-rows: auto;\n  grid-template-columns: auto auto;\n}\n/*# sourceMappingURL=ui.css.map */';
  ////// END GENERATED CODE
  try {
    Deno.removeSync("./ui.html");
    Deno.removeSync("./ui.css");
  } catch (e) {
  }
  Deno.writeTextFileSync("./ui.html", uiHtml);
  Deno.writeTextFileSync("./ui.css", uiCss);
}

function setupSpecialRoutes(
  configLocation: string,
  routeManager: RouteManager,
): Route[] {
  return [
    new UpdateConfigRoute(configLocation, routeManager),
    new UIRoute(routeManager),
    new FetchRoutesRoute(routeManager),
  ];
}
