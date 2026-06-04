import { RequestMethod } from './RequestMethod.ts';
import { red } from '@std/fmt/colors';
import LogManager from '../LogManager.ts';
import { RouteTypes } from './RouteTypes.ts';
import {
  LogTypes,
  RequestLogEntry,
  ResponseLogEntry,
} from '../model/LogModels.ts';
import { parseUrlTemplate, UrlMatcher } from '../url/index.ts';

/**
 * Object that matches against a request and generates a mock response
 */
export default class Route {
  /** represents how specific the route is. If a request matches multiple routes, the one with the highest specificity is picked to handle the request */
  #specificity = 0;
  #urlMatcher: UrlMatcher;

  constructor(
    /** the unique id of the route as saved on the disk */
    public id: string,
    /** a name to help the user distinguish which route is which */
    public title: string,
    /** the url that the route gets bound on, may include path and query variables */
    public url: string,
    /** the request method the route gets bound on. '*' means it accepts any method */
    public method: RequestMethod | '*',
    /** the headers used in the response for this route */
    public responseHeaders: Headers,
    /** the response body */
    public response: string | null,
    /** the http status code */
    public responseStatus: number,
    /** whether the route is "turned on" */
    public isEnabled: boolean,
    /** used on the UI side to determine which fields to display */
    public routeType: RouteTypes,
  ) {
    // remove trailing `/` from the path
    this.url = this.url.replace(/\/$/, '').replace(/\/\?/, '?');
    this.#urlMatcher = parseUrlTemplate(this.url);
    this.scoreSpecificity();
    // TODO make sure all the required fields exist
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
    return this.#urlMatcher.matches(url);
  }

  /**
   * based on our url template, pulls variables out of the passed url and returns a basic JS object with the keys
   * as the variable name and the values as the variable value
   *
   * @param {string} url must have been matched against this route before passing into this method
   * @returns {any}
   */
  public parseVariablesFromUrl(url: string): Record<string, string | null> {
    return this.#urlMatcher.getVariables(url);
  }

  /**
   * returns the path part of the passed url
   * @param url
   */
  public static getPath(url: string): string {
    const split = url
      .replace(/(?<=https?:\/\/)([0-9]{1,3}\.){3}[0-9]{1,3}/, 'localhost')
      .split(/localhost:[0-9]+/);
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
        const replaceRegex = new RegExp(`{{${varName}(:[^}]+)?}}`, 'ig');
        if (varValue) {
          bodyCopy = bodyCopy.replaceAll(replaceRegex, <string> varValue);
        }
      }
      // now replace all of our remaining placeholders
      const remainingVars = bodyCopy.match(/{{[a-zA-Z\-_0-9]+:.*?}}/g);
      if (remainingVars) {
        for (const remainingVar of remainingVars) {
          const defaultVal = remainingVar.match(/(?<=:)[^}]+(?=}})/) ??
            ([] as string[]);
          bodyCopy = bodyCopy.replace(remainingVar, defaultVal[0]);
        }
      }
    }
    return bodyCopy!;
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
    this.#specificity = this.#urlMatcher.specificity;
  }

  get specificity() {
    return this.#specificity;
  }
}
