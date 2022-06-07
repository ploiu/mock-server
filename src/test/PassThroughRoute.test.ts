import { assertEquals, fail, Server } from './deps.ts';
import { PassThroughRoute } from '../ts/request/specialRoutes/PassThroughRoute.ts';
import { RequestMethod } from '../ts/request/RequestMethod.ts';

Deno.test('should make a call to the redirect url when invokec', async () => {
  const handler = async (request: Request) => {
    assertEquals(
      request.url,
      'http://localhost:8081/test',
      'urls do not match',
    );
    assertEquals(
      await request.text(),
      '{"test": 1}',
      'request body does not match',
    );
    assertEquals(
      request.method,
      RequestMethod.POST,
      'request methods do not match',
    );
    assertEquals(
      request.headers.get('Content-Type'),
      'application/json',
      'request headers do not match',
    );
    return new Response('test body', { status: 200 });
  };
  const server = new Server({ port: 8081, handler });
  const route = PassThroughRoute.fromObject({
    title: 'test route',
    url: '/test',
    method: RequestMethod.POST,
    responseHeaders: new Headers(),
    response: null,
    responseStatus: 404, // make sure we don't get 404, because we should get what the handler gives back
    isEnabled: true,
    redirectUrl: 'http://localhost:8081',
  });
  const listener = server.listenAndServe();
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  route.execute(
    new Request('https://localhost:8000', {
      method: RequestMethod.POST,
      headers,
      body: '{"test": 1}',
    }),
  ).then(async (response) => {
    await server.close();
    assertEquals(response.status, 200, 'response status does not match');
    assertEquals(
      await response.text(),
      'test body',
      'response body does not match',
    );
  }).catch(async (exception) => {
    await server.close();
    fail('route execution failed\n' + exception);
  });
  await listener;
});
