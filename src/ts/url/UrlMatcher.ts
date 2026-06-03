import { Token, TokenTypes } from './UrlTokenizer.ts';
import type { IndexedPathPart } from './PathPart.ts';
import { indexPath, toGex } from './PathPart.ts';
import { IndexedQueryPart, indexQueryPart } from './QueryPart.ts';

export class UrlMatcher {
  #tokens: Token[];
  /** represents how specific the route is. If a request matches multiple routes, the one with
   *  the highest specificity is picked to handle the request */
  #specificity: number;
  /** ordered path parts, with order based on internal `order` value in `BasePathPart` */
  #pathParts: IndexedPathPart;
  /** query params from the template passed to this object's constructor */
  #queryParts: IndexedQueryPart;
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

  private checkQueryMatches(search: string): boolean {
    const searchParams = new URLSearchParams(search);
    const { exactParams, requiredParams, allParams, hasGlob } =
      this.#queryParts;
    const validVariableNames = hasGlob
      ? [...searchParams.keys()]
      : allParams.map(({ name }) => name);
    for (const { name, requiredValue } of exactParams) {
      // required vars are interesting. They can be specified in both the template and the url multiple times
      // some in the template may have required values, while others don't
      if (requiredValue === null && !searchParams.has(name)) {
        return false;
      } else if (
        requiredValue !== null &&
        !searchParams.getAll(name).includes(requiredValue)
      ) {
        return false;
      }
    }
    for (const { name } of requiredParams) {
      // these are simpler. variable names can't be specified in a template multiple times, so 1 param = catch all
      if (!searchParams.has(name)) {
        return false;
      }
    }
    // now we must make sure no other variable names were passed, for stricter matching
    for (const name of searchParams.keys()) {
      if (!validVariableNames.includes(name)) {
        return false;
      }
    }
    return true;
  }

  /**
   * builds the regex used to match our path and retrieve path variables
   */
  private buildPathGex({ pathParts }: IndexedPathPart) {
    // optional starting `/`
    const gexStart = '(^/?)';
    const gexParts = pathParts.map(toGex).join('');
    // optional ending `/`
    const gexEnd = '/?$';
    // used to clean up optional vars since they handle the path separator themselves
    // `/)?)/` (leading and trailing `/` are not the same `/` used to denote a regex, these are path separators)
    // BUT we need to remove the _inner_ slash instead of the outer if it's the last path param
    const baseOptVarPathGex = '/\\)\\?\\)/';
    const nonLastOptVarPathGex = new RegExp(`${baseOptVarPathGex}(?!\\$)`, 'g');
    const lastOptVarPathGex = /\?\/\)\?\)\?\$/;
    const baseGexString = gexStart + gexParts + gexEnd;
    const gexStringFirstPass = baseGexString.replaceAll(
      nonLastOptVarPathGex,
      '/)?)',
    );
    const gexString = gexStringFirstPass.replace(lastOptVarPathGex, ')?)');
    return new RegExp(gexString, 'i');
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
    return indexPath(tokens);
  }

  #getQueryParts(tokens: Token[]): IndexedQueryPart {
    return indexQueryPart(tokens);
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
      pathGex: this.#pathGex.source,
    };
  }
}
