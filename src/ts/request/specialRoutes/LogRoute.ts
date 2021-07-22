import Route from "../Route.ts";
import { RequestMethod } from "../RequestMethod.ts";

import {
  Response,
  ServerRequest,
} from "https://deno.land/std@0.100.0/http/mod.ts";
import { LogEntry, LogManager } from "../../LogManager.ts";

/**
 * Uses [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) to send logging info
 * to the client side
 */
export default class LogRoute extends Route {
  private doneWriting: boolean = true;

  constructor() {
    super(
      "Log Route",
      "/logs",
      <RequestMethod> "GET",
      new Headers(),
      null,
      200,
    );
  }

  /**
     * Sets up the request to start sending server-sent events to the client. This is an adaptation of
     * [this answer](https://stackoverflow.com/a/67119889) on stackoverflow
     * @param request
     */
  async execute(request: ServerRequest): Promise<Response> {
    /*
            * We are using a promise-based approach; the disconnect promise sets its own `resolve` method to our resolver,
            * so invoking `resolver` will complete the disconnect promise
            */
    let resolver: any;
    const disconnect = new Promise((resolve) => resolver = resolve);
    let backLogs: LogEntry[] = [];

    // date writer (interval method which pushes the current date to the client)
    const sendData = async () => {
      try {
        backLogs = [...backLogs, ...LogManager.getLogs()];
        // console.log(`doneWriting: %c${this.doneWriting}\nbackLogs size: %c${backLogs.length}`, 'color: seagreen', 'color: royalblue')
        // if we're not done writing, we should store our logs in our backLogs and re-try sending everything next time
        if (this.doneWriting) {
          await this.write(
            request,
            "data: " + JSON.stringify(backLogs) + "\r\n\r\n",
          );
          // we wrote our backlogs, now it's time to clear them
          backLogs.splice(0, backLogs.length);
        }
      } catch (e) {
        // close the connection from our side as well
        request.conn.close();
        // we're done sending data to the client, so resolve our promise
        resolver();
      }
    };

    // prepare and send the headers
    const headers = `HTTP/1.1 200 OK
Connection: keep-alive
Cache-Control: no-cache
Content-Type: text/event-stream;charset=utf-8

`;
    await this.write(request, headers);

    // periodically poll for new logs to send to the client
    const interval = setInterval(sendData, 500);

    /*
            * Since we're using a promise to determine when the client disconnects, this waits and prevents the method from returning
            * until the client disconnects.
            */
    await disconnect;
    clearInterval(interval);
    return <Response> {};
  }

  /**
     * Writes the data to the client side. Broken Pipe errors are ignored, while other errors are thrown back
     * @param request
     * @param data
     * @private
     */
  private async write(request: ServerRequest, data: string): Promise<void> {
    this.doneWriting = false;
    const encoder = new TextEncoder();
    request.w.write(encoder.encode(data + "\n"));
    // flushing actually is what sends the data, but we need to handle broken pipe errors
    try {
      await request.w.flush();
      this.doneWriting = true;
    } catch (e) {
      // we're done writing because there was nothing to write
      this.doneWriting = true;
      if (e.name !== "BrokenPipe") {
        throw e;
      }
    }
  }
}
