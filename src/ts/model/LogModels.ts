export enum LogTypes {
  REQUEST = 'request',
  RESPONSE = 'response',
  ERROR = 'error',
}

export type Log = {
  /** whether the log is for an outgoing request or an incoming response */
  type: LogTypes;
  /** the data for the request/response */
  data: LogEntry;
  /** the id for the request/response used to tie the requests and responses for the same transaction together */
  id: string;
};

/**
 * Represents a log entry to be transformed into a console log on the server side and an event entry to be sent to the client side
 */
export class LogEntry {
  public headers: any = {};

  constructor(
    // public url: string | null,
    // public method: string | null,
    public body: any,
    headers: Headers | null,
    public timestamp: number,
    // public message: string | null,
  ) {
    // the `Headers` prototype doesn't map to a simple object, so we need to do that ourselves
    if (headers) {
      for (const headerPair of headers.entries()) {
        this.headers[headerPair[0]] = headerPair[1];
      }
    }
  }
}

export class RequestLogEntry extends LogEntry {
  constructor(
    public url: string | null,
    public method: string | null,
    public message: string | null,
    body: any,
    headers: Headers | null,
    timestamp: number,
  ) {
    super(body, headers, timestamp);
  }
}

export class ResponseLogEntry extends LogEntry {
  constructor(
    body: any,
    headers: Headers,
    timestamp: number,
    public responseCode: number,
  ) {
    super(body, headers, timestamp);
  }
}
