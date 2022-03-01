FLAGS = --allow-read --allow-write --allow-net --unstable

test:
	deno fmt
	deno test

run:
	deno fmt
	deno run --allow-read --allow-write ./src/ts/GenerateUICode.ts
	deno run ${FLAGS} ./src/ts/MockServer.ts --load-ui

compile:
	deno run --allow-read --allow-write ./src/ts/GenerateUICode.ts
	deno compile ${FLAGS} --lite ./src/ts/MockServer.ts
	
install:
	deno run --allow-read --allow-write ./src/ts/GenerateUICode.ts
	deno install ${FLAGS} --force ./src/ts/MockServer.ts

generate-ui:
	deno run --allow-read --allow-write ./src/ts/GenerateUICode.ts

run-server-for-browser-tests:
	rm -f config-test.json
	deno run --allow-read --allow-write ./src/ts/GenerateUICode.ts --test
	deno run ${FLAGS} ./src/ts/MockServer.ts --load-ui --config ./config-test.json

check:
	deno fmt
	deno lint
