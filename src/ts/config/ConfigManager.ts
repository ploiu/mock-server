//deno-lint-ignore-file no-explicit-any

import { ensureFileSync } from '../deps.ts';
import Config from './Config.ts';
import { RouteTypes } from '../request/RouteTypes.ts';
import { RequestMethod } from '../request/RequestMethod.ts';
import { ConfigRouteV2 } from './ConfigRoutes.ts';
import RouteFactory from '../request/RouteFactory.ts';

const CONFIG_FILE_LOCATION = './config.json';
const configVersion = 3.0;

/**
 * reads and parses our config file, creating it if it does not exist
 * @returns {Config}
 * @constructor
 */
export function readConfigFile(
  location: string = CONFIG_FILE_LOCATION,
): Config {
  try {
    Deno.readTextFileSync(location);
  } catch (e) {
    if (e.message.includes('No such file or directory')) {
      setupConfigFile(location);
    } else {
      // we don't know what this is, so tell the user
      throw e;
    }
  }
  // read the config file
  const text = Deno.readTextFileSync(location);
  let parsed = JSON.parse(text);
  if (parseFloat(parsed.configVersion) < configVersion) {
    parsed = convertConfigToLatest(parsed, location);
  }
  return <Config> parsed;
}

/**
 * goes through each version and increments the config version while transforming it to match the version being converted to.
 *
 * each specific conversion method skips over if the config isn't at the version it converts from
 * @param parsed
 * @param location
 */
function convertConfigToLatest(
  parsed: any,
  location = CONFIG_FILE_LOCATION,
): any {
  let converted: Config;
  converted = convertV1ToV2(parsed);
  converted = convertV2ToV3(converted);
  // write back to the config file
  writeConfigFile(converted, location);
  return converted;
}

/**
 * converts a v1 config to a v2 config
 * @param parsed
 */
function convertV1ToV2(parsed: Config): Config {
  if (parsed.configVersion === '1.0') {
    parsed.configVersion = '2.0';
    parsed.routes.forEach((route: ConfigRouteV2) => route.isEnabled = true);
  }
  return parsed;
}

function convertV2ToV3(parsed: Config): Config {
  console.log('converting to v3...');
  if (parsed.configVersion === '2.0') {
    parsed.configVersion = '3.0';
    parsed.routes.forEach((route) => {
      route.routeType = RouteTypes.DEFAULT;
    });
  }
  return parsed;
}

/**
 * sets up our config file for the cases where it does not exist. It creates default, empty entries except for where a value is needed
 */
function setupConfigFile(location: string = CONFIG_FILE_LOCATION) {
  // make sure we have a config file
  ensureFileSync(location);
  // create default config object
  const config = new Config();
  config.configVersion = '3.0';
  // create an example route to show what can be done
  const route = RouteFactory.create({
    title: 'Example Route',
    url: '/HelloWorld/:name?:age',
    method: RequestMethod.GET,
    responseHeaders: {},
    response: 'Hello, {{name}}! You are {{age}} years old',
    responseStatus: 200,
    isEnabled: true,
    routeType: RouteTypes.DEFAULT,
  });
  config.routes.push(route);
  const textContents = JSON.stringify(config, null, 2);
  // write to the file and close it
  Deno.writeTextFileSync(
    location,
    textContents,
  );
}

export function writeConfigFile(
  config: Config,
  location: string = CONFIG_FILE_LOCATION,
) {
  const textContents = JSON.stringify(config, null, 2);
  ensureFileSync(location);
  Deno.writeTextFileSync(location, textContents);
}
