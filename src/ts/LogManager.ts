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
} from "https://deno.land/std@0.100.0/fmt/colors.ts";

/**
 * A class that logs to the console when certain routes are hit, and stores those logs for the
 * `LogRoutes` route to consume every time it needs to poll for log updates
 */
import { RequestMethod } from "./request/RequestMethod.ts";

export class LogManager {
  private static sseLogs: LogEntry[] = [];

  /**
     * Logs the entry to the console and stores the entry in our sseLogs object
     * @param url
     * @param method
     * @param body
     */
  public static newEntry(url: string, method: string, body: string = ""): void {
    this.sseLogs.push(new LogEntry(url, method, body, +new Date()));
    // TODO log
    const color = this.getColorForMethod(
      <RequestMethod> method.toUpperCase(),
    );
    console.log(color(` ${method.toUpperCase()} `) + " " + url);
  }

  private static getColorForMethod(method: RequestMethod): Function {
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
    return LogManager.sseLogs.splice(0, this.sseLogs.length);
  }
}

/**
 * Represents a log entry to be transformed into a console log on the server side and an event entry to be sent to the client side
 */
export class LogEntry {
  constructor(
    public url: string,
    public method: string,
    public body: any,
    public timestamp: Number,
  ) {
  }
}
