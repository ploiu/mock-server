import {
	assert,
	assertNotEquals,
	assertEquals
} from "https://deno.land/std@0.91.0/testing/asserts.ts";
import Route from "../ts/request/Route.ts";

Deno.test("properly parses path variables", () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		// adding a query variable after an optional variable to make sure that works
		url: "/test/:name/:age??:a",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.hasPathVariable("name", false));
	assert(route.hasPathVariable("age", true));
});

Deno.test("properly parses query variables", () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		// adding a query variable after an optional variable to make sure that works
		url: "/test/?:name&:age?",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.hasQueryVariable("name", false));
	assert(route.hasQueryVariable("age", true));
});

Deno.test("doesUrlMatch matches simple url", () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		url: "/test",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.doesUrlMatch("/test"));
	// make sure other routes starting with /test don't match
	assertNotEquals(route.doesUrlMatch("/test/a/b/c"), true);
});

Deno.test("doesUrlMatch matches simple url with multiple path sections", () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		url: "/test/a/b/c",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.doesUrlMatch("/test/a/b/c"));
	// ensure other routes that don't match aren't counted
	assertNotEquals(route.doesUrlMatch("/test"), true);
});

Deno.test("doesUrlMatch matches url with path variables", () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		url: "/test/:name/:age",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.doesUrlMatch("/test/ploiu/23"));
	assertNotEquals(route.doesUrlMatch("/test/ploiu"), true);
});

Deno.test("doesUrlMatch matches url with optional path variables", () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		url: "/test/:name?/:age",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.doesUrlMatch("/test/ploiu/23"));
	assert(route.doesUrlMatch("/test/23"));
	assertNotEquals(route.doesUrlMatch('/test'), true)
});

Deno.test('doesUrlMatch matches url with query variables', () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		url: "/test?:name&:age",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.doesUrlMatch('/test?name=ploiu&age=23'))
	assertNotEquals(route.doesUrlMatch('/test?name=ploiu'), true)
})
Deno.test('doesUrlMatch matches url with optional query variables', () => {
	const route = Route.fromObject({
		title: "test",
		method: "GET",
		url: "/test?:name?&:age",
		accept: "*",
		responseHeaders: {},
		response: "hi",
	});
	assert(route.doesUrlMatch('/test?name=ploiu&age=23'))
	assert(route.doesUrlMatch('/test?age=23'))
})
