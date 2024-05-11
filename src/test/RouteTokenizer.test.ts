import { assertEquals, assertObjectMatch } from '@std/assert';
import { RouteToken, RouteTokenType } from '../ts/models.ts';
import { tokenize } from '../ts/request/RouteTokenizer.ts';

Deno.test('Test that tokenize can handle a regular path', () => {
  const url = '/test/test2';
  const expected: RouteToken[] = [{
    text: 'test',
    tokenType: RouteTokenType.NORMAL_PATH_PART,
  }, {
    text: 'test2',
    tokenType: RouteTokenType.NORMAL_PATH_PART,
  }];

  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle a regular query', () => {
  const url = '?test&test2';
  const expected: RouteToken[] = [
    {
      text: 'test',
      tokenType: RouteTokenType.NORMAL_QUERY_PART,
    },
    {
      text: 'test2',
      tokenType: RouteTokenType.NORMAL_QUERY_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle regular path and query', () => {
  const url = '/test?test2';
  const expected: RouteToken[] = [
    {
      text: 'test',
      tokenType: RouteTokenType.NORMAL_PATH_PART,
    },
    {
      text: 'test2',
      tokenType: RouteTokenType.NORMAL_QUERY_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle required path variables', () => {
  const url = '/:test/:test2';
  const expected: RouteToken[] = [
    {
      text: ':test',
      tokenType: RouteTokenType.REQUIRED_PATH_PARAM_PART,
    },
    {
      text: ':test2',
      tokenType: RouteTokenType.REQUIRED_PATH_PARAM_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle optional path variables', () => {
  const url = '/:test?/:test2';
  const expected: RouteToken[] = [
    {
      text: ':test?',
      tokenType: RouteTokenType.OPTIONAL_PATH_PARAM_PART,
    },
    {
      text: ':test2',
      tokenType: RouteTokenType.REQUIRED_PATH_PARAM_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle required query variables', () => {
  const url = '?:test&:test2';
  const expected: RouteToken[] = [
    {
      text: ':test',
      tokenType: RouteTokenType.REQUIRED_QUERY_PARAM_PART,
    },
    {
      text: ':test2',
      tokenType: RouteTokenType.REQUIRED_QUERY_PARAM_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle optional query variables', () => {
  const url = '?:test?&:test2?';
  const expected: RouteToken[] = [
    {
      text: ':test?',
      tokenType: RouteTokenType.OPTIONAL_QUERY_PARAM_PART,
    },
    {
      text: ':test2?',
      tokenType: RouteTokenType.OPTIONAL_QUERY_PARAM_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle glob query variables (?:*)', () => {
  const url = '?:*';
  const expected: RouteToken[] = [
    {
      text: ':*',
      tokenType: RouteTokenType.QUERY_GLOB_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});

Deno.test('Test that tokenize can handle everything all at once', () => {
  const url = '/test/:a/test2/:b??:c&d&:e?';
  const expected: RouteToken[] = [
    {
      text: 'test',
      tokenType: RouteTokenType.NORMAL_PATH_PART,
    },
    {
      text: ':a',
      tokenType: RouteTokenType.REQUIRED_PATH_PARAM_PART,
    },
    {
      text: 'test2',
      tokenType: RouteTokenType.NORMAL_PATH_PART,
    },
    {
      text: ':b?',
      tokenType: RouteTokenType.OPTIONAL_PATH_PARAM_PART,
    },
    {
      text: ':c',
      tokenType: RouteTokenType.REQUIRED_QUERY_PARAM_PART,
    },
    {
      text: 'd',
      tokenType: RouteTokenType.NORMAL_QUERY_PART,
    },
    {
      text: ':e?',
      tokenType: RouteTokenType.OPTIONAL_QUERY_PARAM_PART,
    },
  ];
  const actual = tokenize(url);
  assertEquals(actual.length, expected.length);
  for (let i = 0; i < expected.length; i++) {
    const expectedInstance = expected[i];
    const actualInstance = actual[i];
    assertObjectMatch(actualInstance, expectedInstance);
  }
});
