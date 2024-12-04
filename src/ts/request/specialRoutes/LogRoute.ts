import { Log } from '../../model/LogModels.ts';
import { RequestMethod } from '../RequestMethod.ts';
import Route from '../Route.ts';
import { RouteTypes } from '../RouteTypes.ts';

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
      '/mock-server-logs',
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
        const event = `data: ${JSON.stringify(log)}\n\n`;
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
        handler = (e: Event) => {
          if (e instanceof CustomEvent) {
            try {
              controller.enqueue(e.detail);
            } catch (e) {
              console.error((e as Error).message);
            }
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
