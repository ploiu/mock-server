<script setup lang="ts">
import RouteListEntry from '../components/RouteListEntry.vue';
import { UIRoute } from '../models';
import { fetchRoutes, saveRoutes } from '../service/RouteService';
import { store } from '../store';
import Button from 'primevue/button';
import { ref } from 'vue';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';
import Dropdown from 'primevue/dropdown';
import { RequestMethod } from '../../ts/request/RequestMethod';
import { RouteTypes } from '../../ts/request/RouteTypes';
import UrlEditor from '../components/UrlEditor.vue';

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
    <div id="routeEditor" class="col-9" v-if="currentRoute !== null">
      <!-- title, type, response code -->
      <div class="row">
        <!-- title  -->
        <div class="col-4">
          <FloatLabel id="requestTitleWrapper">
            <InputText id="requestTitle" v-model="currentRoute.title" />
            <label for="requestTitle">Title</label>
          </FloatLabel>
        </div>
        <!-- type  -->
        <div class="col-4">
          <Dropdown id="routeTypes" v-model="currentRoute.routeType" :options="Object.values(RouteTypes)"
            placeholder="type" />
        </div>
        <!-- status code  -->
        <div class="col-4" v-if="currentRoute.routeType === RouteTypes.DEFAULT">
          <FloatLabel id="responseStatusCodeWrapper">
            <InputText id="responseStatusCode" type="number" :value="currentRoute.responseStatus"
              @change="e => currentRoute!.responseStatus = Number((e as any).target.value)" />
            <label for="responseStatusCode">Status Code</label>
          </FloatLabel>
        </div>
      </div>
      <!-- method, url -->
      <div class="row">
        <div class="col-2">
          <Dropdown id="requestMethod" v-model="currentRoute.method" :options="Object.keys(RequestMethod)" placeholder="Method" />
        </div>
        <div class="col-10">
          <!-- key is set here to force re-render when currentRoute changes -->
          <UrlEditor :initial-text="currentRoute.url" :key="currentRoute.url" />
        </div>
      </div>
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

#routeEditor > .row {
  margin-top: 1em;
}

#requestTitle,
#routeTypes,
#responseStatusCode,
#requestUrl,
#requestMethod {
  width: 100%;
}
</style>
