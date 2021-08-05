// allow typescript syntax checkers to know that Deno does in fact exist
import {
  ensureFileSync,
  existsSync,
} from "https://deno.land/std@0.103.0/fs/mod.ts";
import Config from "./Config.ts";
import Route from "../request/Route.ts";

const CONFIG_FILE_LOCATION = "./config.json";

/**
 * reads and parses our config file, creating it if it does not exist
 * @returns {Config}
 * @constructor
 */
export function readConfigFile(
  location: string = CONFIG_FILE_LOCATION,
): Config {
  if (!existsSync(location)) {
    setupConfigFile(location);
  }
  // read the config file
  const text = Deno.readTextFileSync(location);
  return <Config> (JSON.parse(text));
}

/**
 * sets up our config file for the cases where it does not exist. It creates default, empty entries except for where a value is needed
 */
function setupConfigFile(location: string = CONFIG_FILE_LOCATION) {
  // make sure we have a config file
  ensureFileSync(location);
  // create default config object
  const config = new Config();
  config.configVersion = "1.0";
  // create an example route to show what can be done
  const route = Route.fromObject({
    title: "Example Route",
    url: "/HelloWorld/:name?:age",
    method: "GET",
    responseHeaders: {},
    response: "Hello, {{name}}! You are {{age}} years old",
    responseStatus: 200,
  });
  config.routes.push(route);
  const textContents = JSON.stringify(config, null, 2);
  // write to the file and close it
  const bytesWritten = Deno.writeTextFileSync(
    location,
    textContents,
  );
  // TODO error if nothing was written?
}

export function writeConfigFile(
  location: string = CONFIG_FILE_LOCATION,
  config: Config,
) {
  const textContents = JSON.stringify(config, null, 2);
  ensureFileSync(location);
  Deno.writeTextFileSync(location, textContents);
}
