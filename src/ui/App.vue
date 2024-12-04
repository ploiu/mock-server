<script setup lang="ts">
import { store } from './store';
import { fetchRoutes } from './service/RouteService.ts';
import { onUnmounted } from 'vue'
import { fetchLogs } from './service/LogService.ts';
import Button from 'primevue/button'
fetchRoutes().then(routes => store.routes = routes)
const source = fetchLogs();
source.onmessage = e => {
  const parsed: LogEntry = JSON.parse(e.data)
  store.logs.push(parsed)
}
window.addEventListener('beforeunload', () => source.close())
onUnmounted(() => { source.close() })
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
