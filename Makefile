FLAGS = --allow-read --allow-write --allow-net --unstable

format:
	Deno fmt --ext ts
	Deno fmt --ext js

test:
	Deno test

run:
	Deno run ${FLAGS} ./src/ts/MockServer.ts

compile:
	Deno compile ${FLAGS} ./src/ts/MockServer.ts -o=./build/MockServer.exe
	
install:
	Deno install ${FLAGS} ./src/ts/MockServer.ts