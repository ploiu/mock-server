import { reactive } from 'vue';
import { UIRoute } from './models/index.ts';

type StoreFields = {
  routes: UIRoute[];
};

const storeBody = () => {
  let _routes: UIRoute[] = [];
  return {
    get routes() {
      return _routes;
    },
    set routes(r: UIRoute[]) {
      _routes = r.sort((a, b) =>
        (a.title + a.method).localeCompare(b.title + b.method)
      );
    },
  } as StoreFields;
};

export const store = reactive(storeBody());
