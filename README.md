# mock-server

A simple mock server written in Vue + Typescript + [Deno](https://deno.land)

## Why

Several other applications, namely [Soap UI](https://www.soapui.org/) and
[Postman](https://www.postman.com/) have mock servers built in. However, SoapUI's
interface is clunky and hard to set up. Postman has a nice and simple UI, but
mock server support is limited on a free plan. Because of this, I decided to
write my own simple mock server for my own use cases.

## Getting Started
### Requirements
- [Deno](https://deno.land)

### Steps
1. make sure the deno bin folder is in your system path (this is where this app gets installed):

linux/mac:
```sh
export PATH="$PATH:$HOME/.deno/bin"
```
windows (pwsh):
```pwsh
setx PATH "$($env:PATH);$HOME\.deno\bin"
```
2. install dependencies and run the development server
```sh
deno install
deno task dev
```

## Installation
> [!NOTE]
> make sure you follow the steps under [Getting Started](#getting-started)

```sh
deno task install
```
This will install the app at `$HOME/.deno/bin` with the name `MockServer`

## Usage
```sh
# create a folder to store the config and ui files
mkdir mockServer && cd mockServer
MockServer
```

`MockServer -h` has more details and options

## Misc
updating mocks via the web ui will automatically update the server, but manually replacing the `config.json` file _requires_ you to restart the server manually to pick up the changes
