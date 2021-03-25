import { serve } from "https://deno.land/std@0.91.0/http/mod.ts";
import { parse } from "https://deno.land/std@0.91.0/flags/mod.ts";
import Config from "./config/Config.ts";
import { readConfigFile } from "./config/ConfigManager.ts";

const helpText = `
	USAGE: MockServer [flags]
	
	flags:
	--port, -p		The port number to run the mock server on. Defaults to 8000
	`;

// different functionality if run from command line
if (import.meta.main) {
  const { args } = Deno;
  const parsedArgs = parse(args);
  const port: number = parsedArgs.port ?? parsedArgs.p ?? 8000;
  startMockServer(port);
}

/**
 * Starts the mock server and starts listening for requests
 * @param {number} port
 */
export async function startMockServer(port: number = 8000) {
  const config: Config = readConfigFile();
  const server = serve({ port: port });
  console.log(`Listening on port ${port}`);
  for await (let request of server) {
    console.log(request);
  }
}
