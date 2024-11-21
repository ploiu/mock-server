import { reactive } from 'vue';
import { UIRoute } from './models/index.ts';
import { LogEntry } from '../ts/model/LogModels.ts';

type StoreFields = {
  routes: UIRoute[];
};

const storeBody = () => {
  let _routes: UIRoute[] = [];
  let _logs: LogEntry[] = [];
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
    set logs(l: LogEntry[]) {
      console.log('setting logs');
      _logs = l;
    },
  } as StoreFields;
};

export const store = reactive(storeBody());
