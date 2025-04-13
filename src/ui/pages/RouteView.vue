<script setup lang="ts">
import RouteListEntry from '../components/RouteListEntry.vue';
import { UIRoute } from '../models';
import { fetchRoutes, saveRoutes } from '../service/RouteService';
import { store } from '../store';
import Button from 'primevue/button';
import Toast from 'primevue/toast'
import { ref } from 'vue';
import RouteEditor from '../components/RouteEditor.vue';
import { stringifyUIRoute, newUIRoute } from '../models/UIRoute';
import { useToast } from 'primevue/usetoast';
import type { ToastMessageOptions } from 'primevue/toast'
import InputText from 'primevue/inputtext'

const currentRoute = ref<UIRoute | null>(null);
const filteredRoutes = ref<UIRoute[]>(store.routes)

const toast = useToast();
const successToast: ToastMessageOptions = { severity: 'success', summary: 'success', detail: 'Successfully saved mock', life: 2_500 }
const errorToast: ToastMessageOptions = { severity: 'error', summary: 'error', detail: 'Failed to save mock. Check server logs for details.', life: 2_500 }
const showSuccess = () => toast.add(successToast)
const showError = () => toast.add(errorToast)
const filterRoutes = (e: Event) => {
  const searchValue = (e.currentTarget as HTMLInputElement).value.trim().toLowerCase();
  if (searchValue === '') {
    filteredRoutes.value = store.routes
  } else {
    filteredRoutes.value = store.routes.filter(it => it.title.toLowerCase().includes(searchValue) || it.url.toLowerCase().includes(searchValue))
  }
}

const saveRoute = async (originalRoute: UIRoute | null, updatedRoute: UIRoute) => {
  const withoutOriginal = store.routes.filter(route => route !== originalRoute);
  try {
    await saveRoutes([...withoutOriginal, updatedRoute])
    showSuccess()
  } catch {
    showError()
  }
  store.routes = await fetchRoutes()
  // re-select the saved route based on what we get
  currentRoute.value = store.routes.filter(it => stringifyUIRoute(it) === stringifyUIRoute(updatedRoute))[0]
}

const deleteRoute = async (route: UIRoute) => {
  if (currentRoute.value && stringifyUIRoute(route) === stringifyUIRoute(currentRoute.value)) {
    currentRoute.value = null;
  }
  const without = store.routes.filter(it => stringifyUIRoute(it) !== stringifyUIRoute(route));
  try {
    await saveRoutes(without)
  } catch {
    showError()
  }
  store.routes = await fetchRoutes()
}

const selectRoute = (route: UIRoute) => {
  currentRoute.value = route;
}

</script>

<template>
  <Toast />
  <div class="row">
    <div id="routeListContainer" class="col-3">
      <InputText id="search" type="text" placeholder="search" @input="filterRoutes" />
      <div id="routeList">
        <RouteListEntry v-for="route in filteredRoutes" :key="stringifyUIRoute(route)" :route="route"
          @change="updated => saveRoute(route, updated)" @click="() => selectRoute(route)" @delete="deleteRoute" />
      </div>
      <Button id="createRouteButton" label="Create New" @click="() => selectRoute(newUIRoute())" />
    </div>
    <div class="col-9">
      <RouteEditor v-if="currentRoute !== null && currentRoute !== undefined" :route="currentRoute"
        @save="route => saveRoute(currentRoute, route)" :key="currentRoute.title" />
    </div>
  </div>
</template>

<style scoped>
#routeListContainer {
  max-height: 90vh;

  >#routeList {
    display: flex;
    max-height: 70vh;
    overflow-y: auto;
    flex-direction: column;

    >.route-list-entry {
      margin-bottom: 1em;
    }
  }

  >#search {
    width: 100%;
    margin-bottom: 1em;
  }

  >#createRouteButton {
    margin-top: 1em;
    width: 100%;
  }
}
</style>
