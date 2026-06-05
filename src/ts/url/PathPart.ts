import { Token, TokenTypes } from './UrlTokenizer.ts';

/** represents a part of the path portion of our url */
export type BasePathPart = {
  /** the value of the path. If `isVariable`, then this is _not_ what literally needs to be matched. Otherwise, it is a literal */
  value: string;
  /** the position in the path this part takes */
  order: number;
};

export type ExactPathPart = BasePathPart & { isVariable: false };

export type RequiredVariablePathPart = BasePathPart & {
  isVariable: true;
  isOptional: false;
};

export type OptionalVariablePathPart = BasePathPart & {
  isVariable: true;
  isOptional: true;
};

export type GlobPathPart = BasePathPart & {
  isVariable: true;
  isGlob: true;
};

export type PathPart =
  | ExactPathPart
  | RequiredVariablePathPart
  | OptionalVariablePathPart
  | GlobPathPart;

function isExact(part: PathPart): part is ExactPathPart {
  return !part.isVariable;
}

export function isOptionalVar(
  part: PathPart,
): part is OptionalVariablePathPart {
  return part.isVariable && 'isOptional' in part && part.isOptional;
}

function isRequiredVar(part: PathPart): part is RequiredVariablePathPart {
  return part.isVariable && 'isOptional' in part && !part.isOptional;
}

function isGlob(part: PathPart): part is GlobPathPart {
  return part.isVariable && 'isGlob' in part && part.isGlob;
}

/** an indexed object grouping the path into different parts for eash of use.
 *
 * each array is sorted according to the internal `order` value of the path part
 */
export type IndexedPathPart = {
  pathParts: PathPart[];
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

/**
 * turns an individual [PathPart] into a regex fragment
 */
export function toGex(part: PathPart): string {
  if (isExact(part)) {
    return '/' + part.value;
  } else if (isRequiredVar(part)) {
    // match everything until the first path separator. With how testing is done, we don't need to worry
    // about query param bounds, since we can guarantee only testing on the url path
    return `(?<${part.value.replace(':', '')}${part.order}>/[^/?&]+?)`;
  } else if (isOptionalVar(part)) {
    // this one is interesting, since something or _nothing_ can be matched. We have to include the `/`
    // in this part so that it can be optionally matched on, which means the caller of this function will
    // need to remove cases of `//`
    return `(?<${part.value.replace(':', '')}${part.order}>(/[^/?&]+?)?)`;
  } else if (isGlob(part)) {
    // this one is a bit interesting too, since it can match as many path segments as it wants
    return `(?<glob${part.order}>/.+?)`;
  } else {
    throw new Error(
      `Invalid path part type: typescript compiler said this will never happen!: ${
        JSON.stringify(part)
      }`,
    );
  }
}

/**
 * Creates an [IndexedPathPart] from an array of tokens
 */
export function indexPath(tokens: Token[]): IndexedPathPart {
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
