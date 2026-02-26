import { createApp } from 'vue';
import App from './App.vue';
import { createMemoryHistory, createRouter, RouteRecordRaw } from 'vue-router';
import RouteView from './pages/RouteView.vue';
import LogView from './pages/LogView/LogView.vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Lara from '@primeuix/themes/lara';
import { definePreset } from '@primeuix/themes';

const routes = [
  { path: '/', component: RouteView },
  { path: '/logs', component: LogView },
] as RouteRecordRaw[];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

const themePreset = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}',
    },
  },
});

createApp(App)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: themePreset,
      options: {
        prefix: 'p',
        darkModeSelector: 'system',
        cssLayer: true,
      },
    },
  })
  .use(ToastService)
  .mount('#app');
