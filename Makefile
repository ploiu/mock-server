FLAGS = --allow-read --allow-write --allow-net --unstable

format:
	deno fmt --ext ts
	deno fmt --ext js

test:
	deno test

run:
	deno run ${FLAGS} ./src/ts/MockServer.ts

compile:
	deno compile ${FLAGS} ./src/ts/MockServer.ts -o=./build/MockServer.exe
	
install:
	deno install ${FLAGS} ./src/ts/MockServer.ts