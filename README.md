# mock-server

A simple mock server written in Typescript and using [Deno](https://deno.land)

## Why

Several other applications, namely [Soap UI](https://www.soapui.org/) and
[Postman](https://www.postman.com/) have mock servers built in. However SoapUI's
interface is clunky and hard to setup. Postman has a nice and simple UI, but
mock server support is limited on a free plan. Because of this, I decided to
write my own simple mock server for my own use cases.

## Objective

This is a personal project for personal needs, so this most likely won't cover
any advance functionality. For what I personally need, it should:

- have unlimited uses
- be simple to set up and use
- have a simple UI, if one is created
- be portable; mocks should be easily transferrable across machines
- support path and query variables

## Building
The simplest way to build an executable is to run `make compile`, but if you want to build it yourself, you can run `deno compile --allow-read --allow-write --allow-net --unstable --lite ./src/ts/MockServer.ts`

If you don't want to compile it as an executable, you can "install" it by running `make install`, or `deno install --allow-read --allow-write --allow-net --unstable ./src/ts/MockServer.ts`

## Testing
Since deno comes builtin with a testing engine, you can simply run `deno test`, though `make test` will work as well

## Mocks
When run, a `config.json` file will be created with an example route if a `config.json` file does not exist in _your current directory_ (you can also specify a config file with the --config flag). The config file should list all your mock routes. An example route would look like this:
```json
{
  "title": "Example",
  "url": "/test/:optionalPathVar?/:requiredPathVar?:requiredQueryVar&:optionalQueryVar?",
  "method": "POST",
  "responseHeaders": {
    "Content-Type": "text/plain"
   },
   "response": "hello {{optionalPathVar}}!",
   "responseStatus": 200
}
```
    
