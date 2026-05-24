import { Token, TokenTypes } from './UrlTokenizer.ts';

/** represents a part of the path portion of our url */
type BasePathPart = {
  /** the value of the path. If `isVariable`, then this is _not_ what literally needs to be matched. Otherwise, it is a literal */
  value: string;
  /** the position in the path this part takes */
  order: number;
};

type PathPart =
  & BasePathPart
  & (
    | {
      isVariable: false;
    }
    | {
      isVariable: true;
      isOptional: boolean;
    }
    | {
      isVariable: true;
      /** means this is a `:*` path part and needs special handling */
      isGlob: true;
    }
  );

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

export class UrlMatcher {
  #tokens: Token[];
  /** represents how specific the route is. If a request matches multiple routes, the one with the highest specificity is picked to handle the request */
  #specificity: number;
  /** ordered path parts, with order based on internal `order` value in `BasePathPart` */
  #pathParts: PathPart[];
  #queryParts: QueryPart[];

  constructor(tokens: Token[]) {
    this.#tokens = tokens;
    this.#pathParts = this.#getPathParts(tokens);
    this.#queryParts = this.#getQueryParts(tokens);
    this.#specificity = this.#scoreSpecificity(tokens);
  }

  public matches(url: string): boolean {
    throw new Error('unimplemented');
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

  #getPathParts(tokens: Token[]): PathPart[] {
    const lastPathSepIndex = tokens.findLastIndex(({ type }) =>
      type === TokenTypes.PATH_SEPARATOR
    );
    if (lastPathSepIndex === -1 || lastPathSepIndex === 0) {
      // no path, only queries
      return [];
    } else {
      const rawTypes = tokens.slice(0, lastPathSepIndex).filter(({ type }) =>
        type !== TokenTypes.PATH_SEPARATOR
      );
      const pathParts: PathPart[] = [];
      for (let i = 0; i < rawTypes.length; i++) {
        const { type, value } = rawTypes[i];
        switch (type) {
          case TokenTypes.PATH_TEXT:
            pathParts.push({ value, order: i, isVariable: false });
            break;
          case TokenTypes.PATH_VARIABLE:
            pathParts.push({
              value: value.substring(1),
              order: i,
              isVariable: true,
              isOptional: false,
            });
            break;
          case TokenTypes.OPTIONAL_PATH_VARIABLE:
            pathParts.push({
              value: value.substring(1, value.length - 1),
              order: i,
              isVariable: true,
              isOptional: true,
            });
            break;
          case TokenTypes.PATH_GLOB:
            pathParts.push({
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
      return pathParts;
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
