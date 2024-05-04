import { reactive } from 'vue';
import { UIRoute } from './models/index.ts';

type StoreFields = {
  routes: UIRoute[];
};

export const store = reactive({
  routes: [],
} as StoreFields);
