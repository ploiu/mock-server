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
	assert(route.hasPathVariable("name", false), 'route has name as mandatory variable');
	assert(route.hasPathVariable("age", true), 'route has age as optional variable');
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
	assert(route.hasQueryVariable("name", false), 'route has name as mandatory variable');
	assert(route.hasQueryVariable("age", true), 'route has age as optional variable');
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
	assert(route.doesUrlMatch("/test"), 'url should match /test');
	// make sure other routes starting with /test don't match
	assertNotEquals(route.doesUrlMatch("/test/a/b/c"), true, 'url should not match /test/a/b/c');
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
	assert(route.doesUrlMatch("/test/a/b/c"), 'url should match /test/a/b/c');
	// ensure other routes that don't match aren't counted
	assertNotEquals(route.doesUrlMatch("/test"), true, 'url should not match /test');
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
	assert(route.doesUrlMatch("/test/ploiu/23"), 'url should match with both variables filled in');
	assertNotEquals(route.doesUrlMatch("/test/ploiu"), true, 'url should not match without missing variables');
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
	assert(route.doesUrlMatch("/test/ploiu/23"), 'url should match with all variables');
	assert(route.doesUrlMatch("/test/23"), 'url should match with one variable');
	assertNotEquals(route.doesUrlMatch('/test'), true, 'url should not match without any variables')
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
	assert(route.doesUrlMatch('/test?name=ploiu&age=23'), 'url should match with both variables')
	assertNotEquals(route.doesUrlMatch('/test?name=ploiu'), true, 'url should not match without all variables')
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
	assert(route.doesUrlMatch('/test?name=ploiu&age=23'), 'url should match with all variables')
	assert(route.doesUrlMatch('/test?age=23'), 'url should match with one variable')
})
