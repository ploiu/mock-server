import { store } from '../../store.ts';
import { ref, watch } from 'vue';
import {
  type Log,
  LogTypes,
  RequestLogEntry,
  ResponseLogEntry,
} from '../../../ts/model/LogModels.ts';

type GroupedLog = {
  request?: RequestLogEntry;
  response?: ResponseLogEntry;
  error?: RequestLogEntry;
  id: string;
};

const logs = ref({} as Record<string, GroupedLog>);

watch(store.logs, (newLogs: Log[]) => {
  logs.value = {};
  for (const log of newLogs) {
    /* feels a bit "clever" (read: hard to understand if you come back to it 6 months from now) so I'll explain. ??= is a default assignment
        and it works not just with variables, but with values within an object so in this case if the logs doesn't have anything from this group,
        it gets set within `logs` as a new GroupedLog. Since it's wrapped in parentheses, that default group gets set to group. This lets us
        avoid multiple if statements checking if the log group is in `logs`, and then creating a new group blah blah blah */
    const group = (logs.value[log.id] ??= { id: log.id });
    if (log.type === LogTypes.REQUEST) {
      group.request = log.data as RequestLogEntry;
    } else if (log.type === LogTypes.RESPONSE) {
      group.response = log.data as ResponseLogEntry;
    } else if (log.type === LogTypes.ERROR) {
      group.error = log.data as RequestLogEntry;
    }
  }
  // accordion is only expanded to the initial child count. However the accordion element does not currently resize when children are added to the body, so we have to add this hack for now
  // TODO use Mutation Observer in the accordion library to detect when children are added and resize the body https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
  [...document.querySelectorAll('accordion-element.open')].forEach((el) => {
    console.log('toggling');
    el.collapse();
    setTimeout(() => el.expand(), 10);
  });
});

export { logs };
