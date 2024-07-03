import {
  assert,
  assertEquals,
  assertFalse,
  assertObjectMatch,
} from '@std/assert';
import {
  parseBackendHeaders,
  parseFrontendHeaders,
  validateHeaderInput,
} from '../ui/models/UIHeader.ts';

Deno.test('Test that parseBackendHeaders properly converts values', () => {
  // taken from https://developer.mozilla.org/en-US/docs/Glossary/Response_header
  const input = {
    'Access-Control-Allow-Origin': '*',
    'Connection': 'Keep-Alive',
    'Content-Encoding': 'gzip',
    'Content-Type': 'text/html; charset=utf-8',
    'Date': 'Mon, 18 Jul 2016 16:06:00 GMT',
    'Etag': '"c561c68d0ba92bbeb8b0f612a9199f722e3a621a"',
    'Keep-Alive': 'timeout=5, max=997',
    'Last-Modified': 'Mon, 18 Jul 2016 02:36:04 GMT',
    'Server': 'Apache',
    'Set-Cookie':
      'mykey=myvalue; expires=Mon, 17-Jul-2017 16:06:00 GMT; Max-Age=31449600; Path=/; secure',
    'Transfer-Encoding': 'chunked',
    'Vary': 'Cookie, Accept-Encoding',
    'X-Backend-Server': 'developer2.webapp.scl3.mozilla.com',
    'X-Cache-Info': 'not cacheable; meta data too large',
    'X-kuma-revision': '1085259',
    'x-frame-options': 'DENY',
  };
  const expected = `Access-Control-Allow-Origin: *
Connection: Keep-Alive
Content-Encoding: gzip
Content-Type: text/html; charset=utf-8
Date: Mon, 18 Jul 2016 16:06:00 GMT
Etag: "c561c68d0ba92bbeb8b0f612a9199f722e3a621a"
Keep-Alive: timeout=5, max=997
Last-Modified: Mon, 18 Jul 2016 02:36:04 GMT
Server: Apache
Set-Cookie: mykey=myvalue; expires=Mon, 17-Jul-2017 16:06:00 GMT; Max-Age=31449600; Path=/; secure
Transfer-Encoding: chunked
Vary: Cookie, Accept-Encoding
X-Backend-Server: developer2.webapp.scl3.mozilla.com
X-Cache-Info: not cacheable; meta data too large
X-kuma-revision: 1085259
x-frame-options: DENY`;
  const actual = parseBackendHeaders(input);
  assertEquals(actual, expected);
});

Deno.test('Test that validateHeaderInput accepts valid header values', () => {
  const input = `Access-Control-Allow-Origin: *
Connection: Keep-Alive
Content-Encoding: gzip
Content-Type: text/html; charset=utf-8
Date: Mon, 18 Jul 2016 16:06:00 GMT
Etag: "c561c68d0ba92bbeb8b0f612a9199f722e3a621a"
Keep-Alive: timeout=5, max=997
Last-Modified: Mon, 18 Jul 2016 02:36:04 GMT
Server: Apache
Set-Cookie: mykey=myvalue; expires=Mon, 17-Jul-2017 16:06:00 GMT; Max-Age=31449600; Path=/; secure
Transfer-Encoding: chunked
Vary: Cookie, Accept-Encoding
X-Backend-Server: developer2.webapp.scl3.mozilla.com
X-Cache-Info: not cacheable; meta data too large
X-kuma-revision: 1085259
x-frame-options: DENY`;
  assert(validateHeaderInput(input));
});

Deno.test('Test that validateHeaderInput does not accept input if there is no key/pair ', () => {
  assertFalse(validateHeaderInput('a: '));
  assertFalse(validateHeaderInput(': v'));
  assertFalse(validateHeaderInput(' : '));
  assertFalse(validateHeaderInput(': '));
});

Deno.test('Test that validateHeaderInput accepts empty string', () => {
  assert(validateHeaderInput(''));
});

Deno.test('Test that parseFrontendHeaders properly parses headers', () => {
  const input = `Access-Control-Allow-Origin: *
Connection: Keep-Alive
Content-Encoding: gzip
Content-Type: text/html; charset=utf-8
Date: Mon, 18 Jul 2016 16:06:00 GMT
Etag: "c561c68d0ba92bbeb8b0f612a9199f722e3a621a"
Keep-Alive: timeout=5, max=997
Last-Modified: Mon, 18 Jul 2016 02:36:04 GMT
Server: Apache
Set-Cookie: mykey=myvalue; expires=Mon, 17-Jul-2017 16:06:00 GMT; Max-Age=31449600; Path=/; secure
Transfer-Encoding: chunked
Vary: Cookie, Accept-Encoding
X-Backend-Server: developer2.webapp.scl3.mozilla.com
X-Cache-Info: not cacheable; meta data too large
X-kuma-revision: 1085259
x-frame-options: DENY`;
  const expected = {
    'Access-Control-Allow-Origin': '*',
    'Connection': 'Keep-Alive',
    'Content-Encoding': 'gzip',
    'Content-Type': 'text/html; charset=utf-8',
    'Date': 'Mon, 18 Jul 2016 16:06:00 GMT',
    'Etag': '"c561c68d0ba92bbeb8b0f612a9199f722e3a621a"',
    'Keep-Alive': 'timeout=5, max=997',
    'Last-Modified': 'Mon, 18 Jul 2016 02:36:04 GMT',
    'Server': 'Apache',
    'Set-Cookie':
      'mykey=myvalue; expires=Mon, 17-Jul-2017 16:06:00 GMT; Max-Age=31449600; Path=/; secure',
    'Transfer-Encoding': 'chunked',
    'Vary': 'Cookie, Accept-Encoding',
    'X-Backend-Server': 'developer2.webapp.scl3.mozilla.com',
    'X-Cache-Info': 'not cacheable; meta data too large',
    'X-kuma-revision': '1085259',
    'x-frame-options': 'DENY',
  };
  assertObjectMatch(parseFrontendHeaders(input), expected);
});

Deno.test('Test that parseFrontendHeaders returns empty object if headers string is empty', () => {
  assertObjectMatch(parseFrontendHeaders(''), {});
});
