<script setup lang="ts">
import RouteListEntry from '../components/RouteListEntry.vue';
import { UIRoute } from '../models';
import { fetchRoutes, saveRoutes } from '../service/RouteService';
import { store } from '../store';
import Button from 'primevue/button';
import { ref } from 'vue';
import RouteEditor from '../components/RouteEditor.vue';
import { stringifyUIRoute, newUIRoute } from '../models/UIRoute';

const currentRoute = ref<UIRoute | null>(null);

const saveRoute = async (originalRoute: UIRoute | null, updatedRoute: UIRoute) => {
  const withoutOriginal = store.routes.filter(route => route !== originalRoute);
  await saveRoutes([...withoutOriginal, updatedRoute])
  store.routes = await fetchRoutes()
  // re-select the saved route based on what we get
  currentRoute.value = store.routes.filter(it => stringifyUIRoute(it) === stringifyUIRoute(updatedRoute))[0]
}

const deleteRoute = async (route: UIRoute) => {
  if(currentRoute.value && stringifyUIRoute(route) === stringifyUIRoute(currentRoute.value)) {
    currentRoute.value = null;
  }
  const without = store.routes.filter(it => stringifyUIRoute(it) !== stringifyUIRoute(route));
  await saveRoutes(without)
  store.routes = await fetchRoutes()
}

const selectRoute = (route: UIRoute) => {
  currentRoute.value = route;
}

</script>

<template>
  <div class="row">
    <div id="routeListContainer" class="col-3">
      <div id="routeList">
        <RouteListEntry v-for="route in store.routes" :key="stringifyUIRoute(route)" :route="route"
          @change="updated => saveRoute(route, updated)" @click="() => selectRoute(route)" @delete="deleteRoute"/>
      </div>
      <Button id="createRouteButton" label="Create New" @click="() => selectRoute(newUIRoute())" />
    </div>
    <div class="col-9">
      <RouteEditor v-if="currentRoute !== null && currentRoute !== undefined" :route="currentRoute" @save="route => saveRoute(currentRoute, route)" :key="currentRoute.title" />
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
