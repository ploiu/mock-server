//deno-lint-ignore-file no-explicit-any
import {
  bgBlue,
  bgBrightBlue,
  bgBrightGreen,
  bgBrightMagenta,
  bgCyan,
  bgGreen,
  bgMagenta,
  bgRed,
  bgYellow,
  black,
  yellow,
} from "https://deno.land/std@0.114.0/fmt/colors.ts";
import { RequestMethod } from "./request/RequestMethod.ts";

/**
 * A class that logs to the console when certain routes are hit, and stores those logs for the
 * `LogRoutes` route to consume every time it needs to poll for log updates
 */
export class LogManager {
  private static sseLogs: LogEntry[] = [];
  // determines if we can read logs. This lock is in place because we clear the list when read
  private static canReadLogs = true;

  /**
   * Logs the entry to the console and stores the entry in our sseLogs object
   * @param url
   * @param method
   * @param body
   * @param headers
   * @param message
   */
  public static newEntry(
    url: string | null,
    method: string | null,
    body: string | null = "",
    headers: Headers | null = null,
    message: string | null = null,
  ): void {
    LogManager.canReadLogs = false;
    this.sseLogs.push(
      new LogEntry(url, method, body, headers, +new Date(), message),
    );
    // TODO log
    const color = this.getColorForMethod(
      <RequestMethod> method?.toUpperCase(),
    );
    if (method && url) {
      console.log(color(` ${method?.toUpperCase()} `) + " " + url);
    } else if (message) {
      console.log(yellow(message));
    }
    LogManager.canReadLogs = true;
  }

  private static getColorForMethod(
    method: RequestMethod,
  ): (arg0: string) => void {
    switch (method) {
      case "GET":
        return (str: string) => bgGreen(black(str));
      case "PUT":
        return (str: string) => bgBlue(black(str));
      case "POST":
        return (str: string) => bgYellow(black(str));
      case "DELETE":
        return (str: string) => bgRed(black(str));
      case "HEAD":
        return (str: string) => bgCyan(black(str));
      case "CONNECT":
        return (str: string) => bgMagenta(black(str));
      case "OPTIONS":
        return (str: string) => bgBrightGreen(black(str));
      case "TRACE":
        return (str: string) => bgBrightMagenta(black(str));
      case "PATCH":
        return (str: string) => bgBrightBlue(black(str));
      default:
        // we should never reach here
        return ((str: string) => str);
    }
  }

  /**
   * clears and returns all the stored logs to be sent to the client
   */
  public static getLogs(): LogEntry[] {
    if (LogManager.canReadLogs) {
      return LogManager.sseLogs.splice(0, this.sseLogs.length);
    } else {
      return [];
    }
  }
}

/**
 * Represents a log entry to be transformed into a console log on the server side and an event entry to be sent to the client side
 */
export class LogEntry {
  public headers: any = {};

  constructor(
    public url: string | null,
    public method: string | null,
    public body: any,
    requestHeaders: Headers | null,
    public timestamp: number,
    public message: string | null,
  ) {
    // the `Headers` prototype doesn't map to a simple object, so we need to do that ourselves
    if (requestHeaders) {
      for (const headerPair of requestHeaders.entries()) {
        this.headers[headerPair[0]] = headerPair[1];
      }
    }
  }
}
