FLAGS = --allow-read --allow-write --allow-net --unstable

format:
	deno fmt --ext ts
	deno fmt --ext js

test:
	deno test

run:
	deno run ${FLAGS} ./src/ts/MockServer.ts

compile:
	deno compile ${FLAGS} --lite ./src/ts/MockServer.ts
	
install:
	deno install ${FLAGS} ./src/ts/MockServer.ts

generate:
	deno run --allow-read --allow-write ./src/ts/GenerateHtml.ts
