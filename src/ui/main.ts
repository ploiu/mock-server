import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { createMemoryHistory, createRouter, RouteRecordRaw } from 'vue-router';
import RouteView from './pages/RouteView.vue';

const routes = [
  { path: '/', component: RouteView as unknown },
] as RouteRecordRaw[];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

createApp(App)
  .use(router)
  .mount('#app');
