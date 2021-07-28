import {
  Response,
  serve,
  Server,
} from "https://deno.land/std@0.100.0/http/mod.ts";
import { parse } from "https://deno.land/std@0.100.0/flags/mod.ts";
import { emptyDirSync } from "https://deno.land/std@0.100.0/fs/mod.ts";
import Config from "./config/Config.ts";
import { readConfigFile } from "./config/ConfigManager.ts";
import {
  cyan,
  green,
  magenta,
} from "https://deno.land/std@0.100.0/fmt/colors.ts";
import RouteManager from "./request/RouteManager.ts";
import Route from "./request/Route.ts";
import UpdateConfigRoute from "./request/specialRoutes/UpdateConfigRoute.ts";
import UIRoute from "./request/specialRoutes/UIRoute.ts";
import FetchRoutesRoute from "./request/specialRoutes/FetchRoutesRoute.ts";
import SaveRoutesRoute from "./request/specialRoutes/SaveRoutesRoute.ts";
import LogRoute from "./request/specialRoutes/LogRoute.ts";
import { LogManager } from "./LogManager.ts";

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
    createUIFiles();
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
  await startServing(server, specialRoutes, routeManager);
}

/**
 * Listens for requests on the server and responds to them in kind until the server is closed
 * @param server
 * @param specialRoutes
 * @param routeManager
 */
async function startServing(
  server: Server,
  specialRoutes: Route[],
  routeManager: RouteManager,
) {
  // match each request and execute them
  for await (let request of server) {
    const route = routeManager.match(request, specialRoutes);
    if (route) {
      // don't use await because it will block the rest of the thread if any route takes a long time
      route.execute(request).then((data: Response) => {
        request.respond(data).catch((e) => {
          const message = (typeof e !== "string") ? e.message : e;
          if (
            !message.toLowerCase().includes("forcibly closed") &&
            !message.toLowerCase().includes("connection was aborted")
          ) {
            // re-throw the exception because it's probably serious
            throw e;
          }
        });
      })
        .catch((exception: Error | string) => {
          const message = (typeof exception !== "string")
            ? exception.message
            : exception;
          if (
            !message.toLowerCase().includes("forcibly closed") &&
            !message.toLowerCase().includes("connection was aborted")
          ) {
            // re-throw the exception because it's probably serious
            throw exception;
          }
        });
    } else {
      // new log saying the route wasn't found
      LogManager.newEntry(
        null,
        null,
        null,
        `requested route ${request.url}, method ${request.method} not found`,
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
function createUIFiles() {
  ////// DO NOT ALTER BELOW THIS LINE - IT IS THE STRING CONTENTS OF ../ui/ui.html & ../ui/ui.css AND SHOULD BE TREATED AS GENERATED CODE
  const uiHtml: string =
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Ploiu Mock Server</title>\n    <link rel="stylesheet" href="ui.css">\n</head>\n<body>\n<div id="main" class="container">\n    <h1 style="display: inline-block">Ploiu Mock Server</h1>\n    <!--buttons that change the view-->\n    <div class="button-list" style="display: inline-block; margin-left: 2em;">\n        <button id="edit-route-view-button" class="primary" :class="{outline: currentView !== \'editRoute\'}" @click="switchView(\'editRoute\')">Edit Routes</button>\n        <button id="view-logs-view-button" class="success" :class="{outline: currentView !== \'viewLogs\'}" @click="switchView(\'viewLogs\')">View Route Log</button>\n    </div>\n    <!--route list and edit route view-->\n    <div id="edit-route-view" class="view" v-if="currentView === \'editRoute\'">\n        <div id="route-panel">\n            <div class="grid one-x-two">\n                <h3>Routes</h3>\n                <button class="primary outline" @click="save()" id="save-button">Save</button>\n            </div>\n            <ul id="route-panel-list" class="route-list">\n                <div v-for="(route, index) in routes" :key="index" class="grid one-x-two align-center">\n                    <li class="clickable"\n                        :class="{selected: selectedRoute === route, \'col-1\': true}" @click="selectedRoute = route">\n                        {{route.title}}\n                    </li>\n                    <button class="error col-2" @click="removeRoute(route)">Delete</button>\n                </div>\n            </ul>\n            <!--button to add new route-->\n            <button class="secondary outline" @click="addNew()" id="add-new-button">Add New</button>\n        </div>\n        <!--panel to edit routes-->\n        <div id="route-editor" v-if="selectedRoute !== null">\n            <h3>Current Route</h3>\n            <!--row with route name-->\n            <div id="route-name">\n                <h5>Route Name & Status</h5>\n                <div class="input-group grid one-x-two">\n                    <input v-model="selectedRoute.title" class="col-1" id="route-name-input">\n                    <input type="number" v-model="selectedRoute.responseStatus" placeholder="status code" class="col-2"\n                           id="route-status-code-input">\n                </div>\n            </div>\n            <!--row with request method and url-->\n            <div id="method-and-url">\n                <h5>Method & URL</h5>\n                <div class="input-group" id="method-url-bar">\n                    <select id="route-request-method-input" v-model="selectedRoute.method">\n                        <option :value="method" v-for="method in requestMethods">{{method}}</option>\n                    </select>\n                    <input type="text" id="route-request-url" v-model="selectedRoute.url" placeholder="url">\n                </div>\n            </div>\n            <!--row with response headers-->\n            <div id="response-headers">\n                <h5>Response Headers</h5>\n                <table>\n                    <thead>\n                    <tr>\n                        <th>Name</th>\n                        <th>Value</th>\n                    </tr>\n                    </thead>\n                    <tbody>\n                    <tr v-for="(header, index) in selectedRoute.responseHeaders" :key="index">\n                        <td>\n                            <input type="text" v-model="header.name" class="header-title">\n                        </td>\n                        <td>\n                            <input type="text" v-model="header.value" class="header-value">\n                        </td>\n                        <td>\n                            <button class="error header-remove-button" @click="removeHeader(header)">Delete</button>\n                        </td>\n                    </tr>\n                    </tbody>\n                </table>\n                <button class="secondary" @click="addHeader()" id="add-header-button">Add Header</button>\n            </div>\n            <!--row with response body-->\n            <div id="response-body">\n                <h5>Response Body</h5>\n                <textarea v-model="selectedRoute.response" class="full-width" id="response-body-input"></textarea>\n            </div>\n        </div>\n    </div>\n    <!--hit routes view-->\n    <div id="route-log-view" class="view" v-if="currentView === \'viewLogs\'">\n        <button class="error" id="clear-logs-button" @click="clearLogs()">Clear Logs</button>\n        <div id="logArea" class="log-panel">\n            <div class="log" v-for="log in logs">\n                <span class="timestamp">{{log.timestamp}}</span>\n                <span class="method" v-if="log.method" :class="log.method.toLowerCase()">{{log.method}}</span>\n                <span class="url" v-if="log.url">{{log.url}}</span>\n                <span class="message" v-if="log.message">{{log.message}}</span>\n            </div>\n        </div>\n    </div>\n    <div id="messageBar" class="info-message" :class="messageType, {visible: message !== null}">{{message}}</div>\n</div>\n<script src="https://unpkg.com/vue@3.1.4"></script>\n<!--intellij might say this file doesn\'t exist, but it gets generated before startup-->\n<script src="ui.js" type="module"></script>\n</body>\n</html>\n';
  const uiCss: string =
    ':root {\n  --primary: #7C35AA;\n  --secondary: #8D99AE;\n  --success: #A5C882;\n  --error: #CD533B;\n  --body-background: #333;\n  --text: #dfd8e3;\n  --darker-background: #111;\n  --border-radius: 6px;\n}\nbody,\nhtml {\n  width: 100%;\n  height: 100%;\n  background-color: var(--body-background);\n  overflow: hidden;\n  color: var(--text);\n  font-family: "Fira Code", Consolas, monospace;\n}\n.container {\n  padding: 0 2em;\n  height: 80%;\n}\n#route-panel {\n  resize: horizontal;\n  overflow-y: auto;\n  border-right: 1px solid var(--secondary);\n  padding-right: 2em;\n  margin-right: 2em;\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n#route-panel .route-list {\n  list-style-type: none;\n  padding-left: 0;\n}\n#route-panel .route-list li.clickable {\n  padding: 0.5em;\n  border-radius: 6px;\n  background-color: var(--darker-background);\n  margin: 0.5em 0;\n  white-space: break-spaces;\n  word-break: break-word;\n}\n#route-panel .route-list li.clickable:hover {\n  background-color: var(--secondary);\n  cursor: pointer;\n}\n#route-panel .route-list li.clickable.selected {\n  background-color: var(--primary);\n}\n#edit-route-view {\n  display: grid;\n  grid-auto-columns: 20% 80%;\n}\n#route-editor {\n  grid-column-start: 2;\n  grid-column-end: 3;\n  display: grid;\n  grid-auto-columns: auto auto auto;\n  grid-auto-rows: auto auto auto auto;\n  overflow-y: auto;\n  overflow-x: hidden;\n}\n#route-editor #method-and-url #route-name {\n  grid-row-start: 1;\n  grid-row-end: 2;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\n#route-editor #method-and-url #method-url-bar {\n  grid-row-start: 2;\n  grid-row-end: 3;\n  display: grid;\n  grid-auto-columns: 10% auto;\n}\n#route-editor #method-and-url #method-url-bar > select {\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n#route-editor #method-and-url #method-url-bar > input {\n  grid-column-start: 2;\n  grid-column-end: 3;\n}\n#route-editor #method-and-url #response-headers {\n  grid-row-start: 3;\n  grid-row-end: 4;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\n#route-editor #method-and-url #response-body {\n  grid-row-start: 4;\n  grid-row-end: 5;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\nselect,\ninput,\ntextarea {\n  border-radius: 6px;\n  padding: 1em;\n  background-color: var(--darker-background);\n  color: var(--text);\n  border-color: var(--secondary);\n  border-width: 1px;\n  border-style: solid;\n}\nselect:focus,\ninput:focus,\ntextarea:focus {\n  border-color: var(--primary);\n  outline: none;\n}\nselect.full-width,\ninput.full-width,\ntextarea.full-width {\n  width: 98%;\n}\ntextarea {\n  resize: vertical;\n}\n.input-group > select:first-child,\n.input-group input:first-child {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n  border-right: none;\n}\n.input-group > select:not(:first-child),\n.input-group input:not(:first-child) {\n  border-top-left-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.input-group > select:last-child,\n.input-group input:last-child {\n  border-top-right-radius: 6px;\n  border-bottom-right-radius: 6px;\n}\ntable {\n  width: 100%;\n}\ntable td > input {\n  width: 95%;\n}\nbutton {\n  padding: 0.5em 1.25em;\n  border-style: solid;\n  cursor: pointer;\n  border-radius: 6px;\n}\nbutton.primary {\n  background-color: #7C35AA;\n  border-color: #602983;\n}\nbutton.primary:hover {\n  background-color: #6e2f97;\n}\nbutton.primary:active {\n  background-color: #602983;\n}\nbutton.primary.outline {\n  background-color: transparent;\n  color: #7C35AA;\n  border-color: #7C35AA;\n}\nbutton.primary.outline:hover {\n  background-color: #7C35AA;\n  color: #83ca55;\n}\nbutton.primary.outline:active {\n  background-color: #602983;\n}\nbutton.secondary {\n  background-color: #8D99AE;\n  border-color: #6f7e99;\n}\nbutton.secondary:hover {\n  background-color: #7e8ca3;\n}\nbutton.secondary:active {\n  background-color: #6f7e99;\n}\nbutton.secondary.outline {\n  background-color: transparent;\n  color: #8D99AE;\n  border-color: #8D99AE;\n}\nbutton.secondary.outline:hover {\n  background-color: #8D99AE;\n  color: #726651;\n}\nbutton.secondary.outline:active {\n  background-color: #6f7e99;\n}\nbutton.success {\n  background-color: #A5C882;\n  border-color: #8cb85f;\n}\nbutton.success:hover {\n  background-color: #98c070;\n}\nbutton.success:active {\n  background-color: #8cb85f;\n}\nbutton.success.outline {\n  background-color: transparent;\n  color: #A5C882;\n  border-color: #A5C882;\n}\nbutton.success.outline:hover {\n  background-color: #A5C882;\n  color: #5a377d;\n}\nbutton.success.outline:active {\n  background-color: #8cb85f;\n}\nbutton.error {\n  background-color: #CD533B;\n  border-color: #aa402b;\n}\nbutton.error:hover {\n  background-color: #be4830;\n}\nbutton.error:active {\n  background-color: #aa402b;\n}\nbutton.error.outline {\n  background-color: transparent;\n  color: #CD533B;\n  border-color: #CD533B;\n}\nbutton.error.outline:hover {\n  background-color: #CD533B;\n  color: #32acc4;\n}\nbutton.error.outline:active {\n  background-color: #aa402b;\n}\n.grid {\n  display: grid;\n}\n.grid.align-center {\n  align-items: center;\n}\n.grid.one-x-two {\n  grid-template-rows: auto;\n  grid-template-columns: auto auto;\n}\n.grid .col-1 {\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n.grid .col-2 {\n  grid-column-start: 2;\n  grid-column-end: 3;\n}\n.info-message {\n  position: absolute;\n  bottom: 0;\n  left: 25%;\n  right: 25%;\n  text-align: center;\n  padding: 1em;\n  transition: bottom 0.25s linear;\n  border-radius: 6px;\n}\n.info-message.visible {\n  bottom: 15%;\n  transition: bottom 0.25s ease-out;\n}\n.info-message.primary {\n  background-color: #7C35AA;\n  color: #271135;\n  border: 1px solid #271135;\n}\n.info-message.secondary {\n  background-color: #8D99AE;\n  color: #434d5f;\n  border: 1px solid #434d5f;\n}\n.info-message.success {\n  background-color: #A5C882;\n  color: #597b36;\n  border: 1px solid #597b36;\n}\n.info-message.error {\n  background-color: #CD533B;\n  color: #582117;\n  border: 1px solid #582117;\n}\n.button-list {\n  margin-bottom: 2em;\n}\n.button-list > button {\n  border-radius: 0;\n}\n.button-list > button:first-child {\n  border-top-left-radius: 6px;\n  border-bottom-left-radius: 6px;\n}\n.button-list > button:last-child {\n  border-top-right-radius: 6px;\n  border-bottom-right-radius: 6px;\n}\n* .text-primary {\n  color: #7C35AA;\n}\n* .text-secondary {\n  color: #8D99AE;\n}\n* .text-success {\n  color: #A5C882;\n}\n* .text-error {\n  color: #CD533B;\n}\n.view {\n  height: 100%;\n  width: 100%;\n}\n#route-log-view .log-panel {\n  padding: 2em;\n  background-color: #111;\n  border-radius: 6px;\n  height: 95%;\n  overflow-y: auto;\n}\n#route-log-view .log-panel .log {\n  margin: 1em 0;\n  display: grid;\n  grid-auto-columns: 13% 6% auto;\n}\n#route-log-view .log-panel .log > .timestamp {\n  font-style: italic;\n  color: #8D99AE;\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n#route-log-view .log-panel .log > .message {\n  color: #CD533B;\n  margin-left: 1rem;\n  grid-column-start: 2;\n  grid-column-end: 4;\n}\n#route-log-view .log-panel .log > .method {\n  color: #111;\n  padding: 0.25em;\n  border-radius: 6px;\n  margin-left: 1rem;\n  grid-column-start: 2;\n  grid-column-end: 3;\n  text-align: center;\n}\n#route-log-view .log-panel .log > .method.get {\n  background-color: #A5C882;\n}\n#route-log-view .log-panel .log > .method.post {\n  background-color: #FBAF00;\n}\n#route-log-view .log-panel .log > .method.put {\n  background-color: #3F84E5;\n}\n#route-log-view .log-panel .log > .method.head {\n  background-color: #42c67c;\n}\n#route-log-view .log-panel .log > .method.delete {\n  background-color: #CD533B;\n}\n#route-log-view .log-panel .log > .method.connect {\n  background-color: plum;\n}\n#route-log-view .log-panel .log > .method.options {\n  background-color: lightseagreen;\n}\n#route-log-view .log-panel .log > .method.trace {\n  background-color: #b313b0;\n}\n#route-log-view .log-panel .log > .method.patch {\n  background-color: #5f5d9e;\n}\n#route-log-view .log-panel .log > .url {\n  grid-column-start: 3;\n  grid-column-end: 4;\n  margin-left: 1rem;\n}\n/*# sourceMappingURL=ui.css.map */';
  const uiJs: string =
    'const ui = {\n  data() {\n    return {\n      /** @type {Route[]}; the routes the user has set up*/\n      routes: [],\n      /** @type {Route}; the current route the user is editing*/\n      selectedRoute: null,\n      requestMethods: [\n        "GET",\n        "PUT",\n        "POST",\n        "DELETE",\n        "HEAD",\n        "CONNECT",\n        "OPTIONS",\n        "TRACE",\n        "PATCH",\n      ],\n      // the visible view for the UI\n      currentView: "editRoute",\n      // informational message\n      message: null,\n      messageType: null,\n      logs: [],\n      dateFormat: new Intl.DateTimeFormat("en-US", {\n        year: "numeric",\n        month: "2-digit",\n        day: "2-digit",\n        hour: "2-digit",\n        minute: "2-digit",\n        second: "2-digit",\n      }),\n    };\n  },\n  methods: {\n    /** splits a header map into a list of single headers so that they can be edited on the UI*/\n    groupHeaders(headers = {}) {\n      const grouped = [];\n      for (let [key, value] of Object.entries(headers)) {\n        grouped.push({\n          name: key,\n          value: value,\n        });\n      }\n      // assign a new id for each grouped header\n      for (let i = 0; i < grouped.length; i++) {\n        grouped[i].id = i;\n      }\n      return grouped;\n    },\n    /** condenses a list of headers down into a single object to send back to the server */\n    condenseHeaders(headers = []) {\n      const condensed = {};\n      for (let grouped of headers) {\n        condensed[grouped.name] = grouped.value;\n      }\n      return condensed;\n    },\n    /** creates a new route object, adds it to our route list, and sets it as the selected route */\n    addNew() {\n      const route = {};\n      this.routes.push(route);\n      this.selectedRoute = route;\n    },\n    removeRoute(route) {\n      this.routes = this.routes.filter((it) => it !== route);\n      if (this.selectedRoute === route) {\n        this.selectedRoute = null;\n      }\n    },\n    /** adds a new header to the currently selected route */\n    addHeader() {\n      this.selectedRoute.responseHeaders = this.selectedRoute.responseHeaders ??\n        [];\n      const header = {\n        name: null,\n        value: null,\n        id: this.selectedRoute.responseHeaders.length,\n      };\n      this.selectedRoute.responseHeaders.push(header);\n    },\n    removeHeader(header) {\n      this.selectedRoute.responseHeaders = this.selectedRoute.responseHeaders\n        .filter((it) => it !== header);\n    },\n    /** saves our routes to our config file and refreshes the routes */\n    async save() {\n      // clone the routes TODO find a better way\n      const routes = JSON.parse(JSON.stringify(this.routes));\n      // condense the headers of each route\n      for (let route of routes) {\n        route.responseHeaders = this.condenseHeaders(route.responseHeaders);\n      }\n      const saveResult = await (await fetch("/mock-ui-save-routes", {\n        method: "POST",\n        body: JSON.stringify(routes),\n      })).json();\n      if (saveResult.success) {\n        this.showMessage("Successfully saved routes", "success");\n      } else {\n        this.showMessage(\n          "Failed to save routes, check server logs for details.",\n          "error",\n        );\n      }\n    },\n    /**\n         * shows the message bar at the bottom of the screen, and then hides it after 3 seconds\n         * @param {string} message\n         * @param {string} messageType\n         */\n    showMessage(message, messageType) {\n      this.message = message;\n      this.messageType = messageType;\n      // show the message for a bit and then hide it\n      window.setTimeout(() => {\n        this.message = null;\n        this.messageType = null;\n      }, 3_000);\n    },\n    /** switches our currentView to the passed viewName */\n    switchView(viewName) {\n      this.currentView = viewName;\n    },\n    /**\n         * adds a single log to our log list\n         * @param {{url: string, method: string, body: any | null, timestamp: Number | string}} log\n         */\n    addLog(log) {\n      log.timestamp = this.dateFormat.format(log.timestamp);\n      this.logs.push(log);\n    },\n    /** removes all logs from our list */\n    clearLogs() {\n      this.logs.splice(0, this.logs.length);\n    },\n    /**\n         * Scrolls our log panel to the bottom of its contents\n         */\n    scrollLogPanel() {\n      const logPanel = document.querySelector("#logArea");\n      logPanel?.scrollTo(0, logPanel.scrollHeight);\n    },\n  },\n  async mounted() {\n    const routes = await (await fetch("/mock-server-routes")).json();\n    if (routes) {\n      for (let route of routes) {\n        route.responseHeaders = this.groupHeaders(route.responseHeaders);\n      }\n      this.routes = routes;\n    }\n    // set up an event source to retrieve logs\n    const source = new EventSource("/logs");\n    source.onmessage = (event) => {\n      const data = JSON.parse(event.data);\n      if (data.length > 0) {\n        for (const log of data) {\n          this.addLog(log);\n        }\n        this.$nextTick(() => {\n          this.scrollLogPanel();\n        });\n      }\n    };\n  },\n};\nVue.createApp(ui).mount("#main");\n';
  ////// END GENERATED CODE
  try {
    emptyDirSync("./generated");
  } catch (e) {
  }
  Deno.writeTextFileSync("./generated/ui.html", uiHtml);
  Deno.writeTextFileSync("./generated/ui.css", uiCss);
  Deno.writeTextFileSync("./generated/ui.js", uiJs);
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
