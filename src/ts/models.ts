export enum RouteTokenType {
  NORMAL_PATH_PART,
  NORMAL_QUERY_PART,
  REQUIRED_PATH_PARAM_PART,
  OPTIONAL_PATH_PARAM_PART,
  REQUIRED_QUERY_PARAM_PART,
  OPTIONAL_QUERY_PARAM_PART,
}

export type RouteToken = {
  text: string;
  tokenType: RouteTokenType;
};

export function tokenizeRoute(_url: string): RouteToken[] {
  return [];
}
