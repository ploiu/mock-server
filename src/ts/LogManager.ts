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
} from '@std/fmt/colors';
import { RequestMethod } from './request/RequestMethod.ts';
import { Log, LogEntry, LogTypes, RequestLogEntry } from './model/LogModels.ts';
declare global {
  /** Adds a new log event to be sent to consumers in the browser */
  function enqueueLogEvent(log: Log): void;
}
/**
 * A class that logs to the console when certain routes are hit, and stores those logs for the
 * `LogRoutes` route to consume every time it needs to poll for log updates
 */
export default class LogManager {
  /**
   * adds a log entry for the console and browser clients
   * @param url the request url
   * @param method the request method
   * @param body the request body
   * @param headers request headers
   * @param message error message, if any
   * @param id the log id, must be same for the request/response in the same transaction
   * @param type whether the log is for a request or a response
   */
  public static enqueueLog(
    logData: LogEntry,
    id: string,
    type: LogTypes,
  ): void {
    const log: Log = {
      data: logData,
      type,
      id,
    };
    globalThis.enqueueLogEvent(log);
    // logging responses to the console will only cause confusion
    if (logData instanceof RequestLogEntry) {
      const { method, url, message } = logData;
      const color = this.getColorForMethod(
        <RequestMethod> method?.toUpperCase(),
      );
      if (method && url) {
        console.log(color(` ${method?.toUpperCase()} `) + ' ' + url);
      } else if (message) {
        console.log(yellow(message));
      }
    }
  }

  private static getColorForMethod(
    method: RequestMethod,
  ): (arg0: string) => void {
    switch (method) {
      case 'GET':
        return (str: string) => bgGreen(black(str));
      case 'PUT':
        return (str: string) => bgBlue(black(str));
      case 'POST':
        return (str: string) => bgYellow(black(str));
      case 'DELETE':
        return (str: string) => bgRed(black(str));
      case 'HEAD':
        return (str: string) => bgCyan(black(str));
      case 'CONNECT':
        return (str: string) => bgMagenta(black(str));
      case 'OPTIONS':
        return (str: string) => bgBrightGreen(black(str));
      case 'TRACE':
        return (str: string) => bgBrightMagenta(black(str));
      case 'PATCH':
        return (str: string) => bgBrightBlue(black(str));
      default:
        // we should never reach here
        return ((str: string) => str);
    }
  }
}
