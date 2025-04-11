<script setup lang="ts">
import { store } from './store';
import { fetchRoutes } from './service/RouteService.ts';
import { onUnmounted } from 'vue'
import { fetchLogs } from './service/LogService.ts';
import Button from 'primevue/button'
fetchRoutes().then(routes => store.routes = routes)
</script>
<script lang="ts">
function setupEventSource() {
  const s = fetchLogs();
  s.onmessage = e => {
    const parsed: LogEntry = JSON.parse(e.data)
    store.logs.push(parsed)
  }
  window.addEventListener('beforeunload', () => s?.close())
  onUnmounted(() => { s.close() })
  return s
}
globalThis.source = setupEventSource();
console.log('source: ', globalThis.source)
// sometimes the source just dies, so this lets us revive it
const interval = setInterval(() => {
  if (globalThis.source.readyState === EventSource.CLOSED) {
    globalThis.source = setupEventSource();
  }
}, 100)
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
