# mock-server

A simple mock server written in Typescript and using [Deno](https://deno.land)

## Why

Several other applications, namely [Soap UI](https://www.soapui.org/) and
[Postman](https://www.postman.com/) have mock servers built in. However, SoapUI's
interface is clunky and hard to set up. Postman has a nice and simple UI, but
mock server support is limited on a free plan. Because of this, I decided to
write my own simple mock server for my own use cases.

## Objective

This is a personal project for personal needs, so this most likely won't cover
any advance functionality. For what I personally need, it should:

- have unlimited uses
- be simple to set up and use
- have a simple UI
- be portable; mocks should be easily transferable across machines
- support path and query variables

## Building
`deno task install`

## Testing
`deno task test` for uni tests, `deno task ui-tests` for UI tests. Be sure for UI tests to navigate to the url provided in console output

## Mocks
When run, a `config.json` file will be created with an example route, if a `config.json` file does not exist in _your current directory_ (you can also specify a config file with the --config flag). The config file should list all your mock routes. An example route would look like this:
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

As you can tell from above, path and query variable names start with a `:` character, and to make it optional simply end its name with `?`. To reference these variables in the response body, wrap their name in `{{Curly Braces}}`. To use a default variable value in case of an optional variable not passed in, follow it up with a colon and the default value like this: `{{optionalVarName:defaultValue}}`
