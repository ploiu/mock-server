import { RequestMethod } from '../RequestMethod.ts';
import Route from '../Route.ts';
import { RouteTypes } from '../RouteTypes.ts';

export enum LogTypes {
  REQUEST = 'request',
  RESPONSE = 'response',
}

type Log = {
  /** whether the log is for an outgoing request or an incoming response */
  type: LogTypes;
  /** the data for the request/response */
  data: string;
  /** the id for the request/response used to tie the requests and responses for the same transaction together */
  id: string;
};

declare global {
  /** Adds a new log event to be sent to consumers in the browser */
  function enqueueLogEvent(log: Log): void;
}

/** handles sending request and response logs via Server-Sent-Events to the browser */
export class LogRoute extends Route {
  private encoder = new TextEncoder();

  constructor() {
    super(
      'New Log Route',
      '/mock-server-logs-new',
      RequestMethod.GET,
      new Headers(),
      null,
      200,
      true,
      RouteTypes.DEFAULT,
    );
    if (Deno.env.get('MOCK_SERVER_ENV') === 'dev') {
      this.responseHeaders.append('Access-Control-Allow-Origin', '*');
    }
    this.init();
  }

  private init() {
    if (!('enqueLogEvent' in globalThis)) {
      globalThis.enqueueLogEvent = (log: Log): void => {
        const event = `data: ${JSON.stringify(log)}\nid: ${log.id}\n\n`;
        globalThis.dispatchEvent(
          new CustomEvent('log', {
            detail: this.encoder.encode(event),
          }),
        );
      };
    }
  }

  override execute(_request: Request): Promise<Response> {
    let handler: EventListenerOrEventListenerObject | undefined;
    // deno tutorial uses ReadableStream but replays all events every time the stream is read, which we absolutely don't want.
    // also handling it this way allows all open tabs to receive events, which was a bug introduced when this project moved off of SSE when deno broke it a few years ago
    const stream = new ReadableStream({
      start(controller) {
        const handler = (e: Event) => {
          if (e instanceof CustomEvent) {
            controller.enqueue(e.detail);
          }
        };
        globalThis.addEventListener('log', handler);
      },
      cancel() {
        if (handler) {
          globalThis.removeEventListener('log', handler);
        }
      },
    });
    return Promise.resolve(
      new Response(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          'access-control-allow-origin': '*',
        },
      }),
    );
  }
}
