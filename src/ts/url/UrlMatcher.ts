import { Token, TokenTypes } from './UrlTokenizer.ts';

/** represents a part of the path portion of our url */
type BasePathPart = {
  /** the value of the path. If `isVariable`, then this is _not_ what literally needs to be matched. Otherwise, it is a literal */
  value: string;
  /** the position in the path this part takes */
  order: number;
  /**
   * used during matching process to keep track of which parts have been matched against already.
   * a part can't be "claimed" multiple times in this way
   */
  matchClaimed: boolean;
};

type ExactPathPart = BasePathPart & { isVariable: false };
type RequiredVariablePathPart = BasePathPart & {
  isVariable: true;
  isOptional: false;
};
type OptionalVariablePathPart = BasePathPart & {
  isVariable: true;
  isOptional: true;
};
type GlobPathPart = BasePathPart & { isVariable: true; isGlob: true };

type PathPart =
  | ExactPathPart
  | RequiredVariablePathPart
  | OptionalVariablePathPart
  | GlobPathPart;

type BaseQueryPart = {
  /** the name of the query param */
  name: string;
};

type QueryPart =
  & BaseQueryPart
  & (
    | {
      /** what value is required to be passed in order for
       * it to be considered a positive match. if `null`, any value is allowed */
      requiredValue: string | null;
    }
    | {
      isVariable: true;
      isOptional: boolean;
    }
    | {
      isVariable: true;
      isGlob: true;
    }
  );

/** an indexed object grouping the path into different parts for eash of use.
 *
 * each array is sorted according to the internal `order` value of the path part
 */
type IndexedPathPart = {
  parts: PathPart[];
  exactParts: ExactPathPart[];
  requiredVariables: RequiredVariablePathPart[];
  optionalVariables: OptionalVariablePathPart[];
  globs: GlobPathPart[];
  length: number;
  hasExactParts: boolean;
  hasRequiredVars: boolean;
  hasOptionalVars: boolean;
  hasGlobs: boolean;
};

export class UrlMatcher {
  #tokens: Token[];
  /** represents how specific the route is. If a request matches multiple routes, the one with the highest specificity is picked to handle the request */
  #specificity: number;
  /** ordered path parts, with order based on internal `order` value in `BasePathPart` */
  #pathParts: IndexedPathPart;
  /** query params from the template passed to this object's constructor */
  #queryParts: QueryPart[];

  constructor(tokens: Token[]) {
    this.#tokens = tokens;
    this.#pathParts = this.#getPathParts(tokens);
    this.#queryParts = this.#getQueryParts(tokens);
    this.#specificity = this.#scoreSpecificity(tokens);
  }

  public matches(url: string): boolean {
    // if we normalize the url, we can use the URL and URLSearchParams apis
    const normalized = 'http://localhost:0000/' + url.replace(/^\//, '');
    const builtUrl = URL.parse(normalized);
    if (builtUrl === null) {
      console.error(
        `Failed to build url from normalized string: ${normalized}`,
      );
      return false;
    }
    const { pathname, search } = builtUrl;
    // TODO be sure to use getAll with urlSearchParams in case multiple of the same query param are specified in the template
    return this.checkPathMatches(pathname) && this.checkQueryMatches(search);
  }

  private checkPathMatches(path: string): boolean {
    const splitPath = path.split('/').filter((it) => it.trim() !== '');
    // if the path lengths don't match and the template doesn't have any optional vars or globs, it won't match
    const { length, hasOptionalVars, hasGlobs } = this.#pathParts;
    if (splitPath.length !== length && !hasOptionalVars && !hasGlobs) {
      return false;
    }

    /*
        This is a bit tough, since we can have weird patterns like `/:*`, `/something`, `/:*`, `/somethingElse`.
        how do we know how much each `/:*` consumes?

        Order of operations (EVOG):
        - Exact matches, left to right
        - required Variables, left to right,
        - Optional variables, left to right,
        - Globs, left to right

        INFO EXAMPLES:
        - `/:*\/whatever/:*\/:required/:optional?/whatever2/:*`, `/asdfasdfasdf/09893298932/whatever/literallyAnything/stupid/whatever2/madeYouLook`
          - E: `whatever` and `whatever2` are matched literally
          - V: `:required` is after `whatever` _and_ a glob, but globs aren't greedy until everything else is taken, so `/:required` => `literallyAnything`
          - O: `:optional?` is immediately after `:required`, so `:optional?` => `stupid`. if `/stupid` wasn't in the path, `:optional?` => nothing
          - G: There are 3 globs.
            - Glob 1 => `/asdfasdfasdf/09893298932`
            - Glob 2 => nothing (taken by `:required`)
            - Glob 3 => after `whatever2`, so => `madeYouLook`
      */

    return true && this.checkExactSegments(splitPath) &&
      this.checkRequiredVariableSegments(splitPath);
  }

  private checkQueryMatches(search: string): boolean {
    const searchParams = new URLSearchParams(search);
    return true;
  }

  /** returns true if all exact path segments are matched */
  private checkExactSegments(splitPath: string[]): boolean {
    const { exactParts } = this.#pathParts;
    for (const part of exactParts) {
      const { order, value, matchClaimed } = part;
      const passedEquivalent = splitPath[order];
      if (
        value !== passedEquivalent || value === passedEquivalent && matchClaimed
      ) {
        return false;
      } else if (value === passedEquivalent && !matchClaimed) {
        part.matchClaimed = true;
      }
    }
    return true;
  }

  /** returns true if all exact path variables are matched */
  private checkRequiredVariableSegments(splitPath: string[]): boolean {
    const { requiredVariables } = this.#pathParts;
    for (const part of requiredVariables) {
      const { order, matchClaimed } = part;
      const passedEquivalent = splitPath[order];
      console.debug('template: ', part, '; split: ', passedEquivalent);
      if (passedEquivalent === undefined || matchClaimed) {
        return false;
      } else if (!matchClaimed) {
        part.matchClaimed = true;
      }
    }
    return true;
  }

  get pathParts() {
    return this.#pathParts;
  }

  get queryparts() {
    return this.#queryParts;
  }

  get specificity() {
    return this.#specificity;
  }

  /**
   * creates an indexed lookup object for all the path parts of the token array
   */
  #getPathParts(tokens: Token[]): IndexedPathPart {
    const PATH_TOKEN_TYPES = [
      TokenTypes.PATH_TEXT,
      TokenTypes.PATH_VARIABLE,
      TokenTypes.OPTIONAL_PATH_VARIABLE,
      TokenTypes.PATH_GLOB,
    ];
    // this is just used to see if there _is_ a path part
    const hasPathTokens = tokens.findIndex(({ type }) =>
      PATH_TOKEN_TYPES.includes(type)
    );
    if (hasPathTokens === -1 || hasPathTokens === 0) {
      // no path, only queries
      return {
        parts: [],
        exactParts: [],
        requiredVariables: [],
        optionalVariables: [],
        globs: [],
        length: 0,
        hasExactParts: false,
        hasRequiredVars: false,
        hasOptionalVars: false,
        hasGlobs: false,
      };
    } else {
      // need to rely on first query sep in dex so that we get the last path variable
      let firstQuerySepIndex = tokens.findIndex(({ type }) =>
        type === TokenTypes.QUERY_SEPARATOR
      );
      if (firstQuerySepIndex === -1) {
        firstQuerySepIndex = tokens.length + 1;
      }
      const rawTypes = tokens.slice(0, firstQuerySepIndex).filter((
        { type },
      ) => type !== TokenTypes.PATH_SEPARATOR);
      const exactParts: ExactPathPart[] = [];
      const requiredVariables: RequiredVariablePathPart[] = [];
      const optionalVariables: OptionalVariablePathPart[] = [];
      const globs: GlobPathPart[] = [];
      let hasExactParts = false;
      let hasRequiredVars = false;
      let hasOptionalVars = false;
      let hasGlobs = false;
      for (let i = 0; i < rawTypes.length; i++) {
        const { type, value } = rawTypes[i];
        switch (type) {
          case TokenTypes.PATH_TEXT:
            hasExactParts = true;
            exactParts.push({
              value,
              order: i,
              isVariable: false,
              matchClaimed: false,
            });
            break;
          case TokenTypes.PATH_VARIABLE:
            hasRequiredVars = true;
            requiredVariables.push({
              value: value.substring(1),
              order: i,
              isVariable: true,
              isOptional: false,
              matchClaimed: false,
            });
            break;
          case TokenTypes.OPTIONAL_PATH_VARIABLE:
            hasOptionalVars = true;
            optionalVariables.push({
              value: value.substring(1, value.length - 1),
              order: i,
              isVariable: true,
              isOptional: true,
              matchClaimed: false,
            });
            break;
          case TokenTypes.PATH_GLOB:
            hasGlobs = true;
            globs.push({
              value,
              order: i,
              isGlob: true,
              isVariable: true,
              matchClaimed: false,
            });
            break;
          default:
            throw new Error(
              `Invalid token type ${type} for path part ${value}`,
            );
        }
      }
      const parts = [
        ...exactParts,
        ...requiredVariables,
        ...optionalVariables,
        ...globs,
      ].filter((it) => it !== undefined).sort((a, b) => a.order - b.order);
      return {
        parts,
        exactParts,
        requiredVariables,
        optionalVariables,
        globs,
        length: parts.length,
        hasExactParts,
        hasRequiredVars,
        hasOptionalVars,
        hasGlobs,
      };
    }
  }

  #getQueryParts(tokens: Token[]): QueryPart[] {
    const firstQueryIndex = tokens.findIndex(({ type }) =>
      type === TokenTypes.QUERY_SEPARATOR
    );
    // if no query params, nothing to do
    if (firstQueryIndex === -1) {
      return [];
    } else {
      const queryTokens = tokens.slice(firstQueryIndex).filter(({ type }) =>
        type !== TokenTypes.QUERY_SEPARATOR
      );
      const queryParts: QueryPart[] = [];
      for (const { type, value } of queryTokens) {
        switch (type) {
          case TokenTypes.QUERY_TEXT:
            {
              const [name, requiredValue] = value.split('=');
              queryParts.push({
                name,
                requiredValue: requiredValue ?? null,
              });
            }
            break;
          case TokenTypes.QUERY_VARIABLE:
            queryParts.push({
              name: value.substring(1),
              isVariable: true,
              isOptional: false,
            });
            break;
          case TokenTypes.OPTIONAL_QUERY_VARIABLE:
            queryParts.push({
              name: value.substring(1, value.length - 1),
              isVariable: true,
              isOptional: true,
            });
            break;
          case TokenTypes.QUERY_GLOB:
            queryParts.push({
              name: value,
              isVariable: true,
              isGlob: true,
            });
            break;
          default:
            throw new Error(`invalid type ${type} for query param ${value}`);
        }
      }
      return queryParts;
    }
  }

  /**
   * in order to rank routes in the event multiple are matched, we need a way to break the tie.
   * Determining route specificity is how I've chosen to do this, using a point-based system.
   * - regular path segments get +3 points
   * - required path variable segments get +2 points
   * - optional path variable segments get +1 points
   * - catch all path segment (/:*) get +0 points
   * - regular query params get +3 points
   * - required query params get +2 points
   * - optional query params get +1 points
   * - catch all query param (?:*) get +0 points
   */
  #scoreSpecificity(tokens: Token[]): number {
    const scoreMapping: Record<string, number> = {
      [TokenTypes.PATH_TEXT]: 3,
      [TokenTypes.QUERY_TEXT]: 3,
      [TokenTypes.PATH_VARIABLE]: 2,
      [TokenTypes.QUERY_VARIABLE]: 2,
      [TokenTypes.OPTIONAL_PATH_VARIABLE]: 1,
      [TokenTypes.OPTIONAL_QUERY_VARIABLE]: 1,
      // these 2 aren't _necessary_ but it helps to make it clear
      [TokenTypes.PATH_GLOB]: 0,
      [TokenTypes.QUERY_GLOB]: 0,
    } as const;
    let score = 0;
    for (const { type } of tokens) {
      score += scoreMapping[type] ?? 0;
    }
    return score;
  }

  toJSON() {
    return {
      tokens: this.#tokens,
      specificity: this.#specificity,
      pathParts: this.#pathParts,
      queryParts: this.#queryParts,
    };
  }
}
