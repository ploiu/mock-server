import { createRunnableDevEnvironment } from 'vite';

export enum TokenTypes {
  /** `/` */
  PATH_SEPERATOR = 'PATH_SEPERATOR',
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

/** where in the url we are */
enum Section {
  PATH = 'PATH',
  QUERY = 'QUERY',
}

export type Token = {
  type: TokenTypes;
  value: string;
};

type Context = [Token | null, string, string | null];

/** turns the url into a list of tokens */
function tokenize(url: string): Token[] {
  let previous: Token | null = null
  let next: string | null = // TODO first check url length before trying to index stuff
  return [];
}

/**
 * given the passed context, parses and returns the middle character as a `Token`
 * @param context the context surrounding and including the token being parsed.
 *  Index `1` of this object is the token under question. `0` or `2` may be null,
 *  and if they are, it's because the surrounding characters don't exist
 *  (either the token is at the beginning or end of the url)
 */
function parseToken(
  context: Context,
): Token {
  // it would be awkward in the code to look at previous or next first, so we should _first_ check current
  switch (context[1].toLowerCase()) {
    case '/':
      return handlePathSeparator(context);
    case '=':
      return handleEqualsSign(context);
    case '?':
      return handleQuerionMark(context);
    case '&':
      return handleAmpersand(context);
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
): Token {
  return {
    type: TokenTypes.PATH_SEPERATOR,
    value: current,
  };
}

function handleEqualsSign(
  [previous, current]: Context,
): Token {
  if (previous === null || previous.type !== TokenTypes.QUERY_CHARACTER) {
    return {
      type: TokenTypes.UNKNOWN,
      value: current,
    };
  } else {
    return { type: TokenTypes.QUERY_EQUALS, value: current };
  }
}

function handleColon(
  [previous, current]: Context,
): Token {
  if (previous?.type === TokenTypes.PATH_SEPERATOR) {
    return { type: TokenTypes.PATH_VARIABLE_IDENTIFIER, value: current };
  } else if (previous?.type === TokenTypes.QUERY_SEPARATOR) {
    return { type: TokenTypes.QUERY_VARIABLE_IDENTIFIER, value: current };
  } else {
    return {
      type: TokenTypes.UNKNOWN,
      value: current,
    };
  }
}

function handleAmpersand(
  [previous, current]: Context,
): Token {
  // & is pretty easy to parse, since it can only occur already in a query string. `?x=` and `?x` are semantically the same at this stage
  const allowedPreviousTypes = [
    TokenTypes.QUERY_VALUE,
    TokenTypes.QUERY_EQUALS,
    TokenTypes.QUERY_CHARACTER,
  ];
  if (previous === null || !allowedPreviousTypes.includes(previous.type)) {
    return { type: TokenTypes.UNKNOWN, value: current };
  } else {
    return { type: TokenTypes.QUERY_SEPARATOR, value: current };
  }
}

function handleQuerionMark(
  [previous, current, next]: Context,
): Token {
  if (previous?.type === TokenTypes.UNKNOWN) {
    return { type: TokenTypes.UNKNOWN, value: current };
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
    if (next === null || next.match(/[?&=]/)) {
      // previous is not null so we know it's real
      return {
        type: TokenTypes.VARIABLE_OPTIONALITY_INDICATOR,
        value: current,
      };
    } else if (next !== null && (next.match(/[a-z0-9:]/i))) {
      return {
        type: TokenTypes.QUERY_SEPARATOR,
        value: current,
      };
    } else if (
      previous === null || previous.type === TokenTypes.PATH_SEPERATOR ||
      previous.type === TokenTypes.QUERY_EQUALS
    ) {
      return {
        type: TokenTypes.QUERY_CHARACTER,
        value: current,
      };
    } else {
      return {
        type: TokenTypes.UNKNOWN,
        value: current,
      };
    }
  }
}

function handleSplat([previous, current]: Context): Token {
  const allowedPrevious = [
    TokenTypes.PATH_VARIABLE_IDENTIFIER,
    TokenTypes.QUERY_VARIABLE_IDENTIFIER,
  ];
  if (!allowedPrevious.includes(previous?.type ?? TokenTypes.UNKNOWN)) {
    return { type: TokenTypes.UNKNOWN, value: current };
  } else {
    return { type: TokenTypes.SPLAT, value: current };
  }
}

function handleRegular([previous, current]: Context): Token {
  const pathNameTypes = [
    TokenTypes.PATH_SEPERATOR,
    TokenTypes.PATH_CHARACTER,
    TokenTypes.PATH_VARIABLE_IDENTIFIER,
  ];
  const queryNameTypes = [
    TokenTypes.QUERY_CHARACTER,
    TokenTypes.QUERY_SEPARATOR,
    TokenTypes.QUERY_VARIABLE_IDENTIFIER,
  ];
  const queryValTypes = [TokenTypes.QUERY_EQUALS, TokenTypes.QUERY_VALUE];
  if (previous === null || pathNameTypes.includes(previous.type)) {
    return { type: TokenTypes.PATH_CHARACTER, value: current };
  } else if (queryNameTypes.includes(previous.type)) {
    return { type: TokenTypes.QUERY_CHARACTER, value: current };
  } else if (queryValTypes.includes(previous.type)) {
    return { type: TokenTypes.QUERY_VALUE, value: current };
  } else {
    return { type: TokenTypes.UNKNOWN, value: current };
  }
}
