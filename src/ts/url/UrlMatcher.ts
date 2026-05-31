import { Token, TokenTypes } from './UrlTokenizer.ts';
import type {
  ExactPathPart,
  GlobPathPart,
  IndexedPathPart,
  OptionalVariablePathPart,
  QueryPart,
  RequiredVariablePathPart,
} from './PathPart.ts';
import { toGex } from './PathPart.ts';

export class UrlMatcher {
  #tokens: Token[];
  /** represents how specific the route is. If a request matches multiple routes, the one with
   *  the highest specificity is picked to handle the request */
  #specificity: number;
  /** ordered path parts, with order based on internal `order` value in `BasePathPart` */
  #pathParts: IndexedPathPart;
  /** query params from the template passed to this object's constructor */
  #queryParts: QueryPart[];
  /** a regex used to match the path when testing / extracting path parts for variables.
   *  Using a regex for the path is much easier than manually checking, especially when multiple
   *  `\/*` can be involved */
  #pathGex: RegExp;

  constructor(tokens: Token[]) {
    this.#tokens = tokens;
    this.#pathParts = this.#getPathParts(tokens);
    this.#queryParts = this.#getQueryParts(tokens);
    this.#specificity = this.#scoreSpecificity(tokens);
    this.#pathGex = this.buildPathGex(this.#pathParts);
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
    return this.#pathGex.test(path);
  }

  /**
   * builds the regex used to match our path and retrieve path variables
   */
  private buildPathGex({ pathParts }: IndexedPathPart) {
    // used to clean up optional vars since they handle the path separator themselves
    // `/)?)/`
    const optVarPath = /\/\)\?\)\//g;
    // optional starting `/`
    const gexStart = '(^/?)';
    const gexParts = pathParts.map(toGex).join('/').replaceAll(
      optVarPath,
      '/)?)',
    );
    // optional ending `/`
    const gexEnd = '/?$';
    const gexString = gexStart + gexParts + gexEnd;
    return new RegExp(gexString, 'i');
  }

  private checkQueryMatches(search: string): boolean {
    const searchParams = new URLSearchParams(search);
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

  get pathGex() {
    return this.#pathGex;
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
        pathParts: [],
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
            });
            break;
          case TokenTypes.PATH_VARIABLE:
            hasRequiredVars = true;
            requiredVariables.push({
              value: value.substring(1),
              order: i,
              isVariable: true,
              isOptional: false,
            });
            break;
          case TokenTypes.OPTIONAL_PATH_VARIABLE:
            hasOptionalVars = true;
            optionalVariables.push({
              value: value.substring(1, value.length - 1),
              order: i,
              isVariable: true,
              isOptional: true,
            });
            break;
          case TokenTypes.PATH_GLOB:
            hasGlobs = true;
            globs.push({
              value,
              order: i,
              isGlob: true,
              isVariable: true,
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
        pathParts: parts,
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
      pathGex: this.#pathGex.toString(),
    };
  }
}
