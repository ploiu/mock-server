FLAGS = --allow-read --allow-write --allow-net --unstable

format:
	deno fmt --ext ts
	deno fmt --ext js

test:
	deno test

run:
	deno run --allow-read --allow-write ./src/ts/GenerateHtml.ts
	deno run ${FLAGS} ./src/ts/MockServer.ts --load-ui

compile:
	deno run --allow-read --allow-write ./src/ts/GenerateHtml.ts
	deno compile ${FLAGS} --lite ./src/ts/MockServer.ts
	
install:
	deno run --allow-read --allow-write ./src/ts/GenerateHtml.ts
	deno install ${FLAGS} --force ./src/ts/MockServer.ts

generate-ui:
	deno run --allow-read --allow-write ./src/ts/GenerateHtml.ts

setup-puppeteer:
	deno run -A --unstable https://deno.land/x/puppeteer@9.0.1/install.ts

run-server-for-browser-tests:
	deno run --allow-read --allow-write ./src/ts/GenerateHtml.ts
	deno run ${FLAGS} ./src/ts/MockServer.ts --load-ui --config ./config-test.json

browser-tests:
	deno test -A --unstable ./src/test/uiTests.js
