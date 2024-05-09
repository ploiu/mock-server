<script setup lang="ts">
import { store } from '../store';
import RouteListEntry from '../components/RouteListEntry.vue';
import { UIRoute } from '../models';
import { fetchRoutes, saveRoutes, stringifyRoute } from '../service/RouteService';


const updateRoute = (originalRoute: UIRoute, updatedRoute: UIRoute) => {
  const originalRouteKey = stringifyRoute(originalRoute)
  const withoutOriginal = store.routes.filter(route => stringifyRoute(route) !== originalRouteKey);
  saveRoutes([...withoutOriginal, updatedRoute])
    .then(() => fetchRoutes().then(routes => store.routes = routes))
}
</script>

<template>
  <div class="row">
    <div id="routeList" class="col-3">
      <RouteListEntry v-for="route in store.routes" :key="route.method + '_' + route.url" :route="route"
        @change="updated => updateRoute(route, updated)" />
    </div>
    <div id="routeEditor" class="col-9">

    </div>
  </div>
</template>

<style scoped>
#routeList {
  display: flex;
  max-height: 90vh;
  overflow-y: auto;
  flex-direction: column;

  >.route-list-entry {
    margin-bottom: 1em;
  }
}
</style>
