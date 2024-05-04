<script setup lang="ts">
import { store } from './store';
import { fetchRoutes } from './service/ConfigService.ts';
import { RequestMethod } from '../ts/request/RequestMethod';
import { RouteTypes } from '../ts/request/RouteTypes';

fetchRoutes().then(routes => store.routes = routes).catch(() => store.routes.push(
  {
    title: 'test',
    url: '/test',
    method: RequestMethod.GET,
    responseHeaders: [],
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT
  },
  {
    title: 'test but with a lot longer name andWithLongSingleWordsWhatTheHell',
    url: '/test',
    method: RequestMethod.GET,
    responseHeaders: [],
    response: null,
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT
  }
))
</script>

<template>
  <h1>Hello App!</h1>
  <p>
    <strong>Current route path:</strong> {{ $route.fullPath }}
  </p>
  <nav>
    <RouterLink to="/">Go to Home</RouterLink>
    <RouterLink to="/about">Go to About</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
strong {
  color: green;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
