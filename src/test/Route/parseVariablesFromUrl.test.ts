import { assertEquals } from '@std/assert';
import { RouteTypes } from '../../ts/request/RouteTypes.ts';
import RouteFactory from '../../ts/request/RouteFactory.ts';
import { RequestMethod } from '../../ts/request/RequestMethod.ts';

Deno.test('parseVariablesFromUrl should return an empty js object if there are no variables to parse', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/a/b/c',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assertEquals(route.parseVariablesFromUrl('/test/a/b/c'), {});
});

Deno.test('parseVariablesFromUrl should return an object with path variables in it', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name/:age',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(route.parseVariablesFromUrl('/test/ploiu/23'), {
    name: 'ploiu',
    age: '23',
  }, 'path parameters should be included');
});

Deno.test('parseVariablesFromUrl should return an object with path variables in it for variables not directly sequential', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name/hi/:age',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(route.parseVariablesFromUrl('/test/ploiu/hi/23'), {
    name: 'ploiu',
    age: '23',
  }, 'path parameters should be included');
});

Deno.test('parseVariablesFromUrl should set non-included path variables as null', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name?/:age/:favoriteFood?',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(route.parseVariablesFromUrl('/test/ploiu/23'), {
    name: 'ploiu',
    age: '23',
    favoriteFood: null,
  }, 'path parameters should be included');
});

Deno.test('parseVariablesFromUrl should set non-included path variables for variables not directly sequential as null', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name?/hi/:age/:favoriteFood?',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(route.parseVariablesFromUrl('/test/hi/23'), {
    name: null,
    age: '23',
    favoriteFood: null,
  }, 'optional path variables not included should be set to null');
});

Deno.test('parseVariablesFromUrl should include query parameters', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test?:name&:age',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(route.parseVariablesFromUrl('/test?name=ploiu&age=23'), {
    name: 'ploiu',
    age: '23',
  }, 'query parameters should be included');
});

Deno.test('parseVariablesFromUrl should set non-included query variables as null', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test?:name?&:age&:favoriteFood?',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(route.parseVariablesFromUrl('/test?age=23'), {
    name: null,
    age: '23',
    favoriteFood: null,
  }, 'optional query variables not included should be set to null');
});

Deno.test('parseVariablesFromUrl should parse non-named query variables allowed with ?:* and &:*', async () => {
  // deno-lint-ignore no-explicit-any
  (globalThis as any).enqueueLogEvent = () => {};
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test?:*',
    responseHeaders: {},
    response: '{{a}}, {{b}}, {{c}}, {{d:test}}',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  const result = await (await route.execute(
    <Request> { url: '/test?a=1&b=2&c=3', method: RequestMethod.GET },
  )).text();
  assertEquals(
    '1, 2, 3, test',
    result,
    'should parse non-explicitly named variables',
  );
});

Deno.test('parseVariablesFromUrl should not include http: or https: as a path var', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name/hi/:age',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  assertEquals(
    route.parseVariablesFromUrl('https://localhost:8000/test/ploiu/hi/23'),
    {
      name: 'ploiu',
      age: '23',
    },
    'path parameters should be included',
  );
});
