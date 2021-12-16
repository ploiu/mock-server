import Route from "../Route.ts";
import { RequestMethod } from "../RequestMethod.ts";

import { LogManager } from "../../LogManager.ts";

/**
 * Sends the latest route logs to the caller
 */
export default class LogRoute extends Route {
  constructor() {
    super(
      "Log Route",
      "/mock-server-logs",
      <RequestMethod> "GET",
      new Headers(),
      null,
      200,
      true,
    );
  }

  /**
   * sends the current batch of logs to the client. This is meant to be periodically polled
   */
  //deno-lint-ignore require-await
  async execute(_request: Request): Promise<Response> {
    // if we're not done writing, we should store our logs in our backLogs and re-try sending everything next time
    return new Response(JSON.stringify(LogManager.getLogs()), { status: 200 });
  }
}
