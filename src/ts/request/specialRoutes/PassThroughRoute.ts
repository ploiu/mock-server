import Route from '../Route.ts';
import { RequestMethod } from '../RequestMethod.ts';

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
    );
  }

  execute(request: Request): Promise<Response> {
    const url = new URL(request.url);
    return fetch(
      new Request(
        url.href.replace(url.origin, this.redirectUrl),
        request,
      ),
    );
  }

  static fromObject(
    // @ts-ignore deno-fmt-ignore this is object destructuring, and I can't specify types
    // deno-lint-ignore no-unused-vars
    {title, url, method, responseHeaders, response, responseStatus, isEnabled, redirectUrl},
  ): PassThroughRoute {
    return new PassThroughRoute(
      title,
      url,
      method,
      isEnabled,
      redirectUrl,
    );
  }
}
