import Config from '../ts/config/Config.ts';
import { RequestMethod } from '../ts/request/RequestMethod.ts';
import RouteManager from '../ts/request/RouteManager.ts';
import { RouteTypes } from '../ts/request/RouteTypes.ts';

Deno.test('routes with ALL method type accept any request method', () => {
  const methods = Object.keys(RequestMethod);
  const config: Config = {
    configVersion: '',
    routes: [{
      routeType: RouteTypes.DEFAULT,
      isEnabled: false,
      title: '',
      url: '/test',
      method: RequestMethod.GET,
      responseHeaders: {},
      response: null,
      responseStatus: 0,
    }],
  };
  const manager = new RouteManager();
  manager.setupRoutes(config);
  for (const method of methods) {
  }
});
import Config from '../ts/config/Config.ts';
import { RequestMethod } from '../ts/request/RequestMethod.ts';
import RouteManager from '../ts/request/RouteManager.ts';
import { RouteTypes } from '../ts/request/RouteTypes.ts';

Deno.test('routes with ALL method type accept any request method', () => {
  const keys = Object.keys(RequestMethod);
  const config: Config = {
    configVersion: '',
    routes: [{
      routeType: RouteTypes.DEFAULT,
      isEnabled: false,
      title: '',
      url: '/test',
      method: RequestMethod.GET,
      responseHeaders: {},
      response: null,
      responseStatus: 0,
    }],
  };
  const manager = new RouteManager();
  manager.setupRoutes(config);
  for (const method of keys) {
  }
});
