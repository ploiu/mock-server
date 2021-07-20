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

run-server-for-browser-tests:
	del config-test.json
	deno run --allow-read --allow-write ./src/ts/GenerateHtml.ts --test
	deno run ${FLAGS} ./src/ts/MockServer.ts --load-ui --config ./config-test.json
