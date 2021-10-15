const ui = {
  data() {
    return {
      /** @type {Route[]}; the routes the user has set up*/
      routes: [],
      /** @type {Route}; the current route the user is editing*/
      selectedRoute: null,
      requestMethods: [
        "GET",
        "PUT",
        "POST",
        "DELETE",
        "HEAD",
        "CONNECT",
        "OPTIONS",
        "TRACE",
        "PATCH",
      ],
      // the visible view for the UI
      currentView: "editRoute",
      // informational message
      message: null,
      messageType: null,
      logs: [],
      dateFormat: new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  },
  methods: {
    /** splits a header map into a list of single headers so that they can be edited on the UI*/
    groupHeaders(headers = {}) {
      const grouped = [];
      for (let [key, value] of Object.entries(headers)) {
        grouped.push({
          name: key,
          value: value,
        });
      }
      // assign a new id for each grouped header
      for (let i = 0; i < grouped.length; i++) {
        grouped[i].id = i;
      }
      return grouped;
    },
    /** condenses a list of headers down into a single object to send back to the server */
    condenseHeaders(headers = []) {
      const condensed = {};
      for (let grouped of headers) {
        condensed[grouped.name] = grouped.value;
      }
      return condensed;
    },
    /** creates a new route object, adds it to our route list, and sets it as the selected route */
    addNew() {
      const route = {};
      this.routes.push(route);
      this.selectedRoute = route;
    },
    removeRoute(route) {
      this.routes = this.routes.filter((it) => it !== route);
      if (this.selectedRoute === route) {
        this.selectedRoute = null;
      }
    },
    /** adds a new header to the currently selected route */
    addHeader() {
      this.selectedRoute.responseHeaders = this.selectedRoute.responseHeaders ??
        [];
      const header = {
        name: null,
        value: null,
        id: this.selectedRoute.responseHeaders.length,
      };
      this.selectedRoute.responseHeaders.push(header);
    },
    removeHeader(header) {
      this.selectedRoute.responseHeaders = this.selectedRoute.responseHeaders
        .filter((it) => it !== header);
    },
    /** saves our routes to our config file and refreshes the routes */
    async save() {
      // clone the routes TODO find a better way
      const routes = JSON.parse(JSON.stringify(this.routes));
      // condense the headers of each route
      for (let route of routes) {
        route.responseHeaders = this.condenseHeaders(route.responseHeaders);
      }
      const saveResult = await (await fetch("/mock-ui-save-routes", {
        method: "POST",
        body: JSON.stringify(routes),
      })).json();
      if (saveResult.success) {
        this.showMessage("Successfully saved routes", "success");
      } else {
        this.showMessage(
          "Failed to save routes, check server logs for details.",
          "error",
        );
      }
    },
    /**
     * shows the message bar at the bottom of the screen, and then hides it after 3 seconds
     * @param {string} message
     * @param {string} messageType
     */
    showMessage(message, messageType) {
      this.message = message;
      this.messageType = messageType;
      // show the message for a bit and then hide it
      window.setTimeout(() => {
        this.message = null;
        this.messageType = null;
      }, 3_000);
    },
    /** switches our currentView to the passed viewName */
    switchView(viewName) {
      this.currentView = viewName;
    },
    /**
     * adds a single log to our log list
     * @param {{url: string, method: string, body: any | null, timestamp: Number | string}} log
     */
    addLog(log) {
      log.timestamp = this.dateFormat.format(log.timestamp);
      this.logs.push(log);
    },
    /** removes all logs from our list */
    clearLogs() {
      this.logs.splice(0, this.logs.length);
    },
    /**
     * Scrolls our log panel to the bottom of its contents
     */
    scrollLogPanel() {
      const logPanel = document.querySelector("#logArea");
      logPanel?.scrollTo(0, logPanel.scrollHeight);
    },
    /**
     * fetches the latest batch of logged routes and returns them
     * @returns {Promise<any[]>}
     */
    async fetchLogs() {
      return await (await fetch("/mock-server-logs")).json();
    },
  },
  async mounted() {
    const routes = await (await fetch("/mock-server-routes")).json();
    if (routes) {
      for (let route of routes) {
        route.responseHeaders = this.groupHeaders(route.responseHeaders);
      }
      this.routes = routes;
    }
    // set up an event source to retrieve logs
    const self = this;
    window.setInterval(async () => {
      if (this.currentView === "viewLogs") {
        const data = await this.fetchLogs();
        if (data.length > 0) {
          for (const log of data) {
            this.addLog(log);
          }
          self.$nextTick(() => {
            this.scrollLogPanel();
          });
        }
      }
    }, 1000);
  },
};
Vue.createApp(ui).mount("#main");
