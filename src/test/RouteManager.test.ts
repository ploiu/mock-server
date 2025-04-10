import { assert, assertEquals, assertFalse } from '@std/assert';
import Config from '../ts/config/Config.ts';
import { RequestMethod } from '../ts/request/RequestMethod.ts';
import RouteManager from '../ts/request/RouteManager.ts';
import { RouteTypes } from '../ts/request/RouteTypes.ts';

Deno.test('localhost ip is replaced with localhost name', () => {
  const config: Config = {
    configVersion: '',
    routes: [{
      routeType: RouteTypes.DEFAULT,
      isEnabled: true,
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
  const req = new Request('http://127.0.0.1:8000/test');
  assert(!!manager.match(req, [], 8000));
});

Deno.test('match is not triggered if route does not match', () => {
  const config: Config = {
    configVersion: '',
    routes: [{
      routeType: RouteTypes.DEFAULT,
      isEnabled: true,
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
  const req = new Request('http://localhost:8000/bad');
  assertFalse(!!manager.match(req, [], 8000));
});

Deno.test('non-matching method does not trigger a match', () => {
  const config: Config = {
    configVersion: '',
    routes: [{
      routeType: RouteTypes.DEFAULT,
      isEnabled: true,
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
  const req = new Request('http://localhost:8000/test', {
    method: 'POST',
  });
  assertFalse(!!manager.match(req, [], 8000));
});

Deno.test('url and method need to match to trigger a match', () => {
  const config: Config = {
    configVersion: '',
    routes: [{
      routeType: RouteTypes.DEFAULT,
      isEnabled: true,
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
  const req = new Request('http://localhost:8000/test');
  assert(!!manager.match(req, [], 8000));
});

Deno.test('HEAD method is allowed instead of correct method', () => {
  const config: Config = {
    configVersion: '',
    routes: [{
      routeType: RouteTypes.DEFAULT,
      isEnabled: true,
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
  const req = new Request('http://localhost:8000/test', {
    method: 'HEAD',
  });
  assert(!!manager.match(req, [], 8000));
});

Deno.test('disabled route should not trigger a match', () => {
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
  const req = new Request('http://localhost:8000/test');
  assertFalse(!!manager.match(req, [], 8000));
});

Deno.test('routes are returned in specificity order', () => {
  const config: Config = {
    configVersion: '',
    routes: [
      {
        routeType: RouteTypes.DEFAULT,
        isEnabled: true,
        title: 'good',
        url: '/api/:version/users/ploiu', // 11
        method: RequestMethod.GET,
        responseHeaders: {},
        response: null,
        responseStatus: 0,
      },
      {
        routeType: RouteTypes.DEFAULT,
        isEnabled: true,
        title: 'bad',
        url: '/api/:version/users/:username', // 10
        method: RequestMethod.GET,
        responseHeaders: {},
        response: null,
        responseStatus: 0,
      },
    ],
  };
  const manager = new RouteManager();
  manager.setupRoutes(config);
  const req = new Request('http://localhost:8000/api/v3/users/ploiu');
  const match = manager.match(req, [], 8000);
  assertEquals(match?.title, 'good');
});
