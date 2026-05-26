export enum LexemeTypes {
  /** `/` */
  PATH_SEPARATOR = 'PATH_SEPARATOR',
  /** any character in a path that's not a variable identifier or a variable optionality indicator */
  PATH_CHARACTER = 'PATH_CHARACTER',
  /** `:` immediately followed by a PATH_SEPARATOR */
  PATH_VARIABLE_IDENTIFIER = 'PATH_VARIABLE_IDENTIFIER',
  /** `?` or `&` when followed by `QUERY_CHARACTER` */
  QUERY_SEPARATOR = 'QUERY_SEPARATOR',
  /** any character in a query that's not `?`, `&`, or `=` */
  QUERY_CHARACTER = 'QUERY_CHARACTER',
  /** `=` when inside a query */
  QUERY_EQUALS = 'QUERY_EQUALS',
  /** any value after a  `QUERY_EQUALS`*/
  QUERY_VALUE = 'QUERY_VALUE',
  /** : used immediately after a query separator */
  QUERY_VARIABLE_IDENTIFIER = 'QUERY_VARIABLE_IDENTIFIER',
  /** `?` used immediately after a `PATH_CHARACTER` or `QUERY_CHARACTER` that is not followed up by more characters (in which case this would be a query indicator)*/
  VARIABLE_OPTIONALITY_INDICATOR = 'VARIABLE_OPTIONALITY_INDICATOR',
  /** we have no idea what this is */
  UNKNOWN = 'UNKNOWN',
  /** `*`, which is only valid after a `VARIABLE_IDENTIFIER` */
  SPLAT = 'SPLAT',
}

export type Lexeme = {
  type: LexemeTypes;
  value: string;
};

type Context = [Lexeme | null, string, string | null];

/** turns the url into a list of lexemes */
export function lex(url: string): Lexeme[] {
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  if (url.length === 0 || url === '/') {
    return [{ type: LexemeTypes.PATH_SEPARATOR, value: '/' }];
  }
  const lexs: Lexeme[] = [];
  let previous: Lexeme | null = null;

  for (let i = 0; i < url.length; i++) {
    const current = url[i];
    const next = url[i + 1] ?? null;
    previous = parseLexeme([previous, current, next]);
    lexs.push(previous);
  }

  return lexs;
}

/**
 * given the passed context, parses and returns the middle character as a `Lexeme`
 * @param context the context surrounding and including the lex being parsed.
 *  Index `1` of this object is the lex under question. `0` or `2` may be null,
 *  and if they are, it's because the surrounding characters don't exist
 *  (either the lex is at the beginning or end of the url)
 */
function parseLexeme(
  context: Context,
): Lexeme {
  // it would be awkward in the code to look at previous or next first, so we should _first_ check current
  switch (context[1].toLowerCase()) {
    case '/':
      return handlePathSeparator(context);
    case '=':
      return handleEqualsSign(context);
    case '?':
    case '&':
      return handleQuestionMarkOrAmpersand(context);
    case ':':
      return handleColon(context);
    case '*':
      return handleSplat(context);
    default:
      return handleRegular(context);
  }
}

function handlePathSeparator(
  [_, current]: Context,
): Lexeme {
  return {
    type: LexemeTypes.PATH_SEPARATOR,
    value: current,
  };
}

function handleEqualsSign(
  [previous, current]: Context,
): Lexeme {
  if (previous === null || previous.type !== LexemeTypes.QUERY_CHARACTER) {
    return {
      type: LexemeTypes.UNKNOWN,
      value: current,
    };
  } else {
    return { type: LexemeTypes.QUERY_EQUALS, value: current };
  }
}

function handleColon(
  [previous, current]: Context,
): Lexeme {
  if (previous?.type === LexemeTypes.PATH_SEPARATOR) {
    return { type: LexemeTypes.PATH_VARIABLE_IDENTIFIER, value: current };
  } else if (previous?.type === LexemeTypes.QUERY_SEPARATOR) {
    return { type: LexemeTypes.QUERY_VARIABLE_IDENTIFIER, value: current };
  } else {
    return {
      type: LexemeTypes.UNKNOWN,
      value: current,
    };
  }
}

function handleQuestionMarkOrAmpersand(
  [previous, current, next]: Context,
): Lexeme {
  if (previous?.type === LexemeTypes.UNKNOWN) {
    return { type: LexemeTypes.UNKNOWN, value: current };
  } else {
    // previous isn't null. There are a few things we need to watch out for:
    // 1. /?a -> query since there's nothing before it       (x)
    // 2. a?(?|&|=) -> optional arg                          (x)
    // 3. a?a -> query since text is after it                (x)
    // 4. a?: -> query since variable identifier is after it (x)
    // 5. =?a -> query since after equal sign                (x)
    // 6. a? -> optional arg since nothing after it          (x)
    //
    // there are way more cases where what comes after matters more, so check those first
    if (next === null || next.match(/[?&/]/)) {
      // previous is not null so we know it's real
      return {
        type: LexemeTypes.VARIABLE_OPTIONALITY_INDICATOR,
        value: current,
      };
    } else if (next !== null && (next.match(/[a-z0-9:]/i))) {
      return {
        type: LexemeTypes.QUERY_SEPARATOR,
        value: current,
      };
    } else if (
      previous === null || previous.type === LexemeTypes.PATH_SEPARATOR ||
      previous.type === LexemeTypes.QUERY_EQUALS
    ) {
      return {
        type: LexemeTypes.QUERY_CHARACTER,
        value: current,
      };
    } else {
      return {
        type: LexemeTypes.UNKNOWN,
        value: current,
      };
    }
  }
}

function handleSplat([previous, current]: Context): Lexeme {
  const allowedPrevious = [
    LexemeTypes.PATH_VARIABLE_IDENTIFIER,
    LexemeTypes.QUERY_VARIABLE_IDENTIFIER,
  ];
  if (!allowedPrevious.includes(previous?.type ?? LexemeTypes.UNKNOWN)) {
    return { type: LexemeTypes.UNKNOWN, value: current };
  } else {
    return { type: LexemeTypes.SPLAT, value: current };
  }
}

function handleRegular([previous, current]: Context): Lexeme {
  const pathNameTypes = [
    LexemeTypes.PATH_SEPARATOR,
    LexemeTypes.PATH_CHARACTER,
    LexemeTypes.PATH_VARIABLE_IDENTIFIER,
  ];
  const queryNameTypes = [
    LexemeTypes.QUERY_CHARACTER,
    LexemeTypes.QUERY_SEPARATOR,
    LexemeTypes.QUERY_VARIABLE_IDENTIFIER,
  ];
  const queryValTypes = [LexemeTypes.QUERY_EQUALS, LexemeTypes.QUERY_VALUE];
  if (previous === null || pathNameTypes.includes(previous.type)) {
    return { type: LexemeTypes.PATH_CHARACTER, value: current };
  } else if (queryNameTypes.includes(previous.type)) {
    return { type: LexemeTypes.QUERY_CHARACTER, value: current };
  } else if (queryValTypes.includes(previous.type)) {
    return { type: LexemeTypes.QUERY_VALUE, value: current };
  } else {
    return { type: LexemeTypes.UNKNOWN, value: current };
  }
}
