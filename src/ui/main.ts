import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createMemoryHistory, createRouter, RouteRecordRaw } from 'vue-router';
import RouteView from './pages/RouteView.vue';
import LogView from './pages/LogView.vue';
import PrimeVue from 'primevue/config';

const routes = [
  { path: '/', component: RouteView },
  { path: '/logs', component: LogView },
] as RouteRecordRaw[];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

createApp(App)
  .use(router)
  .use(PrimeVue)
  .mount('#app');
