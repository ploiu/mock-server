import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createMemoryHistory, createRouter, RouteRecordRaw } from 'vue-router';
import RouteView from './pages/RouteView.vue';
import LogView from './pages/LogView/LogView.vue';
import PrimeVue from 'primevue/config';
import Lara from '@primevue/themes/lara';

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
  .use(PrimeVue, {
    theme: {
      preset: Lara,
      options: {
        prefix: 'p',
        darkModeSelector: 'system',
        cssLayer: true,
      },
    },
  })
  .mount('#app');
