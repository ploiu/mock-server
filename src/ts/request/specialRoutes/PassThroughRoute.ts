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
    // the headers used in the response for this route
    public responseHeaders: Headers,
    // the response body
    public response: string | null,
    // the http status code
    public responseStatus: number,
    // whether the route is "turned on"
    public isEnabled: boolean,
    // the url to redirect to, our `url` property will be appended to this as the path to hit
    public redirectUrl: string,
  ) {
    super(
      title,
      url,
      method,
      responseHeaders,
      response,
      responseStatus,
      isEnabled,
    );
  }

  execute(request: Request): Promise<Response> {
    return fetch(
      new Request(
        `${this.redirectUrl}/${this.url}`.replaceAll(/\/{2,}/g, '/'),
        request,
      ),
    );
  }

  static fromObject(
    // @ts-ignore deno-fmt-ignore this is object destructuring, and I can't specify types
    {title, url, method, responseHeaders, response, responseStatus, isEnabled, redirectUrl},
  ): PassThroughRoute {
    return new PassThroughRoute(
      title,
      url,
      method,
      responseHeaders,
      // return response if it's a string
      (typeof response === 'string')
        ? response
        : response !== null && response !== undefined
        ? JSON.stringify(response)
        : null,
      Number(responseStatus),
      isEnabled,
      redirectUrl,
    );
  }
}
