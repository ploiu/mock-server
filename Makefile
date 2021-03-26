FLAGS = --allow-read --allow-write --allow-net --unstable

format:
	Deno fmt

test:
	Deno test

run:
	Deno run ${FLAGS} ./src/ts/MockServer.ts
