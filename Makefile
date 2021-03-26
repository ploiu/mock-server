FLAGS = --allow-read --allow-write --allow-net --unstable

format:
	Deno fmt --ext ts
	Deno fmt --ext js

test:
	Deno test

run:
	Deno run ${FLAGS} ./src/ts/MockServer.ts
