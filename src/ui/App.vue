<script setup lang="ts">
import { store } from './store';
import { fetchRoutes } from './service/RouteService.ts';
import { RequestMethod } from '../ts/request/RequestMethod';
import { RouteTypes } from '../ts/request/RouteTypes';
import Button from 'primevue/button'
fetchRoutes().then(routes => store.routes = routes)
</script>

<template>
  <main>
    <div class="row">
      <h1>Ploiu Mock Server</h1>
    </div>
    <div class="row">
      <nav class="col-3">
        <RouterLink to="/">
          <Button label="Route Editor" />
        </RouterLink>
        <RouterLink to="/logs">
          <Button label="Route Log" />
        </RouterLink>
      </nav>
    </div>
    <RouterView />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
}
</style>
