import { RequestMethod } from "./RequestMethod.ts";
import UrlVariable from "./UrlVariable.ts";

export default class Route {
  public matchedParts: any = {};
  public pathVariables: UrlVariable[] = [];
  public queryVariables: UrlVariable[] = [];
  private compiledUrlRegex: RegExp;

  constructor(
    // a name to help the user distinguish which route is which
    public title: string,
    // the url that the route gets bound on, may include path and query variables
    public url: string,
    // the request method the route gets bound on
    public method: RequestMethod,
    // the value for the content-type header the request needs to use TODO maybe remove?
    public accept: string,
    // the headers used in the response for this route
    public responseHeaders: Headers,
    // the response body
    public response: string,
  ) {
    this.parseUrlVariables();
    // remove trailing `/` from the path
    this.url = this.url.replace(/\/$/, "").replace(/\/\?/, "?");
    this.compiledUrlRegex = this.buildUrlRegex();
  }

  /**
   * checks if the url matches our url rules
   * @param {string} url
   * @returns {boolean}
   */
  public doesUrlMatch(url: string = ""): boolean {
    url = url.toLowerCase();
    // make sure it passes the general format of this url
    const basicPatternMatches = url === this.url || this.compiledUrlRegex.test(url)
    // make sure all mandatory query parameters are present
    let hasAllMandatoryQueryFlags = true
    for (let queryVariable of this.queryVariables) {
      if (!queryVariable.optional) {
        const queryRegex = new RegExp(`[?&]${queryVariable.name}=[^&]+`, 'i')
        hasAllMandatoryQueryFlags = hasAllMandatoryQueryFlags && queryRegex.test(url)
      }
    }
    return basicPatternMatches && hasAllMandatoryQueryFlags
  }

  /**
   * parses our url and pulls out our parts of the url that should be variables
   * @private
   */
  private parseUrlVariables() {
    // matches a variable name after a /, and makes sure to not count a query variable as a flag for the var to be optional
    const pathVarRegex = /(?<=\/:)[a-zA-Z_\-0-9]+(\?(?!=:))?/g;
    // matches a query parameter variable name
    const queryVarRegex = /(?<=[?&]:)[a-zA-Z_\-0-9]+\??/g;
    // match and pull out our path variables
    const matchedPathVars = this.url.match(pathVarRegex);
    if (matchedPathVars) {
      for (let pathVar of matchedPathVars) {
        this.pathVariables.push(UrlVariable.fromString(pathVar));
      }
    }
    // match and pull out our query variables
    const matchedQueryVars = this.url.match(queryVarRegex);
    if (matchedQueryVars) {
      for (let queryVar of matchedQueryVars) {
        this.queryVariables.push(UrlVariable.fromString(queryVar));
      }
    }
  }

  /**
   * builds a regular expression used to match our url against potential candidates
   * @returns {RegExp}
   * @private
   */
  private buildUrlRegex(): RegExp {
    // replace all path variable names with a regex
    let compiledUrlString = this.url;
    // create variable regexes to match our url with
    const nonOptionalPathRegex =
      /(?<=\/):(([a-zA-Z_\-0-9]+$)|([a-zA-Z_\-0-9]+(?=(\?:|\/))))/g;
    const optionalPathRegex = /\/:[a-zA-Z_\-0-9]+\?(?!:)/g;
    const nonOptionalQueryRegex =
      /(\\?)?[?&]:(([a-zA-Z_\-0-9]+$)|([a-zA-Z_\-0-9]+(?=&)))/g;
    const optionalQueryRegex = /(\\?)?[?&]:[a-zA-Z_\-0-9]+(?=\?)\?/g;
    // first replace any query string question marks since `?` is a special regex char
    compiledUrlString = compiledUrlString.replace(/\?:/g, "\\?:");
    // for non-optional path param
    compiledUrlString = compiledUrlString.replaceAll(
      nonOptionalPathRegex,
      "[a-zA-Z_\\-0-9]+",
    );
    // for optional path param
    compiledUrlString = compiledUrlString.replaceAll(
      optionalPathRegex,
      "(/[a-zA-Z_\\-0-9]+)?",
    );
    // for non-optional query param
    compiledUrlString = compiledUrlString.replaceAll(
      nonOptionalQueryRegex,
      "[?&][a-zA-Z_\\-0-9]+=[^&]+",
    );
    // for optional query param
    compiledUrlString = compiledUrlString.replaceAll(
      optionalQueryRegex,
      "([?&][a-zA-Z_\\-0-9]+=[^&]+)?",
    );
    return new RegExp(`^${compiledUrlString}\$`, 'i');
  }

  /**
   * based on our url template, pulls variables out of the passed url and returns a basic JS object with the keys
   * as the variable name and the values as the variable value
   *
   * @param {string} url must have been matched against this route before passing into this method
   * @returns {any}
   */
  public parseVariablesFromUrl(url: string): any {
    if (this.pathVariables.length === 0 && this.queryVariables.length === 0) {
      return {};
    } else {
      const pathVars = this.parsePathVars(url);
      const queryVars = this.parseQueryVars(url);
      return { ...pathVars, ...queryVars };
    }
  }

  /**
   * parses path variables from the passed url that has been matched against this route
   * @param {string} request
   * @returns {any}
   * @private
   */
  private parsePathVars(request: string): any {
    const result: any = {};
    // first build a list of where each of our path variables are
    const splitRequest = request.split("?")[0].split("/");
    const splitUrl = this.url.split("?:")[0].split("/");
    // if they are the same length, that means that we passed in all vars
    if (splitRequest.length === splitUrl.length) {
      for (let i = 0; i < splitRequest.length; i++) {
        // if the splitUrl part is a variable, store it in the result
        if (splitUrl[i].startsWith(":")) {
          const key: string = splitUrl[i].replaceAll(/[:?]/g, "");
          result[key] = splitRequest[i];
        }
      }
    } else {
      // some optional inputs were excluded; first remove any parts of the input that exactly match a part for our route
      const inputArgs = splitRequest.filter((it) => !splitUrl.includes(it));
      const allUrlArgs = splitUrl.filter((it) => it.startsWith(":"));
      const requiredArgs = allUrlArgs.filter((it) => !it.endsWith("?"));
      /*
          now iterate through allUrlArgs.
          1. if the arg is required, populate it with index 0 of inputArgs and splice out the inputArg
          2. if the arg is optional, check if there are enough inputArgs to cover it and all other required args
            a. if there are enough, fill it and splice
            b. if there are not enough, ignore it
           */
      for (let i = 0; i < allUrlArgs.length; i++) {
        const arg = allUrlArgs[i];
        const isRequired = !arg.endsWith("?");
        // 1. if the arg is required, populate it with index 0 of inputArgs and splice out the inputArg
        if (isRequired) {
          result[arg.replaceAll(/[:]/g, "")] = inputArgs.splice(0, 1)[0];
          // remove index 0 of requiredArgs to keep track of how many are left
          requiredArgs.splice(0, 1);
        } else if (inputArgs.length > requiredArgs.length) {
          // there are enough input args left to fill this arg and all the required args
          result[arg.replaceAll(/[:?]/g, "")] = inputArgs.splice(0, 1)[0];
        } else {
          // not enough input args left, set the arg to null
          result[arg.replaceAll(/[:?]/g, "")] = null;
        }
      }
    }
    return result;
  }

  /**
   * pulls out the query vars of the passed url. The url at this point should have been matched against our pattern
   * @param {string} request
   * @returns {any}
   * @private
   */
  private parseQueryVars(request: string): any {
    // if we don't have any query variables, return an empty object
    if (this.queryVariables.length === 0) {
      return {};
    } else {
      const result: any = {};
      // for each mandatory query variable, get its value
      const mandatoryVars = this.queryVariables.filter((it) => !it.optional)
        .map((it) => it.name);
      const optionalVars = this.queryVariables.filter((it) => it.optional).map(
        (it) => it.name,
      );
      for (let mandatoryVar of mandatoryVars) {
        // get the variable from the query string
        const varRegex = new RegExp(`(?<=[?&])${mandatoryVar}=[^&]+`);
        // at this point the request url has been validated against our pattern, so we don't have to check if it exists
        // @ts-ignore
        result[mandatoryVar] = request.match(varRegex)[0].split("=")[1];
      }
      // now pull out the optional vars
      for (let optionalVar of optionalVars) {
        // get the variable from the query string
        const varRegex = new RegExp(`(?<=[?&])${optionalVar}=[^&]+`);
        const match = request.match(varRegex);
        // we may not have a match, so check first
        if (match?.length === 1) {
          result[optionalVar] = match[0].split("=")[1];
        } else {
          // explicitly set it to null
          result[optionalVar] = null;
        }
      }
      return result;
    }
  }

  /**
   * checks if this route has a path variable with the passed fields. Used for testing
   * @param {string} name
   * @param {boolean} optional
   * @returns {boolean}
   */
  public hasPathVariable(name: string, optional: boolean): boolean {
    return this.pathVariables.filter((it) =>
      it.name === name && it.optional === optional
    ).length > 0;
  }

  /**
   * checks if this route has a query variable with the passed fields. Used for testing
   * @param {string} name
   * @param {boolean} optional
   * @returns {boolean}
   */
  public hasQueryVariable(name: string, optional: boolean): boolean {
    return this.queryVariables.filter((it) =>
      it.name === name && it.optional === optional
    ).length > 0;
  }

  static fromObject(
    // @ts-ignore
    { title, url, method, accept, responseHeaders, response },
  ): Route {
    const headers = this.createResponseHeaders(responseHeaders);
    return new Route(
      title,
      url,
      method,
      accept,
      headers,
      response,
    );
  }

  /**
   * creates a `Header` object from the raw input object. Conversion is done
   * by simple key/value pairs
   * @param input
   * @returns {Headers}
   * @private
   */
  private static createResponseHeaders(input: any): Headers {
    const headers = new Headers();
    for (let [key, value] of Object.entries(input)) {
      headers.set(key, String(value));
    }
    return headers;
  }
}
