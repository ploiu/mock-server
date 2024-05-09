import Route from '../Route.ts';
import RouteManager from '../RouteManager.ts';
import { RequestMethod } from '../RequestMethod.ts';
import { RouteTypes } from '../RouteTypes.ts';

export default class FetchRoutesRoute extends Route {
  /** Routes not provided by the user */
  private excludedRoutes = [
    '/mock-server-routes',
    '/mock-server-ui',
    '/refreshConfig',
    '/mock-ui-save-routes',
    '/mock-server-logs',
  ];

  constructor(private routeManager: RouteManager) {
    super(
      'Fetch Routes',
      '/mock-server-routes',
      RequestMethod.GET,
      new Headers(),
      null,
      200,
      true,
      RouteTypes.DEFAULT,
    );
    this.responseHeaders.append('Content-Type', 'application/json');
    if (Deno.env.get('MOCK_SERVER_ENV') === 'dev') {
      this.responseHeaders.append('Access-Control-Allow-Origin', '*');
    }
  }

  //deno-lint-ignore require-await
  async execute(_request: Request): Promise<Response> {
    // get all the routes in the route manager
    const routes = this.routeManager.routes.filter((it: Route) =>
      !this.excludedRoutes.includes(it.url)
    );
    return new Response(JSON.stringify(routes), {
      status: 200,
      headers: this.responseHeaders,
    });
  }
}
