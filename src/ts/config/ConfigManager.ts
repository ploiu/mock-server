// allow typescript syntax checkers to know that Deno does in fact exist
import {
  ensureFileSync,
  existsSync,
} from "https://deno.land/std@0.91.0/fs/mod.ts";
import Config from "./Config.ts";

const CONFIG_FILE_LOCATION = "./config.json";

/**
 * reads and parses our config file, creating it if it does not exist
 * @returns {Config}
 * @constructor
 */
export function readConfigFile(): Config {
  if (!existsSync(CONFIG_FILE_LOCATION)) {
    setupConfigFile();
  }
  // read the config file
  const text = Deno.readTextFileSync(CONFIG_FILE_LOCATION);
  return <Config> (JSON.parse(text));
}

/**
 * sets up our config file for the cases where it does not exist. It creates default, empty entries except for where a value is needed
 */
function setupConfigFile() {
  // make sure we have a config file
  ensureFileSync(CONFIG_FILE_LOCATION);
  // create default config object
  const config = new Config();
  config.configVersion = "1.0";
  const textContents = JSON.stringify(config, null, 2);
  // write to the file and close it
  const bytesWritten = Deno.writeTextFileSync(
    CONFIG_FILE_LOCATION,
    textContents,
  );
  // TODO error if nothing was written?
}
