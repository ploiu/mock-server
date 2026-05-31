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

function isOptionalVar(part: PathPart): part is OptionalVariablePathPart {
  return part.isVariable && 'isOptional' in part && part.isOptional;
}

function isRequiredVar(part: PathPart): part is RequiredVariablePathPart {
  return part.isVariable && 'isOptional' in part && !part.isOptional;
}

function isGlob(part: PathPart): part is GlobPathPart {
  return part.isVariable && 'isGlob' in part && part.isGlob;
}

export type BaseQueryPart = {
  /** the name of the query param */
  name: string;
};

export type QueryPart =
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
    return part.value;
  } else if (isRequiredVar(part)) {
    // match everything until the first path separator. With how testing is done, we don't need to worry
    // about query param bounds, since we can guarantee only testing on the url path
    return '[^/]+?';
  } else if (isOptionalVar(part)) {
    // this one is interesting, since something or _nothing_ can be matched. We have to include the `/`
    // in this part so that it can be optionally matched on, which means the caller of this function will
    // need to remove cases of `//`
    return '([^/]+?/)?';
  } else if (isGlob(part)) {
    // this one is a bit interesting too, since it can match as many path segments as it wants
    return '.+?';
  } else {
    throw new Error(
      `Invalid path part type: typescript compiler said this will never happen!: ${
        JSON.stringify(part)
      }`,
    );
  }
}
