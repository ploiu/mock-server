import { assertEquals, fail } from '@std/assert';
import { RequestMethod } from '../ts/request/RequestMethod.ts';
import { RouteTypes } from '../ts/request/RouteTypes.ts';
import RouteFactory from '../ts/request/RouteFactory.ts';

// deno-lint-ignore no-explicit-any
(globalThis as any).enqueueLogEvent = () => {};

Deno.test('should make a call to the redirect url when invoked', async () => {
  const handler = async (request: Request) => {
    assertEquals(
      request.url,
      'http://localhost:8001/test',
    );
    assertEquals(
      await request.text(),
      '{"test": 1}',
    );
    assertEquals(
      request.method,
      RequestMethod.POST,
    );
    assertEquals(
      request.headers.get('Content-Type'),
      'application/json',
    );
    return new Response('test body', { status: 200 });
  };
  const server = Deno.serve({ port: 8001, handler });
  const route = RouteFactory.create({
    id: '',
    title: 'test route',
    url: '/test',
    method: RequestMethod.POST,
    responseHeaders: new Headers(),
    response: null,
    responseStatus: 404, // make sure we don't get 404, because we should get what the handler gives back
    isEnabled: true,
    redirectUrl: 'http://localhost:8001',
    routeType: RouteTypes.PASSTHROUGH,
  });
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  route.execute(
    new Request('https://localhost:8000/test', {
      method: RequestMethod.POST,
      headers,
      body: '{"test": 1}',
    }),
  ).then(async (response) => {
    await server.shutdown();
    assertEquals(response.status, 200);
    assertEquals(
      await response.text(),
      'test body',
    );
  }).catch(async (exception) => {
    await server.shutdown();
    fail('route execution failed\n' + exception);
  });
  await server.finished;
});

Deno.test('should pass along any path and query variables', async () => {
  const handler = (request: Request) => {
    assertEquals(request.url, 'http://localhost:8081/users?name=ploiu&age=24');
    return new Response('tests passed');
  };
  const server = Deno.serve({ port: 8081, handler });
  const route = RouteFactory.create({
    id: '',
    title: 'test route',
    // this isn't restful or realistic, but it fits the test so oh well
    url: '/:searchType?:name&:age',
    method: RequestMethod.GET,
    responseHeaders: new Headers(),
    response: null,
    responseStatus: 200,
    isEnabled: true,
    redirectUrl: 'http://localhost:8081',
    routeType: RouteTypes.PASSTHROUGH,
  });
  route.execute(
    new Request('http://localhost:8000/users?name=ploiu&age=24', {
      method: RequestMethod.GET,
    }),
  ).then(async (response) => {
    await server.shutdown();
    assertEquals(await response.text(), 'tests passed');
  }).catch(async (exception) => {
    await server.shutdown();
    fail('route execution failed\n' + exception);
  });
  await server.finished;
});
