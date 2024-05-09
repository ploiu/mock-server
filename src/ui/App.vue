<script setup lang="ts">
import { store } from './store';
import { fetchRoutes } from './service/RouteService.ts';
import { RequestMethod } from '../ts/request/RequestMethod';
import { RouteTypes } from '../ts/request/RouteTypes';
fetchRoutes().then(routes => store.routes = routes)
</script>

<template>
  <main>
    <div class="row">
      <button>Route Editor</button>
      <button>Route Log</button>
    </div>
    <RouterView />
  </main>
</template>

<style scoped></style>
