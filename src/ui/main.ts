import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createMemoryHistory, createRouter, RouteRecordRaw } from 'vue-router';
import RouteView from './pages/RouteView.vue';
import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/lara-dark-indigo/theme.css';
import 'primeicons/primeicons.css';

const routes = [
  { path: '/', component: RouteView },
] as RouteRecordRaw[];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

createApp(App)
  .use(router)
  .use(PrimeVue)
  .mount('#app');
