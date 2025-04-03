import { assertEquals } from '@std/assert';
import { RequestMethod } from '../../ts/request/RequestMethod.ts';
import { RouteTypes } from '../../ts/request/RouteTypes.ts';
import RouteFactory from '../../ts/request/RouteFactory.ts';

// deno-lint-ignore no-explicit-any
(globalThis as any).enqueueLogEvent = () => {};

Deno.test('execute should template out the response body from url parameters', async () => {
  const route = RouteFactory.create({
    title: 'test',
    url: '/test/:name/:age/:favoriteColor?:favoriteFood',
    responseHeaders: {},
    response:
      `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor}} {{favoriteFood}}`,
    method: RequestMethod.GET,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  const res = await route.execute(
    <Request> {
      url: '/test/ploiu/23/green?favoriteFood=pasta',
      method: RequestMethod.GET,
    },
  );
  assertEquals(
    await res.text(),
    'Hello, ploiu! You are 23 years old and you probably like green pasta',
  );
});

Deno.test('execute should use default variables if an optional variable is not included', async () => {
  const route = RouteFactory.create({
    title: 'test',
    url: '/test/:name/:age/:favoriteColor?:favoriteFood',
    responseHeaders: {},
    response:
      `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor:green}} {{favoriteFood}}. My favorite color is {{favoriteColor:blue}}`,
    method: RequestMethod.GET,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  const res = await route.execute(
    <Request> {
      url: '/test/ploiu/23?favoriteFood=pasta',
      method: RequestMethod.GET,
    },
  );
  assertEquals(
    await res.text(),
    'Hello, ploiu! You are 23 years old and you probably like green pasta. My favorite color is blue',
    'default values should be used if the variable is not included',
  );
});

Deno.test('execute should fill in default variable fields if the variable is included', async () => {
  const route = RouteFactory.create({
    title: 'test',
    url: '/test/:name/:age?:favoriteColor?&:favoriteFood',
    responseHeaders: {},
    response:
      `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor:green}} {{favoriteFood}}. My favorite color is {{favoriteColor:blue}}`,
    method: RequestMethod.GET,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });

  const res = await route.execute(
    <Request> {
      url: '/test/ploiu/23?favoriteFood=pasta&favoriteColor=orange',
      method: RequestMethod.GET,
    },
  );
  assertEquals(
    await res.text(),
    'Hello, ploiu! You are 23 years old and you probably like orange pasta. My favorite color is orange',
    'default value templates should be filled if the variable is included',
  );
});

Deno.test('execute should set the proper response status code', async () => {
  const route = RouteFactory.create({
    title: 'test',
    url: '/test/:name/:age/:favoriteColor?:favoriteFood',
    responseHeaders: {},
    response:
      `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor}} {{favoriteFood}}`,
    method: RequestMethod.GET,
    responseStatus: 418,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  const res = await route.execute(
    <Request> {
      url: '/test/ploiu/23/green?favoriteFood=pasta',
      method: RequestMethod.GET,
    },
  );
  assertEquals(res.status, 418, 'Response status codes should match');
});

Deno.test('execute should set the proper response headers', async () => {
  const route = RouteFactory.create({
    title: 'test',
    url: '/test/:name/:age/:favoriteColor?:favoriteFood',
    responseHeaders: {
      'Content-Type': 'text/plain',
    },
    response:
      `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor}} {{favoriteFood}}`,
    method: RequestMethod.GET,
    responseStatus: 418,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  const res = await route.execute(
    <Request> {
      url: '/test/ploiu/23/green?favoriteFood=pasta',
      method: RequestMethod.GET,
    },
  );
  assertEquals(
    res.headers?.get('Content-Type'),
    'text/plain',
    'Response headers should match',
  );
});

Deno.test('execute should properly handle `null` for response body', async () => {
  const route = RouteFactory.create({
    title: 'test',
    url: '/test/',
    responseHeaders: {
      'Content-Type': 'text/plain',
    },
    response: null,
    method: RequestMethod.GET,
    responseStatus: 418,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  const res = await route.execute(
    <Request> {
      url: '/test/',
      method: RequestMethod.GET,
    },
  );
  assertEquals(res.body, null, 'response body should be null');
});
