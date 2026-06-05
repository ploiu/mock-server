import { Token, TokenTypes } from './UrlTokenizer.ts';

export type BaseQueryPart = {
  /** the name of the query param */
  name: string;
};

/** non-variable query parameter, with or without a value */
type QueryValuePart = BaseQueryPart & {
  /** what value is required to be passed in order for
   * it to be considered a positive match. if `null`, any value is allowed */
  requiredValue: string | null;
  isVariable: false;
};

/** variable required query paramter (`?:variableName`) */
type RequiredQueryVariablePart = BaseQueryPart & {
  isVariable: true;
  isOptional: false;
};

/** variable optional query parameter (`?:variableName?`) */
type OptionalQueryVariablePart = BaseQueryPart & {
  isVariable: true;
  isOptional: true;
};

/** catch-all query parameter, for 0-or-more matching of otherwise-unspecified variables (`?:*`) */
type GlobQueryVariablePart = BaseQueryPart & {
  isVariable: true;
  isGlob: true;
};

export type QueryPart =
  | QueryValuePart
  | RequiredQueryVariablePart
  | OptionalQueryVariablePart
  | GlobQueryVariablePart;

export type IndexedQueryPart = {
  exactParams: QueryValuePart[];
  requiredParams: RequiredQueryVariablePart[];
  optionalParams: OptionalQueryVariablePart[];
  allParams: QueryPart[];
  /**
   * multiple glob query params is meaningless, since 1 glob query param will match all due to query params
   * being order-independent
   */
  hasGlob: boolean;
};

export function isOptionalParameter(
  part: QueryPart,
): part is OptionalQueryVariablePart {
  return part.isVariable && 'isOptional' in part && part.isOptional;
}

export function indexQueryPart(tokens: Token[]): IndexedQueryPart {
  const firstQueryIndex = tokens.findIndex(({ type }) =>
    type === TokenTypes.QUERY_SEPARATOR
  );
  // if no query params, nothing to do
  if (firstQueryIndex === -1) {
    return {
      exactParams: [],
      requiredParams: [],
      optionalParams: [],
      allParams: [],
      hasGlob: false,
    };
  } else {
    const queryTokens = tokens.slice(firstQueryIndex).filter(({ type }) =>
      type !== TokenTypes.QUERY_SEPARATOR
    );
    const exactParams: QueryValuePart[] = [];
    const requiredParams: RequiredQueryVariablePart[] = [];
    const optionalParams: OptionalQueryVariablePart[] = [];
    let hasGlob = false;
    for (const { type, value } of queryTokens) {
      switch (type) {
        case TokenTypes.QUERY_TEXT:
          {
            const [name, requiredValue] = value.split('=');
            exactParams.push({
              name,
              requiredValue: requiredValue ?? null,
              isVariable: false,
            });
          }
          break;
        case TokenTypes.QUERY_VARIABLE:
          requiredParams.push({
            name: value.substring(1),
            isVariable: true,
            isOptional: false,
          });
          break;
        case TokenTypes.OPTIONAL_QUERY_VARIABLE:
          optionalParams.push({
            name: value.substring(1, value.length - 1),
            isVariable: true,
            isOptional: true,
          });
          break;
        case TokenTypes.QUERY_GLOB:
          hasGlob = true;
          break;
        default:
          throw new Error(`invalid type ${type} for query param ${value}`);
      }
    }
    return {
      exactParams,
      requiredParams,
      optionalParams,
      allParams: [...exactParams, ...requiredParams, ...optionalParams],
      hasGlob,
    };
  }
}
