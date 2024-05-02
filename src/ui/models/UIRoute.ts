import { RequestMethod } from '../../ts/request/RequestMethod.ts';
import { RouteTypes } from '../../ts/request/RouteTypes.ts';

import { UIHeader } from './UIHeader.ts';

export interface UIRoute {
  title: string;
  url: string;
  method: RequestMethod;
  responseHeaders: UIHeader[];
  response: string | null;
  responseStatus: number;
  isEnabled: boolean;
  routeType: RouteTypes;
}
