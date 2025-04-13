import { onUnmounted } from 'vue';
import { type LogEntry } from '../../ts/model/LogModels.ts';
import { store } from '../store.ts';

const url = 'VITE_BASE_URL' in import.meta.env
  ? import.meta.env.VITE_BASE_URL
  : '';

export function initSSE(): void {
  const source = new EventSource(url + '/mock-server-logs');
  source.addEventListener('log', (e) => {
    const parsed: LogEntry = JSON.parse(e.data);
    store.logs.push(parsed);
  });
  manageHeartbeat(source);
  globalThis.addEventListener('beforeunload', () => source.close());
  onUnmounted(() => source.close());
}

function manageHeartbeat(source: EventSource) {
  // used to tell how long ago the last heartbeat was
  let beatTimer = 0;
  // maintain heartbeat
  const beatInterval = setInterval(() => {
    beatTimer += 100;
    if (source.readyState !== EventSource.CLOSED && beatTimer > 1_200) {
      console.log('heartbeat died, attempting to reconnect...');
      // heartbeat stopped, attempt to reconnect
      globalThis.clearInterval(beatInterval);
      source.close();
      initSSE();
    }
  }, 100);
  source.addEventListener('heartbeat', () => {
    beatTimer = 0;
  });
}
