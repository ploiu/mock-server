import { tokenize } from './UrlTokenizer.ts';
import { lex } from './UrlLexer.ts';
import { UrlMatcher } from './UrlMatcher.ts';

export { UrlMatcher } from './UrlMatcher.ts';
export { type Lexeme, LexemeTypes } from './UrlLexer.ts';
export { type Token, TokenTypes } from './UrlTokenizer.ts';

export function parseUrl(url: string): UrlMatcher {
  return new UrlMatcher(tokenize(lex(url), url));
}
