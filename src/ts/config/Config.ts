import { ConfigRouteV3 } from './ConfigRoutes.ts';
import Route from '../request/Route.ts';

export default class Config {
  public configVersion = '';
  // matches the format of /request/Route.ts, but do not reference since it's just a raw object and does not have methods
  public routes: Array<ConfigRouteV3 | Route> = [];
}
