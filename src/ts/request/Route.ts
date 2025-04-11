import { RequestMethod } from './RequestMethod.ts';
import UrlVariable from './UrlVariable.ts';
import { red } from '@std/fmt/colors';
import LogManager from '../LogManager.ts';
import { RouteTypes } from './RouteTypes.ts';
import {
  LogTypes,
  RequestLogEntry,
  ResponseLogEntry,
} from '../model/LogModels.ts';

/**
 * Object that matches against a request and generates a mock response
 */
export default class Route {
  #pathVariables: UrlVariable[] = [];
  #queryVariables: UrlVariable[] = [];
  #compiledUrlRegex: RegExp;
  #hasImpliedQueryParams: boolean;
  /** represents how specific the route is. If a request matches multiple routes, the one with the highest specificity is picked to handle the request */
  #specificity = 0;

  constructor(
    // a name to help the user distinguish which route is which
    public title: string,
    // the url that the route gets bound on, may include path and query variables
    public url: string,
    // the request method the route gets bound on
    public method: RequestMethod,
    // the headers used in the response for this route
    public responseHeaders: Headers,
    // the response body
    public response: string | null,
    // the http status code
    public responseStatus: number,
    // whether the route is "turned on"
    public isEnabled: boolean,
    // used on the UI side to determine which fields to display
    public routeType: RouteTypes,
  ) {
    this.parseUrlVariables();
    // remove trailing `/` from the path
    this.url = this.url.replace(/\/$/, '').replace(/\/\?/, '?');
    this.#hasImpliedQueryParams = /[?&]:\*/g.test(this.url);
    this.#compiledUrlRegex = this.buildUrlRegex();
    this.scoreSpecificity();
    // make sure all the required fields exist TODO
  }

  /**
   * creates a `Header` object from the raw input object. Conversion is done
   * by simple key/value pairs
   * @returns {Headers}
   * @private
   */
  private createResponseHeaders(): Headers {
    if (this.responseHeaders instanceof Headers) {
      return this.responseHeaders;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(this.responseHeaders)) {
      headers.append(key, String(value));
    }
    return headers;
  }

  /**
   * takes the passed request and produces an output from that request in the form of a mock response through request#respond
   * At this point, the request url has been matched and this route has been selected to handle it, so everything
   * should go smoothly
   * @param request
   */
  public async execute(request: Request): Promise<Response> {
    const logId = crypto.randomUUID().toLowerCase();
    let bodyString = '';
    if (request.body) {
      bodyString = await request.text();
    }
    const requestLog = new RequestLogEntry(
      Route.getPath(request.url),
      request.method.toUpperCase(),
      null,
      bodyString,
      request.headers,
      +new Date(),
    );
    LogManager.enqueueLog(requestLog, logId, LogTypes.REQUEST);
    try {
      const url = request.url;
      const responseBody = this.populateBodyTemplate(url);
      const responseLog = new ResponseLogEntry(
        this.responseStatus,
        responseBody,
        this.responseHeaders,
        +new Date(),
        this.responseStatus,
      );
      LogManager.enqueueLog(responseLog, logId, LogTypes.RESPONSE);
      return new Response(responseBody, {
        status: this.responseStatus,
        headers: this.createResponseHeaders(),
      });
    } catch (e) {
      console.error(red('Failed to handle request!'));
      console.trace(e);
      return new Response('Failed to handle request', { status: 500 });
    }
  }

  /**
   * checks if the url matches our url rules
   * @param {string} url
   * @returns {boolean}
   */
  public doesUrlMatch(url: string = ''): boolean {
    url = url.toLowerCase();
    // make sure it passes the general format of this url
    const basicPatternMatches = url === this.url ||
      this.#compiledUrlRegex.test(url);
    // make sure all mandatory query parameters are present
    let hasAllMandatoryQueryFlags = true;
    for (const queryVariable of this.#queryVariables) {
      if (!queryVariable.optional) {
        const queryRegex = new RegExp(
          `[?&]${queryVariable.name}=[^&]+`,
          'i',
        );
        hasAllMandatoryQueryFlags = hasAllMandatoryQueryFlags &&
          queryRegex.test(url);
      }
    }
    return basicPatternMatches && hasAllMandatoryQueryFlags;
  }

  /**
   * based on our url template, pulls variables out of the passed url and returns a basic JS object with the keys
   * as the variable name and the values as the variable value
   *
   * @param {string} url must have been matched against this route before passing into this method
   * @returns {any}
   */
  public parseVariablesFromUrl(url: string): Record<string, string | null> {
    if (
      (this.#pathVariables.length === 0 &&
        this.#queryVariables.length === 0) &&
      !this.#hasImpliedQueryParams
    ) {
      return {};
    } else {
      const pathVars = this.parsePathVars(url);
      const queryVars = this.parseQueryVars(url);
      return { ...pathVars, ...queryVars };
    }
  }

  /**
   * checks if this route has a path variable with the passed fields. Used for testing
   * @param {string} name
   * @param {boolean} optional
   * @returns {boolean}
   */
  public hasPathVariable(name: string, optional: boolean): boolean {
    return this.#pathVariables.filter((it) =>
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
    return this.#queryVariables.filter((it) =>
      it.name === name && it.optional === optional
    ).length > 0;
  }

  /**
   * returns the path part of the passed url
   * @param url
   */
  public static getPath(url: string): string {
    const split = url.replace(/(?<=http:\/\/)127\.0\.0\.1/, 'localhost')
      .split(
        /localhost:[0-9]+/,
      );
    return split[1];
  }

  /**
   * fills in variables in our response body based on the url variables in the passed url
   * @param url
   * @private
   */
  private populateBodyTemplate(url: string): string {
    let bodyCopy = this.response;
    if (bodyCopy !== null) {
      // retrieve the url variables from the url
      const urlVars = this.parseVariablesFromUrl(url);
      // now replace each instance of our var placeholders
      for (const [varName, varValue] of Object.entries(urlVars)) {
        const replaceRegex = new RegExp(
          `{{${varName}(:[^}]+)?}}`,
          'ig',
        );
        if (varValue) {
          bodyCopy = bodyCopy.replaceAll(
            replaceRegex,
            <string> varValue,
          );
        }
      }
      // now replace all of our remaining placeholders
      const remainingVars = bodyCopy.match(/{{[a-zA-Z\-_0-9]+:.*?}}/g);
      if (remainingVars) {
        for (const remainingVar of remainingVars) {
          const defaultVal = remainingVar.match(/(?<=:)[^}]+(?=}})/) ??
            [] as string[];
          bodyCopy = bodyCopy.replace(remainingVar, defaultVal[0]);
        }
      }
    }
    return bodyCopy!;
  }

  /**
   * parses our url and pulls out our parts of the url that should be variables
   * @private
   */
  private parseUrlVariables() {
    // matches a variable name after a /, and makes sure to not count a query variable as a flag for the var to be optional
    const pathVarRegex = /(?<=\/:)[a-zA-Z_\-0-9]+(\?(?!:))?/g;
    // matches a query parameter variable name
    const queryVarRegex = /(?<=[?&]:)[a-zA-Z_\-0-9.]+\??/g;
    // match and pull out our path variables
    const matchedPathVars = this.url.match(pathVarRegex);
    if (matchedPathVars) {
      for (const pathVar of matchedPathVars) {
        this.#pathVariables.push(UrlVariable.fromString(pathVar));
      }
    }
    // match and pull out our query variables
    const matchedQueryVars = this.url.match(queryVarRegex);
    if (matchedQueryVars) {
      for (const queryVar of matchedQueryVars) {
        this.#queryVariables.push(UrlVariable.fromString(queryVar));
      }
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
  private scoreSpecificity() {
    let specificity = 0;
    let url = this.url;
    // make sure a "bad" url is normalized
    if (!url.startsWith('/')) {
      url = '/' + url;
    }
    // it's way simpler to handle the path section and the query section separately
    const [path, query] = url.split(/\?(?=[a-z0-9:])/i);
    const splitPath = path.split('/');
    // path will always be defined because we prefix it, but query could be undefined
    const splitQuery = (query ?? '').split('&');
    for (const pathPart of splitPath) {
      // wild cards get nothing
      if (pathPart.endsWith('*')) {
        continue;
      }
      if (pathPart.startsWith(':')) {
        specificity += pathPart.endsWith('?') ? 1 : 2;
      } else if (pathPart.length > 0) {
        specificity += 3;
      }
    }

    for (const queryPart of splitQuery) {
      // wild cards get nothing
      if (queryPart.endsWith('*')) {
        continue;
      }
      if (queryPart.startsWith(':')) {
        specificity += queryPart.endsWith('?') ? 1 : 2;
      } else if (queryPart.length > 0) {
        specificity += 3;
      }
    }

    this.#specificity = specificity;
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
      /(?<=\/):(([a-zA-Z_\-0-9]+$)|([a-zA-Z_\-0-9]+(?=(\?:|\/|\\))))/g;
    const optionalPathRegex = /\/:[a-zA-Z_\-0-9]+\?(?!:)/g;
    const anythingPathRegex = /(?<=\/):\*/g;
    const nonOptionalQueryRegex =
      /(\\?)?[?&]:(([a-zA-Z_\-0-9.]+$)|([a-zA-Z_\-0-9.]+(?=&)))/g;
    const optionalQueryRegex = /(\\?)?[?&]:[a-zA-Z_\-0-9.]+(?=\?)\?/g;
    const anythingQueryRegex = /(\\?)?[?&]:\*/g;
    // first replace any query string question marks since `?` is a special regex char
    compiledUrlString = compiledUrlString.replace(/\?:/g, '/?\\?:');
    // for trailing slash
    if (!compiledUrlString.includes('?')) {
      compiledUrlString += '/?';
    }
    // for non-optional path param
    compiledUrlString = compiledUrlString.replaceAll(
      nonOptionalPathRegex,
      '[^/]+',
    );
    // for optional path param
    compiledUrlString = compiledUrlString.replaceAll(
      optionalPathRegex,
      '(/[^/]+)?',
    );
    // for non-optional query param
    compiledUrlString = compiledUrlString.replaceAll(
      nonOptionalQueryRegex,
      '[?&][^=/?&]+=[^&]+',
    );
    // for optional query param
    compiledUrlString = compiledUrlString.replaceAll(
      optionalQueryRegex,
      '([?&][^=/?&]+=[^&]+)?',
    );
    // for anything query param
    compiledUrlString = compiledUrlString.replaceAll(
      anythingQueryRegex,
      '([?&][^=/?&]+=[^&]+)*',
    );
    // for anything path param
    compiledUrlString = compiledUrlString.replaceAll(
      anythingPathRegex,
      '[^?]+?',
    );
    // final cleanup to make sure the regex is valid
    compiledUrlString = compiledUrlString.replaceAll(/\?\?/g, '?\\?');
    return new RegExp(`^${compiledUrlString}\$`, 'i');
  }

  /**
   * parses path variables from the passed url that has been matched against this route
   * @param {string} request
   * @private
   */
  private parsePathVars(request: string): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    request = request.replace(/^https?:\/\//, '');
    // first build a list of where each of our path variables are
    const splitRequest = request.split('?')[0].split('/');
    const splitUrl = this.url.split('?:')[0].split('/');
    // if they are the same length, that means that we passed in all vars
    if (splitRequest.length === splitUrl.length) {
      for (let i = 0; i < splitRequest.length; i++) {
        // if the splitUrl part is a variable, store it in the result
        if (splitUrl[i].startsWith(':')) {
          const key: string = splitUrl[i].replaceAll(/[:?]/g, '');
          result[key] = splitRequest[i];
        }
      }
    } else {
      // some optional inputs were excluded; first remove any parts of the input that exactly match a part for our route
      const inputArgs = splitRequest.filter((it) => !splitUrl.includes(it));
      const allUrlArgs = splitUrl.filter((it) => it.startsWith(':'));
      const requiredArgs = allUrlArgs.filter((it) => !it.endsWith('?'));
      /*
        now iterate through allUrlArgs.
        1. if the arg is required, populate it with index 0 of inputArgs and splice out the inputArg
        2. if the arg is optional, check if there are enough inputArgs to cover it and all other required args
          a. if there are enough, fill it and splice
          b. if there are not enough, ignore it
       */
      for (const arg of allUrlArgs) {
        const isRequired = !arg.endsWith('?');
        // 1. if the arg is required, populate it with index 0 of inputArgs and splice out the inputArg
        if (isRequired) {
          result[arg.replaceAll(/[:]/g, '')] = inputArgs.splice(0, 1)[0];
          // remove index 0 of requiredArgs to keep track of how many are left
          requiredArgs.splice(0, 1);
        } else if (inputArgs.length > requiredArgs.length) {
          // there are enough input args left to fill this arg and all the required args
          result[arg.replaceAll(/[:?]/g, '')] = inputArgs.splice(0, 1)[0];
        } else {
          // not enough input args left, set the arg to null
          result[arg.replaceAll(/[:?]/g, '')] = null;
        }
      }
    }
    return result;
  }

  /**
   * pulls out the query vars of the passed url. The url at this point should have been matched against our pattern
   * @private
   */
  private parseQueryVars(request: string): Record<string, string | null> {
    // if we don't have any query variables, return an empty object
    if (this.#queryVariables.length === 0 && !this.#hasImpliedQueryParams) {
      return {};
    } else {
      const result: Record<string, string | null> = {};
      // for each mandatory query variable, get its value
      const mandatoryVars = this.#queryVariables.filter((it) => !it.optional)
        .map((it) => it.name);
      const optionalVars = this.#queryVariables.filter((it) => it.optional)
        .map(
          (it) => it.name,
        );
      for (const mandatoryVar of mandatoryVars) {
        // get the variable from the query string
        const varRegex = new RegExp(`(?<=[?&])${mandatoryVar}=[^&]+`);
        // at this point the request url has been validated against our pattern, so we don't have to check if it exists
        result[mandatoryVar] = request.match(varRegex)![0].split('=')[1];
      }
      // now pull out the optional vars
      for (const optionalVar of optionalVars) {
        // get the variable from the query string
        const varRegex = new RegExp(`(?<=[?&])${optionalVar}=[^&]+`);
        const match = request.match(varRegex);
        // we may not have a match, so check first
        if (match?.length === 1) {
          result[optionalVar] = match[0].split('=')[1];
        } else {
          // explicitly set it to null
          result[optionalVar] = null;
        }
      }
      // we don't want to re-include vars that we explicitly called out
      const explicitVarNames = [...mandatoryVars, ...optionalVars];
      const impliedQueryVars = (request.match(/(?<=[?&])[^&]*/g) ?? [])
        .filter(
          (it) => it && it.length > 0,
        ).map((it) => it.split('=')).filter((it) =>
          !explicitVarNames.includes(it[0])
        );
      impliedQueryVars.forEach(([key, value]) => result[key] = value);
      return result;
    }
  }

  get compiledUrlRegex() {
    return this.#compiledUrlRegex;
  }

  get specificity() {
    return this.#specificity;
  }
}
