export default class Config {
  public configVersion: string = "";
  // matches the format of /request/Route.ts, but do not reference since it's just a raw object and does not have methods
  public routes: any[] = [];
}
