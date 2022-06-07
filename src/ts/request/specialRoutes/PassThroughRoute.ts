import Route from '../Route.ts';
import { RequestMethod } from '../RequestMethod.ts';
import { RouteTypes } from '../RouteTypes.ts';

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

  execute(request: Request): Promise<Response> {
    const url = new URL(request.url);
    return fetch(
      new Request(
        url.href.replace(url.origin, this.redirectUrl),
        request,
      ),
    );
  }
}
