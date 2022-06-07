import Route from '../Route.ts';
import { RequestMethod } from '../RequestMethod.ts';
import { RouteTypes } from '../RouteTypes.ts';
import LogManager from '../../LogManager.ts';

export class PassThroughRoute extends Route {
  constructor(
    // a name to help the user distinguish which route is which
    public title: string,
    // the url that the route gets bound on, may include path and query variables
    public url: string,
    // the request method the route gets bound on
    public method: RequestMethod,
    // whether the route is "turned on"
    public isEnabled: boolean,
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

  async execute(request: Request): Promise<Response> {
    const body = await request.text();
    try {
      const url = new URL(request.url);
      // deno-lint-ignore no-explicit-any
      const newRequest: RequestInit = {
        ...request,
        method: request.method,
        headers: request.headers,
        // @ts-ignore
        body: (() => {
          if (
            request.method !== RequestMethod.GET &&
            request.method !== RequestMethod.HEAD
          ) {
            return body;
          }
          return null;
        }),
      };
      if (
        request.method !== RequestMethod.GET &&
        request.method !== RequestMethod.HEAD
      ) {
        newRequest.body = body;
      } else {
        delete newRequest.body;
      }
      return fetch(
        new Request(
          url.href.replace(url.origin, this.redirectUrl),
          newRequest,
        ),
      );
    } finally {
      LogManager.newEntry(
        Route.getPath(request.url),
        request.method.toUpperCase(),
        body,
        request.headers,
      );
    }
  }
}
