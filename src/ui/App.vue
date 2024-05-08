<script setup lang="ts">
import { store } from './store';
import { fetchRoutes } from './service/ConfigService.ts';
import { RequestMethod } from '../ts/request/RequestMethod';
import { RouteTypes } from '../ts/request/RouteTypes';

fetchRoutes().then(routes => store.routes = routes).catch(() => store.routes.push(
  {
    title: 'test GET',
    url: '/testGET',
    method: RequestMethod.GET,
    responseHeaders: [],
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT
  }, {
  title: 'test PUT',
  url: '/testPUT',
  method: RequestMethod.PUT,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}, {
  title: 'test POST',
  url: '/testPOST',
  method: RequestMethod.POST,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}, {
  title: 'test DELETE',
  url: '/testDELETE',
  method: RequestMethod.DELETE,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}, {
  title: 'test HEAD',
  url: '/testHEAD',
  method: RequestMethod.HEAD,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}, {
  title: 'test CONNECT',
  url: '/testCONNECT',
  method: RequestMethod.CONNECT,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}, {
  title: 'test OPTIONS',
  url: '/testOPTIONS',
  method: RequestMethod.OPTIONS,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}, {
  title: 'test TRACE',
  url: '/testTRACE',
  method: RequestMethod.TRACE,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}, {
  title: 'test PATCH',
  url: '/testPATCH',
  method: RequestMethod.PATCH,
  responseHeaders: [],
  response: null,
  responseStatus: 200,
  isEnabled: true,
  routeType: RouteTypes.DEFAULT
}
))
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>

<style scoped></style>
