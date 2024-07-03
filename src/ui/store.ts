import { reactive } from 'vue';
import { UIRoute } from './models/index.ts';
import { UILogEntry } from './models/UILogEntry.ts';

type StoreFields = {
  routes: UIRoute[];
};

const storeBody = () => {
  let _routes: UIRoute[] = [];
  let _logs: UILogEntry[] = [];
  return {
    get routes() {
      return _routes;
    },
    set routes(r: UIRoute[]) {
      _routes = r.sort((a, b) =>
        (a.title + a.method).localeCompare(b.title + b.method)
      );
    },
    get logs() {
      return _logs;
    },
    set logs(l: UILogEntry[]) {
      _logs = l;
    },
  } as StoreFields;
};

export const store = reactive(storeBody());
