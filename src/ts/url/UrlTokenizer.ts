import { lex, type Lexeme, LexemeTypes } from './UrlLexer.ts';

export enum TokenTypes {
  // path stuff
  /** `/` */
  PATH_SEPARATOR = 'PATH_SEPARATOR',
  /** `test` */
  PATH_TEXT = 'PATH_TEXT',
  /** `:test` */
  PATH_VARIABLE = 'PATH_VARIABLE',
  /** `:test?` */
  OPTIONAL_PATH_VARIABLE = 'OPTIONAL_PATH_VARIABLE',
  /** `:*` */
  PATH_GLOB = 'PATH_GLOB',
  // query stuff
  QUERY_SEPARATOR = 'QUERY_SEPARATOR',
  /**
   * entire query fragment.
   * examples:
   * - test=5
   * - test
   * - test=
   */
  QUERY_TEXT = 'QUERY_TEXT',
  /** :test */
  QUERY_VARIABLE = 'QUERY_VARIABLE',
  /** :test? */
  OPTIONAL_QUERY_VARIABLE = 'OPTIONAL_QUERY_VARIABLE',
  /** :* */
  QUERY_GLOB = 'QUERY_GLOB',
  /** a token comprised of an invalid combination of `Lexeme`s */
  UNKNOWN = 'UNKNOWN',
}

type Lexemes = keyof typeof LexemeTypes;

/**
 * mapping that defines, given an input lexeme as the start of a token,
 * the lexeme type that would belong to a different token.
 *
 * if it's not in here, it doesn't get to decide when the token terminates
 */
const lexemeTerminators: { [K in Lexemes]?: Lexemes[] } = {
  PATH_SEPARATOR: [
    'PATH_CHARACTER',
    'PATH_VARIABLE_IDENTIFIER',
    'QUERY_SEPARATOR',
  ],
  PATH_CHARACTER: [
    'QUERY_SEPARATOR',
    'PATH_SEPARATOR',
  ],
  PATH_VARIABLE_IDENTIFIER: ['PATH_SEPARATOR', 'QUERY_SEPARATOR'],
  QUERY_SEPARATOR: [
    'QUERY_CHARACTER',
    'QUERY_VARIABLE_IDENTIFIER',
  ],
  QUERY_CHARACTER: ['QUERY_SEPARATOR'],
  QUERY_VARIABLE_IDENTIFIER: ['QUERY_SEPARATOR'],
};

export type Token = {
  type: TokenTypes;
  value: string;
};

export function tokenize(url: string): Token[] {
  const lexemes = lex(url);
  const isInvalid = lexemes.some((it) => it.type === LexemeTypes.UNKNOWN);
  if (isInvalid) {
    // TODO this might be too course. Thinking of scenarios where frontend syntax highlighting relies on this
    // ? maybe use lexemes for highlighting instead? That will allow both rejecting malformed url template _and_ provide syntax highlighting
    return [{
      type: TokenTypes.UNKNOWN,
      value: url,
    }];
  } else {
    const tokens: Token[] = [];
    while (lexemes.length > 0) {
      const parsed = parseToken(lexemes);
      if (parsed === null) {
        break;
      }
      const [token, newStart] = parsed;
      lexemes.splice(0, Math.max(1, newStart));
      tokens.push(token);
    }
    return tokens;
  }
}

/**
 * parses a token from the passed Lexeme array, starting at index 0
 *
 * The return value is a tuple of both the parsed Token, _and_ where the next token
 * should start being parsed from (the "new" 0 index for the next token parse)
 *
 * if `null` is returned, that means there was nothing in the passed lexemes to parse
 */
function parseToken(lexemes: Lexeme[]): [Token, number] | null {
  if (lexemes.length === 0) {
    return null;
  }

  const lexemeType = lexemes[0]?.type ?? null;
  if (!(lexemeType in lexemeTerminators)) {
    throw new Error(`Invalid starter lexeme type ${lexemeType}`);
  } else {
    const terminators = lexemeTerminators[lexemeType]!;
    let firstTerminator = lexemes.findIndex(({ type }) =>
      terminators.includes(type)
    );
    if (firstTerminator === -1) {
      firstTerminator = lexemes.length;
    }
    const tokenLexemes = lexemes.slice(0, firstTerminator);
    const tokenType = determineTokenTypeFromLexemes(tokenLexemes);
    const token: Token = {
      type: tokenType,
      value: tokenLexemes.map((it) => it.value).join(''),
    };
    return [token, firstTerminator];
  }
}

/**
 * given a logical grouping of lexemes guaranteed to belong to a single token, determines what type of token
 * those lexemes comprise.
 *
 * E.g. given lexemes of these characters:
 * `:test?` (with `:` being LexemeTypes.PATH_VARIABLE_IDENTIFIER)
 * this function would return TokenTypes.OPTIONAL_PATH_VARIABLE
 */
function determineTokenTypeFromLexemes(lexemes: Lexeme[]): TokenTypes {
  if (lexemes.length === 0) {
    return TokenTypes.UNKNOWN;
  } else if (lexemes.length === 1) {
    return determineSingleLexemeType(lexemes[0]);
  } else {
    // multiple lexemes, so we can use the beginning and end chars to determine what we are
    const PATH_STARTERS = [
      LexemeTypes.PATH_CHARACTER,
      LexemeTypes.PATH_VARIABLE_IDENTIFIER,
    ];
    const QUERY_STARTERS = [
      LexemeTypes.QUERY_CHARACTER,
      LexemeTypes.QUERY_VARIABLE_IDENTIFIER,
    ];
    const first = lexemes[0];
    if (PATH_STARTERS.includes(first.type)) {
      return handlePathIshTokenType(lexemes);
    } else if (QUERY_STARTERS.includes(first.type)) {
      return handleQueryIshToken(lexemes);
    } else {
      console.error('Unknown starter lexeme: ' + JSON.stringify(first));
      return TokenTypes.UNKNOWN;
    }
  }
}

function handlePathIshTokenType(lexemes: Lexeme[]): TokenTypes {
  if (
    lexemes.length === 2 &&
    lexemes[0].type === LexemeTypes.PATH_VARIABLE_IDENTIFIER &&
    lexemes[1].type === LexemeTypes.SPLAT
  ) {
    return TokenTypes.PATH_GLOB;
  }
  const { type: first } = lexemes[0];
  const { type: last } = lexemes.at(-1)!;
  const isVariable = first === LexemeTypes.PATH_VARIABLE_IDENTIFIER;
  if (isVariable && last === LexemeTypes.VARIABLE_OPTIONALITY_INDICATOR) {
    return TokenTypes.OPTIONAL_PATH_VARIABLE;
  } else if (isVariable) {
    return TokenTypes.PATH_VARIABLE;
  } else {
    return TokenTypes.PATH_TEXT;
  }
}

function handleQueryIshToken(lexemes: Lexeme[]): TokenTypes {
  if (
    lexemes.length === 2 &&
    lexemes[0].type === LexemeTypes.QUERY_VARIABLE_IDENTIFIER &&
    lexemes[1].type === LexemeTypes.SPLAT
  ) {
    return TokenTypes.QUERY_GLOB;
  }
  const { type: first } = lexemes[0];
  const { type: last } = lexemes.at(-1)!;
  const isVariable = first === LexemeTypes.QUERY_VARIABLE_IDENTIFIER;
  if (isVariable && last === LexemeTypes.VARIABLE_OPTIONALITY_INDICATOR) {
    return TokenTypes.OPTIONAL_QUERY_VARIABLE;
  } else if (isVariable) {
    return TokenTypes.QUERY_VARIABLE;
  } else {
    return TokenTypes.QUERY_TEXT;
  }
}

function determineSingleLexemeType({ type }: Lexeme): TokenTypes {
  let tokenType: TokenTypes = TokenTypes.UNKNOWN;
  if (type === LexemeTypes.PATH_SEPARATOR) {
    tokenType = TokenTypes.PATH_SEPARATOR;
  } else if (type === LexemeTypes.QUERY_SEPARATOR) {
    tokenType = TokenTypes.QUERY_SEPARATOR;
  }
  return tokenType;
}
