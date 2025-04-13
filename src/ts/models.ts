export enum RouteTokenType {
  /** a normal part of a path; e.g. /test */
  NORMAL_PATH_PART = 'NORMAL_PATH_PART',
  /** a normal query parameter; e.g. ?test or &test */
  NORMAL_QUERY_PART = 'NORMAL_QUERY_PART',
  /** a wildcard query parameter; e.g. ?:* */
  QUERY_GLOB_PART = 'QUERY_GLOB_PART',
  /** a wildcard path parameter; e.g. /:* */
  PATH_GLOB_PART = 'PATH_GLOB_PART',
  /** a required path param; e.g. /:test */
  REQUIRED_PATH_PARAM_PART = 'REQUIRED_PATH_PARAM_PART',
  /** an optional path param; e.g. /:test? */
  OPTIONAL_PATH_PARAM_PART = 'OPTIONAL_PATH_PARAM_PART',
  /** a required query param; e.g. ?:test or &:test */
  REQUIRED_QUERY_PARAM_PART = 'REQUIRED_QUERY_PARAM_PART',
  /** an optional query param; e.g. ?:test? or &:test? */
  OPTIONAL_QUERY_PARAM_PART = 'OPTIONAL_QUERY_PARAM_PART',
  /** any value that the tokenizer can't figure out */
  INVALID_PATH_PART = 'INVALID_PATH_PART',
  INVALID_QUERY_PART = 'INVALID_QUERY_PART',
}

export type RouteToken = {
  text: string;
  tokenType: RouteTokenType;
};
