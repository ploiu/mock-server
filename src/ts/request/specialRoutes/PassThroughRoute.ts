import Route from '../Route.ts';
import { RequestMethod } from '../RequestMethod.ts';
import { RouteTypes } from '../RouteTypes.ts';
import LogManager from '../../LogManager.ts';
import {
  LogTypes,
  RequestLogEntry,
  ResponseLogEntry,
} from '../../model/LogModels.ts';

export class PassThroughRoute extends Route {
  constructor(
    // a name to help the user distinguish which route is which
    public override title: string,
    // the url that the route gets bound on, may include path and query variables
    public override url: string,
    // the request method the route gets bound on
    public override method: RequestMethod | '*',
    // whether the route is "turned on"
    public override isEnabled: boolean,
    // the url to redirect to, our `url` property will be appended to this as the path to hit
    public redirectUrl: string,
  ) {
    super(
      title,
      url,
      method,
      // these 3 don't matter
      new Headers(),
      null,
      200,
      isEnabled,
      RouteTypes.PASSTHROUGH,
    );
  }

  override async execute(request: Request): Promise<Response> {
    const body = await request.text();
    const logId = crypto.randomUUID().toLowerCase();
    const url = new URL(request.url);
    const newRequest: RequestInit = {
      ...request,
      method: request.method,
      headers: request.headers,
      body: request.method !== RequestMethod.GET &&
          request.method !== RequestMethod.HEAD
        ? body
        : null,
    };
    const requestLog = new RequestLogEntry(
      Route.getPath(request.url),
      request.method.toUpperCase(),
      null,
      body,
      request.headers,
      +new Date(),
    );
    LogManager.enqueueLog(requestLog, logId, LogTypes.REQUEST);
    return fetch(
      new Request(
        url.href.replace(url.origin, this.redirectUrl),
        newRequest,
      ),
    )
      .then(async (res) => {
        const body = await res.text();
        const headers = res.headers;
        let status = res.status;
        // deno throws an error if the status is 204 but the body is present. some APIs do this because they're dumb
        if (
          status === 101 || status === 204 || status === 205 ||
          status === 304 && !!body
        ) {
          status = 200;
        }
        const responseLog = new ResponseLogEntry(
          res.status,
          body,
          headers,
          +new Date(),
          status,
        );
        LogManager.enqueueLog(responseLog, logId, LogTypes.RESPONSE);
        return new Response(body, { headers, status });
      });
  }
}
