import { RouteTokenType } from '../models.ts';
import { type RouteToken } from '../models.ts';

export function tokenize(url: string): RouteToken[] {
  const pathTokens = tokenizePaths(url);
  const queryTokens = tokenizeQueryParams(url);
  return [...pathTokens, ...queryTokens];
}

function tokenizePaths(url: string): RouteToken[] {
  const splitPaths = url.split('/');
  splitPaths[splitPaths.length - 1] = splitPaths[splitPaths.length - 1].replace(
    findQueryParams(url),
    '',
  );
  /* values need to be cleaned up (have query params removed) and filtered to not have any empty strings*/
  return splitPaths
    /* this regex keeps the trailing `?` for an optional path param, while removing the rest of the query params */
    .map((it) => it.replace(/(?<=\?)\?.*/, ''))
    .filter((it) => it && it.trim().length > 0)
    .map((param) => ({
      text: param,
      tokenType: determinePathParameterType(param),
    }));
}

function determinePathParameterType(param: string): RouteTokenType {
  if (param.startsWith(':') && param.endsWith('?')) {
    return RouteTokenType.OPTIONAL_PATH_PARAM_PART;
  } else if (param.startsWith(':')) {
    return RouteTokenType.REQUIRED_PATH_PARAM_PART;
  } else if (!param.endsWith('?')) {
    /* still ending with ? could indicate bad parsing */
    return RouteTokenType.NORMAL_PATH_PART;
  } else {
    return RouteTokenType.INVALID;
  }
}

function tokenizeQueryParams(url: string): RouteToken[] {
  const queryParams = findQueryParams(url);
  /* we can determine which parts are trailing `?` for optional params by checking to see if it's
  the end of the string _or_ if it's followed by a & */
  return queryParams.split(/[?&](?!$|&)/)
    .filter((param) => param.trim().length > 0)
    .map((param) => ({
      text: param,
      tokenType: determineQueryParameterType(param),
    }));
}

function determineQueryParameterType(param: string): RouteTokenType {
  if (param.startsWith(':*')) {
    return RouteTokenType.QUERY_GLOB_PART;
  } else if (param.startsWith(':') && param.endsWith('?')) {
    return RouteTokenType.OPTIONAL_QUERY_PARAM_PART;
  } else if (param.startsWith(':')) {
    return RouteTokenType.REQUIRED_QUERY_PARAM_PART;
  } else if (!param.endsWith('?')) {
    return RouteTokenType.NORMAL_QUERY_PART;
  } else {
    return RouteTokenType.INVALID;
  }
}

/**
 * finds and returns the part of the url that contains query parameters
 */
function findQueryParams(url: string): string {
  /* we need to figure out where the very first query param was. This can be done by splitting on path separators
   and grabbing the last one. This still will need to be cleaned */
  const splitPaths = url.split('/');
  const queryParamPart = splitPaths[splitPaths.length - 1];
  // if the last part of the url doesn't have any query params, then we need to return nothing
  if (!queryParamPart.includes('?') || !queryParamPart.match(/\?(?!$)/)) {
    return '';
  }
  // first question mark not followed by another question mark. This allows us to sidestep trailing optional path params
  const firstQueryTargetIndex = queryParamPart.match(/\?(?!\?)/)?.index ?? -1;
  if (firstQueryTargetIndex === -1) {
    console.trace('Could not parse any query params out of ' + queryParamPart);
    return '';
  }
  return queryParamPart.substring(firstQueryTargetIndex);
}
