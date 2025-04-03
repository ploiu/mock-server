import { assert, assertEquals, assertNotEquals } from '@std/assert';
import { RequestMethod } from '../../ts/request/RequestMethod.ts';
import { RouteTypes } from '../../ts/request/RouteTypes.ts';
import RouteFactory from '../../ts/request/RouteFactory.ts';

Deno.test('doesUrlMatch matches simple url', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(route.doesUrlMatch('/test'), 'url should match /test');
  // make sure other routes starting with /test don't match
  assertNotEquals(
    route.doesUrlMatch('/test/a/b/c'),
    true,
    'url should not match /test/a/b/c',
  );
});

Deno.test('doesUrlMatch matches query params with . in the name and value', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test?:first.last&:a.b',
    routeType: RouteTypes.DEFAULT,
    responseHeaders: new Headers(),
    response: 'test',
    responseStatus: 200,
    isEnabled: true,
  });
  assert(
    route.doesUrlMatch('/test?first.last=5&a.b=6'),
    'route does not match query params with dot in the name',
  );
  assert(
    route.doesUrlMatch(
      '/test?first.last=5.5&a.b=6.6',
    ),
    'route does not match query params with dot in the value',
  );
});

Deno.test('doesUrlMatch matches urls with non-alphanumeric characters', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:email/:code',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.doesUrlMatch('/test/test@example.com/123456'),
    'url should match /test/test@example.com/123456',
  );
});

Deno.test('doesUrlMatch matches simple url with multiple path sections', () => {
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
  assert(route.doesUrlMatch('/test/a/b/c'), 'url should match /test/a/b/c');
  // ensure other routes that don't match aren't counted
  assertNotEquals(
    route.doesUrlMatch('/test'),
    true,
    'url should not match /test',
  );
});

Deno.test('doesUrlMatch matches url with path variables', () => {
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
  assert(
    route.doesUrlMatch('/test/ploiu/23'),
    'url should match with both variables filled in',
  );
  assertNotEquals(
    route.doesUrlMatch('/test/ploiu'),
    true,
    'url should not match without missing variables',
  );
});

Deno.test('doesUrlMatch matches url with optional path variables', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name?/:age',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.doesUrlMatch('/test/ploiu/23'),
    'url should match with all variables',
  );
  assert(
    route.doesUrlMatch('/test/23'),
    'url should match with one variable',
  );
  assertNotEquals(
    route.doesUrlMatch('/test'),
    true,
    'url should not match without any variables',
  );
});

Deno.test('doesUrlMatch matches url with query variables', () => {
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
  assert(
    route.doesUrlMatch('/test?name=ploiu&age=23'),
    'url should match with both variables',
  );
  assertNotEquals(
    route.doesUrlMatch('/test?name=ploiu'),
    true,
    'url should not match without all variables',
  );
});

Deno.test('doesUrlMatch ensures query variable names are included', () => {
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
  assertNotEquals(
    route.doesUrlMatch('/test?abc=ploiu&efg=23'),
    true,
    'url should match with both variables',
  );
  assertNotEquals(
    route.doesUrlMatch('/test?name=ploiu'),
    true,
    'url should not match query variables not in our pattern',
  );
});

Deno.test('doesUrlMatch matches url with optional query variables', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test?:name?&:age',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.doesUrlMatch('/test?name=ploiu&age=23'),
    'url should match with all variables',
  );
  assert(
    route.doesUrlMatch('/test?age=23'),
    'url should match with one variable',
  );
});

Deno.test('doesUrlMatch matches url with mandatory and optional path and query parameters', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name/:age??:favoriteColor&:favoriteFood?',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.doesUrlMatch(
      '/test/ploiu/23?favoriteColor=green&favoriteFood=pasta',
    ),
    'url should match with all variables',
  );
  assert(
    route.doesUrlMatch('/test/ploiu?favoriteColor=green'),
    'url should match with only mandatory variables',
  );
});

Deno.test('doesUrlMatch matches url with mandatory and optional path and query parameters (mandatory path param followed by query param)', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test/:name/:age?:favoriteColor&:favoriteFood?',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.doesUrlMatch(
      '/test/ploiu/23?favoriteColor=green&favoriteFood=pasta',
    ),
    'url should match with all variables',
  );
  assert(
    route.doesUrlMatch('/test/ploiu/23?favoriteColor=green'),
    'url should match with only mandatory variables',
  );
});

Deno.test('doesUrlMatch matches any query params if the url specifies ?:*', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test?:*',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.doesUrlMatch('/test?a=b&c=3&d=5'),
    'url should accept any query params',
  );
  assert(route.doesUrlMatch('/test'), 'url should accept zero query params');
});

Deno.test('doesUrlMatch still requires explicitly-named query params if ?:* or &:* is passed', () => {
  const route = RouteFactory.create({
    title: 'test',
    method: RequestMethod.GET,
    url: '/test?:name&:*',
    responseHeaders: {},
    response: 'hi',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  assert(
    route.doesUrlMatch('/test?name=test&a=3'),
    'url should still accept required query params',
  );
  assertEquals(
    false,
    route.doesUrlMatch('/test?a=3'),
    'url should still require query params',
  );
});

Deno.test('doesUrlMatch matches trailing / in url path', () => {
  const urls = {
    '/test': '/test/',
    '/test/:a': '/test/test/',
    '/test?:a': '/test/?a=test',
  };
  for (const [pattern, url] of Object.entries(urls)) {
    const route = RouteFactory.create({
      title: 'test',
      method: RequestMethod.GET,
      url: pattern,
      responseHeaders: {},
      response: 'test',
      responseStatus: 200,
      isEnabled: true,
      routeType: RouteTypes.DEFAULT,
    });
    assert(
      route.doesUrlMatch(url),
      'url should allow trailing path slash, regex is ' +
        route.compiledUrlRegex,
    );
  }
});
