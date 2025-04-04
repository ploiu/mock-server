import { assert, assertEquals, fail } from '@std/assert';
import { RequestMethod } from '../ts/request/RequestMethod.ts';
import RouteFactory from '../ts/request/RouteFactory.ts';
import { RouteTypes } from '../ts/request/RouteTypes.ts';
import Route from '../ts/request/Route.ts';

Deno.test('fromObject differentiates between response as object and response as string', () => {
  const routeStringResponse = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    // adding a query variable after an optional variable to make sure that works
    url: '/test/:name/:age??:a',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  const routeObjectResponse = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    // adding a query variable after an optional variable to make sure that works
    url: '/test/:name/:age??:a',
    responseHeaders: {},
    response: { value: 'hi' },
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(routeStringResponse.response, 'hi');
  assertEquals(routeObjectResponse.response, `{"value":"hi"}`);
});

Deno.test('properly parses path variables', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    // adding a query variable after an optional variable to make sure that works
    url: '/test/:name/:age??:a',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.hasPathVariable('name', false),
    'route has name as mandatory variable',
  );
  assert(
    route.hasPathVariable('age', true),
    'route has age as optional variable',
  );
});

Deno.test('properly parses query variables', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    // adding a query variable after an optional variable to make sure that works
    url: '/test/?:name&:age?',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.hasQueryVariable('name', false),
    'route has name as mandatory variable',
  );
  assert(
    route.hasQueryVariable('age', true),
    'route has age as optional variable',
  );
});

Deno.test('specificity for regular path segment', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(3, route.specificity);
});

Deno.test('specificity for required path variable', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/:test',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(2, route.specificity);
});

Deno.test('specificity for optional path variable', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/:test?',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(1, route.specificity);
});

Deno.test('specificity for catch-all path variable', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/:*',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(0, route.specificity);
});

Deno.test('specificity for regular query param', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '?test',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(3, route.specificity);
});

Deno.test('specificity for mandatory query variable', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '?:test',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(2, route.specificity);
});

Deno.test('specificity for optional query variable', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '?:test?',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(3, route.specificity);
});

Deno.test('specificity for catch-all query variable', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '?:*',
    responseHeaders: {},
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(0, route.specificity);
});
