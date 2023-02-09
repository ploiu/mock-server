import { cyan, emptyDirSync, green, magenta, parse, Server } from './deps.ts';
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
  const server = new Server({ port, handler });
  server.listenAndServe();
}

/**
 * Creates the UI html file
 */
function createUIFiles() {
  ////// DO NOT ALTER BELOW THIS LINE - IT IS THE STRING CONTENTS OF ../ui/ui.html & ../ui/ui.css AND SHOULD BE TREATED AS GENERATED CODE
  //deno-lint-ignore no-inferrable-types
  const uiHtml: string =
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <title>Ploiu Mock Server</title>\n    <link rel="stylesheet" href="ui.css">\n</head>\n<body>\n<div id="main" class="container">\n    <h1 style="display: inline-block">Ploiu Mock Server</h1>\n    <!--buttons that change the view-->\n    <div class="button-list" style="display: inline-block; margin-left: 2em;">\n        <button id="edit-route-view-button" class="primary" :class="{outline: currentView !== \'editRoute\'}"\n                @click="switchView(\'editRoute\')">Edit Routes\n        </button>\n        <button id="view-logs-view-button" class="success" :class="{outline: currentView !== \'viewLogs\'}"\n                @click="switchView(\'viewLogs\')">View Route Log\n        </button>\n    </div>\n    <!--route list and edit route view-->\n    <div id="edit-route-view" class="view" v-if="currentView === \'editRoute\'">\n        <div id="route-panel">\n            <div class="grid one-x-two">\n                <h3>Routes</h3>\n                <button class="primary outline" @click="save()" id="save-button">Save</button>\n            </div>\n            <ul id="route-panel-list" class="route-list">\n                <div v-for="(route, index) in routes" :key="index" class="grid one-x-two align-center">\n                    <li class="clickable"\n                        :class="{selected: selectedRoute === route, \'col-1\': true, disabled: !route.isEnabled}" @click="selectedRoute = route">\n                        {{route.title}}\n                    </li>\n                    <button class="error col-2" @click="removeRoute(route)">Delete</button>\n                </div>\n            </ul>\n            <!--button to add new route-->\n            <button class="secondary outline" @click="addNew()" id="add-new-button">Add New</button>\n        </div>\n        <!--panel to edit routes-->\n        <div id="route-editor" v-if="selectedRoute !== null">\n            <h3>Current Route</h3>\n           <div>\n               <button id="route-enable-toggle-button"\n                       v-if="selectedRoute"\n                       :class="{success: selectedRoute.isEnabled, error: !selectedRoute.isEnabled}"\n                       @click="selectedRoute.isEnabled = !selectedRoute.isEnabled">\n                   {{selectedRoute.isEnabled ? \'Enabled\' : \'Disabled\'}}\n               </button>\n           </div>\n            <!--row with route name-->\n            <div id="route-name">\n                <h5>Route Name, Status, and Type</h5>\n                <div class="input-group grid one-x-three">\n                    <input v-model="selectedRoute.title" class="col-1" id="route-name-input">\n                    <input type="number" v-model="selectedRoute.responseStatus" placeholder="status code" class="col-2"\n                           id="route-status-code-input">\n                    <select v-model="selectedRoute.routeType" id="route-type-select" class="col-3">\n                        <option v-for="type in routeTypes" :value="type">{{type}}</option>\n                    </select>\n                </div>\n            </div>\n            <!--row with request method and url-->\n            <div id="method-and-url">\n                <h5>Method & URL</h5>\n                <div class="input-group" id="method-url-bar">\n                    <select id="route-request-method-input" v-model="selectedRoute.method">\n                        <option :value="method" v-for="method in requestMethods">{{method}}</option>\n                    </select>\n                    <input type="text" id="route-request-url" v-model="selectedRoute.url" placeholder="url">\n                </div>\n            </div>\n            <!--row with response headers-->\n            <div id="response-headers" v-if="selectedRoute.routeType !== \'pass-through\'">\n                <h5>Response Headers</h5>\n                <table>\n                    <thead>\n                    <tr>\n                        <th>Name</th>\n                        <th>Value</th>\n                    </tr>\n                    </thead>\n                    <tbody>\n                    <tr v-for="(header, index) in selectedRoute.responseHeaders" :key="index">\n                        <td>\n                            <input type="text" v-model="header.name" class="header-title">\n                        </td>\n                        <td>\n                            <input type="text" v-model="header.value" class="header-value">\n                        </td>\n                        <td>\n                            <button class="error header-remove-button" @click="removeHeader(header)">Delete</button>\n                        </td>\n                    </tr>\n                    </tbody>\n                </table>\n                <button class="secondary" @click="addHeader()" id="add-header-button">Add Header</button>\n            </div>\n            <!--row with response body-->\n            <div id="response-body" v-if="selectedRoute.routeType !== \'pass-through\'">\n                <h5>Response Body</h5>\n                <textarea v-model="selectedRoute.response" class="full-width" id="response-body-input"></textarea>\n            </div>\n            <!--row with redirect url-->\n            <div id="redirect-url" v-if="selectedRoute.routeType === \'pass-through\'">\n                <h5>Redirect URL</h5>\n                <input type="url" id="redirect-url-input" v-model="selectedRoute.redirectUrl">\n            </div>\n        </div>\n    </div>\n    <!--hit routes view-->\n    <div id="route-log-view" class="view" v-if="currentView === \'viewLogs\'">\n        <button class="error" id="clear-logs-button" @click="clearLogs()">Clear Logs</button>\n        <div id="logArea" class="log-panel">\n            <accordion-element v-for="(log, i) in logs" :key="i" class="log" :class="log.method?.toLowerCase()">\n                <div class="ploiu-accordion-title">\n                    <span class="timestamp">{{log.timestamp}}</span>\n                    <span class="method" v-if="log.method" :class="log.method.toLowerCase()">{{log.method}}</span>\n                    <span class="url" v-if="log.url">{{log.url}}</span>\n                    <span class="message" v-if="log.message">{{log.message}}</span>\n                </div>\n                <accordion-fan>\n                    <accordion-element v-if="!log.message" data-request-headers data-title="Request Headers">\n                        <div v-for="(value, key) in log.headers" style="word-wrap: anywhere">\n                            <span class="text-primary">{{key}}</span><span>: </span><span class="text-secondary">{{value}}</span>\n                        </div>\n                    </accordion-element>\n                    <accordion-element v-if="!log.message" data-request-body data-title="Request Body">\n                        {{log.body}}\n                    </accordion-element>\n                </accordion-fan>\n            </accordion-element>\n        </div>\n    </div>\n    <div id="messageBar" class="info-message" :class="messageType, {visible: message !== null}">{{message}}</div>\n</div>\n<script src="https://unpkg.com/vue@3.2.26/dist/vue.global.js"></script>\n<!--intellij might say this file doesn\'t exist, but it gets generated before startup-->\n<script src="ui.js" type="module"></script>\n</body>\n</html>\n';
  //deno-lint-ignore no-inferrable-types
  const uiCss: string =
    '\n/*MIT License\n\nCopyright (c) 2022 ploiu\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n*/\n:root{--accordion-title-background:#f9f9f9;--accordion-body-border-color:transparent;--accordion-expand-rate:0.25s;--accordion-open-title-background:#f1f1f1;--accordion-border-radius:4px;--accordion-fan-accordion-border-style:1px solid #DDD;--accordion-title-text-transform:capitalize}accordion-element{width:95%;margin-top:.1em;display:inline-block;height:unset;border-radius:var(--accordion-border-radius)}accordion-element>.ploiu-accordion-title{padding:1rem;background-color:var(--accordion-title-background);text-transform:var(--accordion-title-text-transform);border-radius:inherit}accordion-element>.ploiu-accordion-title:hover{cursor:pointer}accordion-element>.ploiu-accordion-body{border:1px solid var(--accordion-body-border-color);width:95%;transition:height var(--accordion-expand-rate);word-wrap:anywhere;overflow:hidden}accordion-element>.ploiu-accordion-body>accordion-element{margin-left:1em}accordion-element:not(.open)>.ploiu-accordion-body{height:0!important;border:0}accordion-element.open{height:max-content}accordion-element.open>.ploiu-accordion-title{background-color:var(--accordion-open-title-background);border-bottom-left-radius:0;border-bottom-right-radius:0}accordion-fan{display:block;width:95%;padding-top:1vh}accordion-fan>accordion-element{margin-top:-1vh;border:var(--accordion-fan-accordion-border-style);border-radius:0;width:100%}accordion-fan>accordion-element>.ploiu-accordion-title{width:auto}accordion-fan>accordion-element:first-child{border-top-left-radius:var(--accordion-border-radius);border-top-right-radius:var(--accordion-border-radius)}accordion-fan>accordion-element:last-child{border-bottom-left-radius:var(--accordion-border-radius);border-bottom-right-radius:var(--accordion-border-radius)}\n\n:root {\n  --primary: #7C35AA;\n  --primary-darker: #6e2f97;\n  --primary-darkest: #602983;\n  --secondary: #8D99AE;\n  --secondary-darker: #7e8ca3;\n  --secondary-darkest: #6f7e99;\n  --success: #A5C882;\n  --success-darker: #98c070;\n  --success-darkest: #8cb85f;\n  --error: #CD533B;\n  --error-darker: #be4830;\n  --error-darkest: #aa402b;\n  --color-get: #A5C882;\n  --color-post: #FBAF00;\n  --color-put: #3F84E5;\n  --color-head: #42c67c;\n  --color-delete: #CD533B;\n  --color-connect: plum;\n  --color-options: lightseagreen;\n  --color-trace: #b313b0;\n  --color-patch: #5f5d9e;\n  --body-background: #333;\n  --text: #dfd8e3;\n  --darker-background: #111;\n  --border-radius: 6px;\n  --accordion-title-background: #333;\n  --accordion-border-radius: 6px;\n  --accordion-open-title-background: #333;\n  --accordion-fan-accordion-border-style: 1px solid #111;\n}\nbody,\nhtml {\n  width: 100%;\n  height: 100%;\n  background-color: #333;\n  overflow: hidden;\n  color: #dfd8e3;\n  font-family: "Fira Code", Consolas, monospace;\n}\n.container {\n  padding: 0 2em;\n  height: 80%;\n}\n#route-panel {\n  border-right: 1px solid #8D99AE;\n  padding-right: 2em;\n  margin-right: 2em;\n  grid-column-start: 1;\n  grid-column-end: 2;\n  max-height: 85vh;\n}\n#route-panel .route-list {\n  list-style-type: none;\n  padding-left: 0;\n  overflow-y: auto;\n  max-height: 70%;\n}\n#route-panel .route-list li.clickable {\n  padding: 0.5em;\n  border-radius: 6px;\n  background-color: #111;\n  margin: 0.5em 0;\n  white-space: break-spaces;\n  word-break: break-word;\n}\n#route-panel .route-list li.clickable.disabled {\n  text-decoration: 3px line-through;\n}\n#route-panel .route-list li.clickable:hover {\n  background-color: #8D99AE;\n  cursor: pointer;\n}\n#route-panel .route-list li.clickable.selected {\n  background-color: #7C35AA;\n}\n#edit-route-view {\n  display: grid;\n  grid-auto-columns: 20% 80%;\n}\n#route-editor {\n  grid-column-start: 2;\n  grid-column-end: 3;\n  display: grid;\n  grid-auto-columns: auto auto auto;\n  grid-auto-rows: 5% 12% 12% min-content min-content;\n  overflow-y: auto;\n  overflow-x: hidden;\n  height: 90%;\n  grid-row-gap: 3em;\n}\n#route-editor #route-name {\n  grid-row-start: 2;\n  grid-row-end: 3;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\n#route-editor #method-and-url {\n  grid-row-start: 3;\n  grid-row-end: 4;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\n#route-editor #method-and-url > #method-url-bar {\n  display: grid;\n  grid-auto-columns: 10% auto;\n}\n#route-editor #method-and-url > #method-url-bar > select {\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n#route-editor #method-and-url > #method-url-bar > input {\n  grid-column-start: 2;\n  grid-column-end: 3;\n}\n#route-editor #response-headers,\n#route-editor #redirect-url {\n  grid-row-start: 4;\n  grid-row-end: 5;\n  grid-column-start: 1;\n  grid-column-end: 4;\n}\n#route-editor #response-body {\n  grid-row-start: 5;\n  grid-row-end: 6;\n  grid-column-start: 1;\n  grid-column-end: 4;\n  margin-bottom: 2em;\n}\nselect,\ninput,\ntextarea {\n  border-radius: 6px;\n  padding: 1em;\n  background-color: #111;\n  color: #dfd8e3;\n  border-color: #8D99AE;\n  border-width: 1px;\n  border-style: solid;\n}\nselect:focus,\ninput:focus,\ntextarea:focus {\n  border-color: #7C35AA;\n  outline: none;\n}\nselect.full-width,\ninput.full-width,\ntextarea.full-width {\n  width: 98%;\n}\ntextarea {\n  resize: vertical;\n}\n.input-group > select:first-child,\n.input-group input:first-child {\n  border-top-right-radius: 0;\n  border-bottom-right-radius: 0;\n  border-right: none;\n}\n.input-group > select:not(:first-child),\n.input-group input:not(:first-child) {\n  border-radius: 0;\n}\n.input-group > select:last-child,\n.input-group input:last-child {\n  border-top-right-radius: 6px;\n  border-bottom-right-radius: 6px;\n}\ntable {\n  width: 100%;\n}\ntable td > input {\n  width: 95%;\n}\nbutton {\n  padding: 0.5em 1.25em;\n  border-style: solid;\n  cursor: pointer;\n  border-radius: 6px;\n}\nbutton.primary {\n  background-color: #7C35AA;\n  border-color: #602983;\n}\nbutton.primary:hover {\n  background-color: #6e2f97;\n}\nbutton.primary:active {\n  background-color: #602983;\n}\nbutton.primary.outline {\n  background-color: transparent;\n  color: #7C35AA;\n  border-color: #7C35AA;\n}\nbutton.primary.outline:hover {\n  background-color: #7C35AA;\n  color: #83ca55;\n}\nbutton.primary.outline:active {\n  background-color: #602983;\n}\nbutton.secondary {\n  background-color: #8D99AE;\n  border-color: #6f7e99;\n}\nbutton.secondary:hover {\n  background-color: #7e8ca3;\n}\nbutton.secondary:active {\n  background-color: #6f7e99;\n}\nbutton.secondary.outline {\n  background-color: transparent;\n  color: #8D99AE;\n  border-color: #8D99AE;\n}\nbutton.secondary.outline:hover {\n  background-color: #8D99AE;\n  color: #726651;\n}\nbutton.secondary.outline:active {\n  background-color: #6f7e99;\n}\nbutton.success {\n  background-color: #A5C882;\n  border-color: #8cb85f;\n}\nbutton.success:hover {\n  background-color: #98c070;\n}\nbutton.success:active {\n  background-color: #8cb85f;\n}\nbutton.success.outline {\n  background-color: transparent;\n  color: #A5C882;\n  border-color: #A5C882;\n}\nbutton.success.outline:hover {\n  background-color: #A5C882;\n  color: #5a377d;\n}\nbutton.success.outline:active {\n  background-color: #8cb85f;\n}\nbutton.error {\n  background-color: #CD533B;\n  border-color: #aa402b;\n}\nbutton.error:hover {\n  background-color: #be4830;\n}\nbutton.error:active {\n  background-color: #aa402b;\n}\nbutton.error.outline {\n  background-color: transparent;\n  color: #CD533B;\n  border-color: #CD533B;\n}\nbutton.error.outline:hover {\n  background-color: #CD533B;\n  color: #32acc4;\n}\nbutton.error.outline:active {\n  background-color: #aa402b;\n}\n.grid {\n  display: grid;\n}\n.grid.align-center {\n  align-items: center;\n}\n.grid.one-x-two {\n  grid-template-rows: auto;\n  grid-template-columns: auto auto;\n}\n.grid.one-x-three {\n  grid-template-columns: auto auto auto;\n}\n.grid .col-1 {\n  grid-column-start: 1;\n  grid-column-end: 2;\n}\n.grid .col-2 {\n  grid-column-start: 2;\n  grid-column-end: 3;\n}\n.grid .col-3 {\n  grid-column-start: 3;\n  grid-column-end: 4;\n}\n#redirect-url-input {\n  width: available;\n  width: -moz-available;\n}\n.info-message {\n  position: absolute;\n  bottom: 0;\n  left: 25%;\n  right: 25%;\n  text-align: center;\n  padding: 1em;\n  transition: bottom 0.25s linear;\n  border-radius: 6px;\n}\n.info-message.visible {\n  bottom: 15%;\n  transition: bottom 0.25s ease-out;\n}\n.info-message.primary {\n  background-color: #7C35AA;\n  color: #271135;\n  border: 1px solid #271135;\n}\n.info-message.secondary {\n  background-color: #8D99AE;\n  color: #434d5f;\n  border: 1px solid #434d5f;\n}\n.info-message.success {\n  background-color: #A5C882;\n  color: #597b36;\n  border: 1px solid #597b36;\n}\n.info-message.error {\n  background-color: #CD533B;\n  color: #582117;\n  border: 1px solid #582117;\n}\n.button-list {\n  margin-bottom: 2em;\n}\n.button-list > button {\n  border-radius: 0;\n}\n.button-list > button:first-child {\n  border-top-left-radius: 6px;\n  border-bottom-left-radius: 6px;\n}\n.button-list > button:last-child {\n  border-top-right-radius: 6px;\n  border-bottom-right-radius: 6px;\n}\n* .text-primary {\n  color: #7C35AA;\n}\n* .text-secondary {\n  color: #8D99AE;\n}\n* .text-success {\n  color: #A5C882;\n}\n* .text-error {\n  color: #CD533B;\n}\n.view {\n  height: 100%;\n  width: 100%;\n}\n#route-log-view {\n  height: 95%;\n}\n#route-log-view .log-panel {\n  padding: 2em;\n  background-color: #111;\n  border-radius: 6px;\n  height: 95%;\n  overflow-y: auto;\n}\n#route-log-view .log-panel .log {\n  margin: 1em 0;\n}\n#route-log-view .log-panel .log .timestamp {\n  font-style: italic;\n  color: #8D99AE;\n}\n#route-log-view .log-panel .log .message {\n  color: #CD533B;\n  margin-left: 1rem;\n  text-transform: none !important;\n}\n#route-log-view .log-panel .log .method {\n  color: #111;\n  padding: 0.25em;\n  border-radius: 6px;\n  margin-left: 1rem;\n  text-align: center;\n}\n#route-log-view .log-panel .log .method.get {\n  background-color: #A5C882;\n}\n#route-log-view .log-panel .log .method.post {\n  background-color: #FBAF00;\n}\n#route-log-view .log-panel .log .method.put {\n  background-color: #3F84E5;\n}\n#route-log-view .log-panel .log .method.head {\n  background-color: #42c67c;\n}\n#route-log-view .log-panel .log .method.delete {\n  background-color: #CD533B;\n}\n#route-log-view .log-panel .log .method.connect {\n  background-color: plum;\n}\n#route-log-view .log-panel .log .method.options {\n  background-color: lightseagreen;\n}\n#route-log-view .log-panel .log .method.trace {\n  background-color: #b313b0;\n}\n#route-log-view .log-panel .log .method.patch {\n  background-color: #5f5d9e;\n}\n#route-log-view .log-panel .log .url {\n  margin-left: 1rem;\n  word-wrap: break-word;\n  line-height: 2em;\n}\naccordion-element.get.open > .ploiu-accordion-title {\n  background-color: #A5C882;\n}\naccordion-element.get.open > .ploiu-accordion-title .timestamp,\naccordion-element.get.open > .ploiu-accordion-title .method,\naccordion-element.get.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: black !important;\n}\naccordion-element.post.open > .ploiu-accordion-title {\n  background-color: #FBAF00;\n}\naccordion-element.post.open > .ploiu-accordion-title .timestamp,\naccordion-element.post.open > .ploiu-accordion-title .method,\naccordion-element.post.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: black !important;\n}\naccordion-element.put.open > .ploiu-accordion-title {\n  background-color: #3F84E5;\n}\naccordion-element.put.open > .ploiu-accordion-title .timestamp,\naccordion-element.put.open > .ploiu-accordion-title .method,\naccordion-element.put.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: white !important;\n}\naccordion-element.head.open > .ploiu-accordion-title {\n  background-color: #42c67c;\n}\naccordion-element.head.open > .ploiu-accordion-title .timestamp,\naccordion-element.head.open > .ploiu-accordion-title .method,\naccordion-element.head.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: white !important;\n}\naccordion-element.delete.open > .ploiu-accordion-title {\n  background-color: #CD533B;\n}\naccordion-element.delete.open > .ploiu-accordion-title .timestamp,\naccordion-element.delete.open > .ploiu-accordion-title .method,\naccordion-element.delete.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: white !important;\n}\naccordion-element.connect.open > .ploiu-accordion-title {\n  background-color: plum;\n}\naccordion-element.connect.open > .ploiu-accordion-title .timestamp,\naccordion-element.connect.open > .ploiu-accordion-title .method,\naccordion-element.connect.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: white !important;\n}\naccordion-element.options.open > .ploiu-accordion-title {\n  background-color: lightseagreen;\n}\naccordion-element.options.open > .ploiu-accordion-title .timestamp,\naccordion-element.options.open > .ploiu-accordion-title .method,\naccordion-element.options.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: white !important;\n}\naccordion-element.trace.open > .ploiu-accordion-title {\n  background-color: #b313b0;\n}\naccordion-element.trace.open > .ploiu-accordion-title .timestamp,\naccordion-element.trace.open > .ploiu-accordion-title .method,\naccordion-element.trace.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: white !important;\n}\naccordion-element.patch.open > .ploiu-accordion-title {\n  background-color: #5f5d9e;\n}\naccordion-element.patch.open > .ploiu-accordion-title .timestamp,\naccordion-element.patch.open > .ploiu-accordion-title .method,\naccordion-element.patch.open > .ploiu-accordion-title .url {\n  font-weight: bold;\n  color: white !important;\n}\n/*# sourceMappingURL=ui.css.map */';
  //deno-lint-ignore no-inferrable-types
  const uiJs: string =
    ';\n// so vue has an issue in chrome where using a DateTimeFormat in data throws an exception when trying to call .format. This only happens in chrome, not edge or firefox\nglobalThis.dateFormat = new Intl.DateTimeFormat(\'en-US\', {\n  year: \'numeric\',\n  month: \'2-digit\',\n  day: \'2-digit\',\n  hour: \'2-digit\',\n  minute: \'2-digit\',\n  second: \'2-digit\',\n});\n\nconst ui = {\n  data() {\n    return {\n      /** @type {Route[]}; the routes the user has set up*/\n      routes: [],\n      /** @type {Route}; the current route the user is editing*/\n      selectedRoute: null,\n      routeTypes: [\'default\', \'pass-through\'],\n      requestMethods: [\n        \'GET\',\n        \'PUT\',\n        \'POST\',\n        \'DELETE\',\n        \'HEAD\',\n        \'CONNECT\',\n        \'OPTIONS\',\n        \'TRACE\',\n        \'PATCH\',\n      ],\n      // the visible view for the UI\n      currentView: \'editRoute\',\n      // informational message\n      message: null,\n      messageType: null,\n      logs: [],\n    };\n  },\n  methods: {\n    /** splits a header map into a list of single headers so that they can be edited on the UI*/\n    groupHeaders(headers = {}) {\n      const grouped = [];\n      for (const [key, value] of Object.entries(headers)) {\n        grouped.push({\n          name: key,\n          value: value,\n        });\n      }\n      // assign a new id for each grouped header\n      for (let i = 0; i < grouped.length; i++) {\n        grouped[i].id = i;\n      }\n      return grouped;\n    },\n    /** condenses a list of headers down into a single object to send back to the server */\n    condenseHeaders(headers = []) {\n      const condensed = {};\n      for (const grouped of headers) {\n        condensed[grouped.name] = grouped.value;\n      }\n      return condensed;\n    },\n    /** creates a new route object, adds it to our route list, and sets it as the selected route */\n    addNew() {\n      const route = { isEnabled: true, routeType: \'default\' };\n      this.routes.push(route);\n      this.selectedRoute = route;\n    },\n    removeRoute(route) {\n      this.routes = this.routes.filter((it) => it !== route);\n      if (this.selectedRoute === route) {\n        this.selectedRoute = null;\n      }\n    },\n    /** adds a new header to the currently selected route */\n    addHeader() {\n      this.selectedRoute.responseHeaders = this.selectedRoute.responseHeaders ??\n        [];\n      const header = {\n        name: null,\n        value: null,\n        id: this.selectedRoute.responseHeaders.length,\n      };\n      this.selectedRoute.responseHeaders.push(header);\n    },\n    removeHeader(header) {\n      this.selectedRoute.responseHeaders = this.selectedRoute\n        .responseHeaders\n        .filter((it) => it !== header);\n    },\n    /** saves our routes to our config file and refreshes the routes */\n    async save() {\n      // clone the routes TODO find a better way\n      const routes = JSON.parse(JSON.stringify(this.routes));\n      // condense the headers of each route\n      for (const route of routes) {\n        route.responseHeaders = this.condenseHeaders(\n          route.responseHeaders,\n        );\n      }\n      const saveResult = await (await fetch(\'/mock-ui-save-routes\', {\n        method: \'POST\',\n        body: JSON.stringify(routes),\n      })).json();\n      if (saveResult.success) {\n        this.showMessage(\'Successfully saved routes\', \'success\');\n      } else {\n        this.showMessage(\n          \'Failed to save routes, check server logs for details.\',\n          \'error\',\n        );\n      }\n    },\n    /**\n     * shows the message bar at the bottom of the screen, and then hides it after 3 seconds\n     * @param {string} message\n     * @param {string} messageType\n     */\n    showMessage(message, messageType) {\n      this.message = message;\n      this.messageType = messageType;\n      // show the message for a bit and then hide it\n      setTimeout(() => {\n        this.message = null;\n        this.messageType = null;\n      }, 3_000);\n    },\n    /** switches our currentView to the passed viewName */\n    switchView(viewName) {\n      this.currentView = viewName;\n    },\n    /**\n     * adds a single log to our log list\n     * @param {{url: string, method: string, body: any | null, timestamp: Number | string}} log\n     */\n    addLog(log) {\n      log.timestamp = globalThis.dateFormat.format(log.timestamp);\n      console.log(\'adding log\');\n      this.logs.push(log);\n    },\n    /** removes all logs from our list */\n    clearLogs() {\n      this.logs.splice(0, this.logs.length);\n    },\n    /**\n     * fetches the latest batch of logged routes and returns them\n     * @returns {Promise<any[]>}\n     */\n    async fetchLogs() {\n      try {\n        return await (await fetch(\'/mock-server-logs\')).json();\n      } catch {\n        return [];\n      }\n    },\n  },\n  async mounted() {\n    const routes = await (await fetch(\'/mock-server-routes\')).json();\n    if (routes) {\n      for (const route of routes) {\n        route.responseHeaders = this.groupHeaders(\n          route.responseHeaders,\n        );\n      }\n      this.routes = routes;\n    }\n    // set up an event source to retrieve logs\n    setInterval(async () => {\n      if (this.currentView === \'viewLogs\') {\n        const data = await this.fetchLogs();\n        if (data.length > 0) {\n          for (const log of data) {\n            this.addLog(log);\n          }\n        }\n      }\n    }, 1000);\n  },\n};\nVue.createApp(ui).mount(\'#main\');\n;\n;\n/*MIT License\n\nCopyright (c) 2021 ploiu\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n*/\nif(!customElements.get("accordion-element")){let a=0;window.accordions=[];class b extends HTMLElement{#title;#accordionId;#isOpen;#group;#titleElement;#bodyElement;#parentAccordion;#initialParentAccordionHeight;constructor({title:b,id:c,isOpen:d,group:e}={}){super(),this.#title=b??this.dataset.title??"",this.#accordionId=c??this.dataset.id??a++,this.#isOpen=d??this.dataset.isOpen??!1,this.#group=e??this.dataset.group??"",window.accordions.push(this),this.#parentAccordion=null}_createTitleElement(){const a=this.querySelector("div.ploiu-accordion-title");if(a)return a.addEventListener("click",()=>this.toggle()),a;else{const a=document.createElement("div");return a.classList.add("ploiu-accordion-title"),a.innerText=this.#title,a.addEventListener("click",()=>this.toggle()),a}}_createBodyElement(){const a=this.querySelector("div.ploiu-accordion-body");if(a)return a;else{const a=document.createElement("div");a.classList.add("ploiu-accordion-body");const b=[...this.childNodes].filter(a=>!a.classList?.contains("ploiu-accordion-title"));for(let c of b){const b=c;a.appendChild(b.cloneNode(!0)),b.remove()}return a}}_getParentAccordion(){let a=[],b=this;for(;b?.parentNode;)a.push(b.parentNode),b=b.parentNode;return a=a.filter(a=>"ACCORDION-ELEMENT"===a?.tagName),0<a.length?a[0]:null}_getParentAccordionChain(){const a=[];for(let b=this.#parentAccordion;b;)a.push(b),b=b._getParentAccordion();return a}_expandParent(a){this.#parentAccordion?.isOpen&&(this.#parentAccordion.bodyElement.style.height=Number.parseFloat(this.#parentAccordion.bodyElement.style.height.replace(/px/,""))+a+"px",this.#parentAccordion._expandParent(a))}_collapseParent(a){this.#parentAccordion?.isOpen&&(this.#parentAccordion.bodyElement.style.height=this.#parentAccordion.bodyElement.clientHeight-a+"px",this.#parentAccordion._collapseParent(a))}get accordionId(){return this.#accordionId}get group(){return this.#group}set group(a){this.#group=a,this.dataset.group=a}get title(){return this.#title}set title(a){if("string"==typeof a)this.#title=a,this.isConnected&&(this.#titleElement.innerText=a);else if(a instanceof Node){if(!this.isConnected)throw"Can\'t set an accordion element title to a node when it hasn\'t been appended to the document!";this.#title="",this.#titleElement.innerText="",[...this.#titleElement.children].forEach(a=>a.remove()),this.#titleElement.appendChild(a)}}get isOpen(){return this.#isOpen}get bodyElement(){return this.#bodyElement}set body(a){if(!this.isConnected)throw"Can\'t set an accordion element body when it hasn\'t been appended to the document!";Array.from(this.#bodyElement.children).forEach(a=>a?.remove()),this.#bodyElement.appendChild(a)}expand(){const a=this._getParentAccordionChain();b.findAccordionsByGroup(this.#group).filter(b=>b!==this&&!a.includes(b)&&this.#parentAccordion===b.#parentAccordion).forEach(a=>a.collapse()),this.#isOpen=!0,this.#bodyElement.style.height=`${this.#bodyElement.scrollHeight}px`,this._expandParent(this.#bodyElement.scrollHeight),this.classList.add("open")}collapse(){this.#isOpen&&(this.#isOpen=!1,this.#parentAccordion&&this._collapseParent(this.bodyElement.scrollHeight),this.#bodyElement.style.height="0",this.classList.remove("open"),Array.from(this.querySelectorAll("accordion-element")).forEach(a=>a.collapse()))}toggle(){this.#isOpen?this.collapse():this.expand()}connectedCallback(){this.isConnected&&(this.#titleElement=this._createTitleElement(),this.#bodyElement=this._createBodyElement(),this.appendChild(this.#titleElement),this.appendChild(this.#bodyElement),(this.dataset.open!==void 0||this.#isOpen)&&this.expand(),this.#parentAccordion=this._getParentAccordion(),this.#initialParentAccordionHeight=null===this.#parentAccordion?0:this.#parentAccordion.scrollHeight)}static findAccordionById(a){try{return window.accordions.filter(b=>b.id===a)[0]}catch(a){return null}}static findAccordionsByGroup(a){return[...document.querySelectorAll("accordion-element")].filter(b=>b.group.toLowerCase()===a.toLowerCase())}}class c extends HTMLElement{connectedCallback(){this.isConnected&&(Array.from(this.querySelectorAll("accordion-element")).forEach(b=>b.group=`fan-${a}`),a++)}}customElements.define("accordion-element",b),customElements.define("accordion-fan",c),window.AccordionElement=b}\n';
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
