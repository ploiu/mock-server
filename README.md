# mock-server

A simple mock server written in Typescript and using [Deno](https://deno.land)

## Why
Several other applications, namely [Soap UI](https://www.soapui.org/) and [Postman](https://www.postman.com/) have mock servers built in. However SoapUI's interface is clunky and hard to setup. Postman has a nice and simple UI, but mock server support is limited on a free plan. 
Because of this, I decided to write my own simple mock server for my own use cases. 

## Objective
This is a personal project for personal needs, so this most likely won't cover any advance functionality.
For what I personally need, it should:
- have unlimited uses without limit
- be simple to set up and use
- have a simple UI, if one is created
- be portable; mocks should be easily transferrable across machines
- support path and query variables
