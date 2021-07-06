import {assert, assertEquals, assertNotEquals,} from "https://deno.land/std@0.91.0/testing/asserts.ts";
import Route from "../ts/request/Route.ts";
import {ServerRequest} from "https://deno.land/std@0.91.0/http/mod.ts";

Deno.test("fromObject differentiates between response as object and response as string", () => {
    const routeStringResponse = Route.fromObject({
        title: "test",
        method: "GET",
        // adding a query variable after an optional variable to make sure that works
        url: "/test/:name/:age??:a",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });

    const routeObjectResponse = Route.fromObject({
        title: "test",
        method: "GET",
        // adding a query variable after an optional variable to make sure that works
        url: "/test/:name/:age??:a",
        responseHeaders: {},
        response: {value: "hi"},
        responseStatus: 200,
    });

    assertEquals(routeStringResponse.response, "hi")
    assertEquals(routeObjectResponse.response, `{"value":"hi"}`)
})

Deno.test("properly parses path variables", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        // adding a query variable after an optional variable to make sure that works
        url: "/test/:name/:age??:a",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.hasPathVariable("name", false),
        "route has name as mandatory variable",
    );
    assert(
        route.hasPathVariable("age", true),
        "route has age as optional variable",
    );
});

Deno.test("properly parses query variables", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        // adding a query variable after an optional variable to make sure that works
        url: "/test/?:name&:age?",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.hasQueryVariable("name", false),
        "route has name as mandatory variable",
    );
    assert(
        route.hasQueryVariable("age", true),
        "route has age as optional variable",
    );
});

Deno.test("doesUrlMatch matches simple url", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(route.doesUrlMatch("/test"), "url should match /test");
    // make sure other routes starting with /test don't match
    assertNotEquals(
        route.doesUrlMatch("/test/a/b/c"),
        true,
        "url should not match /test/a/b/c",
    );
});

Deno.test("doesUrlMatch matches urls with non-alphanumeric characters", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:email/:code",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(route.doesUrlMatch("/test/test@example.com/123456"), "url should match /test/test@example.com/123456");
});

Deno.test("doesUrlMatch matches simple url with multiple path sections", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/a/b/c",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(route.doesUrlMatch("/test/a/b/c"), "url should match /test/a/b/c");
    // ensure other routes that don't match aren't counted
    assertNotEquals(
        route.doesUrlMatch("/test"),
        true,
        "url should not match /test",
    );
});

Deno.test("doesUrlMatch matches url with path variables", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name/:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.doesUrlMatch("/test/ploiu/23"),
        "url should match with both variables filled in",
    );
    assertNotEquals(
        route.doesUrlMatch("/test/ploiu"),
        true,
        "url should not match without missing variables",
    );
});

Deno.test("doesUrlMatch matches url with optional path variables", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name?/:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.doesUrlMatch("/test/ploiu/23"),
        "url should match with all variables",
    );
    assert(route.doesUrlMatch("/test/23"), "url should match with one variable");
    assertNotEquals(
        route.doesUrlMatch("/test"),
        true,
        "url should not match without any variables",
    );
});

Deno.test("doesUrlMatch matches url with query variables", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test?:name&:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.doesUrlMatch("/test?name=ploiu&age=23"),
        "url should match with both variables",
    );
    assertNotEquals(
        route.doesUrlMatch("/test?name=ploiu"),
        true,
        "url should not match without all variables",
    );
});

Deno.test("doesUrlMatch ensures query variable names are included", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test?:name&:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assertNotEquals(
        route.doesUrlMatch("/test?abc=ploiu&efg=23"),
        true,
        "url should match with both variables",
    );
    assertNotEquals(
        route.doesUrlMatch("/test?name=ploiu"),
        true,
        "url should not match query variables not in our pattern",
    );
});

Deno.test("doesUrlMatch matches url with optional query variables", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test?:name?&:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.doesUrlMatch("/test?name=ploiu&age=23"),
        "url should match with all variables",
    );
    assert(
        route.doesUrlMatch("/test?age=23"),
        "url should match with one variable",
    );
});

Deno.test("doesUrlMatch matches url with mandatory and optional path and query parameters", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name/:age??:favoriteColor&:favoriteFood?",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.doesUrlMatch("/test/ploiu/23?favoriteColor=green&favoriteFood=pasta"),
        "url should match with all variables",
    );
    assert(
        route.doesUrlMatch("/test/ploiu?favoriteColor=green"),
        "url should match with only mandatory variables",
    );
});

Deno.test("doesUrlMatch matches url with mandatory and optional path and query parameters (mandatory path param followed by query param)", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name/:age?:favoriteColor&:favoriteFood?",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assert(
        route.doesUrlMatch("/test/ploiu/23?favoriteColor=green&favoriteFood=pasta"),
        "url should match with all variables",
    );
    assert(
        route.doesUrlMatch("/test/ploiu/23?favoriteColor=green"),
        "url should match with only mandatory variables",
    );
});

Deno.test("parseVariablesFromUrl should return an empty js object if there are no variables to parse", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/a/b/c",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });
    assertEquals(route.parseVariablesFromUrl("/test/a/b/c"), {});
});

Deno.test("parseVariablesFromUrl should return an object with path variables in it", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name/:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });

    assertEquals(route.parseVariablesFromUrl("/test/ploiu/23"), {
        name: "ploiu",
        age: "23",
    }, "path parameters should be included");
});

Deno.test("parseVariablesFromUrl should return an object with path variables in it for variables not directly sequential", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name/hi/:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });

    assertEquals(route.parseVariablesFromUrl("/test/ploiu/hi/23"), {
        name: "ploiu",
        age: "23",
    }, "path parameters should be included");
});

Deno.test("parseVariablesFromUrl should set non-included path variables as null", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name?/:age/:favoriteFood?",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });

    assertEquals(route.parseVariablesFromUrl("/test/ploiu/23"), {
        name: "ploiu",
        age: "23",
        favoriteFood: null,
    }, "path parameters should be included");
});

Deno.test("parseVariablesFromUrl should set non-included path variables for variables not directly sequential as null", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test/:name?/hi/:age/:favoriteFood?",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });

    assertEquals(route.parseVariablesFromUrl("/test/hi/23"), {
        name: null,
        age: "23",
        favoriteFood: null,
    }, "optional path variables not included should be set to null");
});

Deno.test("parseVariablesFromUrl should include query parameters", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test?:name&:age",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });

    assertEquals(route.parseVariablesFromUrl("/test?name=ploiu&age=23"), {
        name: "ploiu",
        age: "23",
    }, "query parameters should be included");
});

Deno.test("parseVariablesFromUrl should set non-included query variables as null", () => {
    const route = Route.fromObject({
        title: "test",
        method: "GET",
        url: "/test?:name?&:age&:favoriteFood?",
        responseHeaders: {},
        response: "hi",
        responseStatus: 200,
    });

    assertEquals(route.parseVariablesFromUrl("/test?age=23"), {
        name: null,
        age: "23",
        favoriteFood: null,
    }, "optional query variables not included should be set to null");
});

Deno.test("execute should template out the response body from url parameters", async () => {
    const route = Route.fromObject({
        title: "test",
        url: "/test/:name/:age/:favoriteColor?:favoriteFood",
        responseHeaders: {},
        response:
            `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor}} {{favoriteFood}}`,
        method: "GET",
        responseStatus: 200,
    });
    const res = await route.execute(
        <ServerRequest>{
            url: "/test/ploiu/23/green?favoriteFood=pasta",
            method: "GET",
        },
    );
    assertEquals(
        res.body,
        "Hello, ploiu! You are 23 years old and you probably like green pasta",
    );
});

Deno.test("execute should use default variables if an optional variable is not included", async () => {
    const route = Route.fromObject({
        title: "test",
        url: "/test/:name/:age/:favoriteColor?:favoriteFood",
        responseHeaders: {},
        response:
            `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor:green}} {{favoriteFood}}. My favorite color is {{favoriteColor:blue}}`,
        method: "GET",
        responseStatus: 200,
    });

    const res = await route.execute(
        <ServerRequest>{
            url: "/test/ploiu/23?favoriteFood=pasta",
            method: "GET",
        },
    );
    assertEquals(
        res.body,
        "Hello, ploiu! You are 23 years old and you probably like green pasta. My favorite color is blue",
        "default values should be used if the variable is not included",
    );
});

Deno.test("execute should fill in default variable fields if the variable is included", async () => {
    const route = Route.fromObject({
        title: "test",
        url: "/test/:name/:age?:favoriteColor?&:favoriteFood",
        responseHeaders: {},
        response:
            `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor:green}} {{favoriteFood}}. My favorite color is {{favoriteColor:blue}}`,
        method: "GET",
        responseStatus: 200,
    });

    const res = await route.execute(
        <ServerRequest>{
            url: "/test/ploiu/23?favoriteFood=pasta&favoriteColor=orange",
            method: "GET",
        },
    );
    assertEquals(
        res.body,
        "Hello, ploiu! You are 23 years old and you probably like orange pasta. My favorite color is orange",
        "default value templates should be filled if the variable is included",
    );
});

Deno.test("execute should set the proper response status code", async () => {
    const route = Route.fromObject({
        title: "test",
        url: "/test/:name/:age/:favoriteColor?:favoriteFood",
        responseHeaders: {},
        response:
            `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor}} {{favoriteFood}}`,
        method: "GET",
        responseStatus: 418,
    });
    const res = await route.execute(
        <ServerRequest>{
            url: "/test/ploiu/23/green?favoriteFood=pasta",
            method: "GET",
        },
    );
    assertEquals(res.status, 418, "Response status codes should match");
});

Deno.test("execute should set the proper response headers", async () => {
    const route = Route.fromObject({
        title: "test",
        url: "/test/:name/:age/:favoriteColor?:favoriteFood",
        responseHeaders: {
            "Content-Type": "text/plain",
        },
        response:
            `Hello, {{name}}! You are {{age}} years old and you probably like {{favoriteColor}} {{favoriteFood}}`,
        method: "GET",
        responseStatus: 418,
    });
    const res = await route.execute(
        <ServerRequest>{
            url: "/test/ploiu/23/green?favoriteFood=pasta",
            method: "GET",
        },
    );
    assertEquals(
        res.headers?.get("Content-Type"),
        "text/plain",
        "Response headers should match",
    );
});

Deno.test("execute should properly handle `null` for response body", async () => {
    const route = Route.fromObject({
        title: "test",
        url: "/test/",
        responseHeaders: {
            "Content-Type": "text/plain",
        },
        response: null,
        method: "GET",
        responseStatus: 418,
    });
    const res = await route.execute(
        <ServerRequest>{
            url: "/test/",
            method: "GET",
        },
    );
    assertEquals(res.body, null, "response body should be null");
});
