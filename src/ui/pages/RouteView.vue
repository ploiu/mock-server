<script setup lang="ts">
import RouteListEntry from '../components/RouteListEntry.vue';
import { UIRoute } from '../models';
import { fetchRoutes, saveRoutes } from '../service/RouteService';
import { store } from '../store';
import Button from 'primevue/button';
import { ref } from 'vue';
import RouteEditor from '../components/RouteEditor.vue';

const currentRoute = ref<UIRoute | null>(null);

const updateRoute = async (originalRoute: UIRoute, updatedRoute: UIRoute) => {
  const withoutOriginal = store.routes.filter(route => route !== originalRoute);
  await saveRoutes([...withoutOriginal, updatedRoute])
  store.routes = await fetchRoutes()
}

const deleteRoute = async (route: UIRoute) => {
  const without = store.routes.filter(it => it !== route);
  await saveRoutes(without)
  store.routes = await fetchRoutes()
}

const createRoute = async (route: UIRoute) => {
  await saveRoutes([...store.routes, route])
  store.routes = await fetchRoutes()
}

const selectRoute = (route: UIRoute) => {
  currentRoute.value = route;
}

/*
  TODO don't use v-model for any editor fields (update method)
  use timeout + last edit times + @change
*/

</script>

<template>
  <div class="row">
    <div id="routeListContainer" class="col-3">
      <div id="routeList">
        <RouteListEntry v-for="route in store.routes" :key="route.method + '_' + route.url" :route="route"
          @change="updated => updateRoute(route, updated)" @click="() => selectRoute(route)" />
      </div>
      <Button id="createRouteButton" label="Create New" @click="() => selectRoute({} as unknown as UIRoute)" />
    </div>
    <div class="col-9">
      <RouteEditor v-if="currentRoute !== null" :route="currentRoute" />
    </div>
  </div>
</template>

<style scoped>
#routeListContainer {
  max-height: 90vh;

  >#routeList {
    display: flex;
    max-height: 85vh;
    overflow-y: auto;
    flex-direction: column;

    >.route-list-entry {
      margin-bottom: 1em;
    }
  }

  >#createRouteButton {
    margin-top: 1em;
    width: 100%;
  }
}
</style>
