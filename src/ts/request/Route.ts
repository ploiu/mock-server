import {RequestMethod} from "./RequestMethod.ts";
import UrlVariable from "./UrlVariable.ts";

export default class Route {
	public matchedParts: any = {};
	public pathVariables: UrlVariable[] = [];
	public queryVariables: UrlVariable[] = [];
	private compiledUrlRegex: RegExp;

	constructor(
		public title: string,
		public url: string,
		public method: RequestMethod,
		public accept: string,
		public responseHeaders: Headers,
		public response: string,
	) {
		this.parseUrlVariables();
		// remove trailing `/` from the path
		this.url = this.url.replace(/\/$/, "").replace(/\/\?/, "?");
		this.compiledUrlRegex = this.buildUrlRegex()
	}

	/**
	 * checks if the url matches our url rules
	 * @param {string} url
	 * @returns {boolean}
	 */
	public doesUrlMatch(url: string = ""): boolean {
		url = url.toLowerCase();
		// simple urls
		return url === this.url || this.compiledUrlRegex.test(url)
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
		if(matchedPathVars) {
			for(let pathVar of matchedPathVars) {
				this.pathVariables.push(UrlVariable.fromString(pathVar));
			}
		}
		// match and pull out our query variables
		const matchedQueryVars = this.url.match(queryVarRegex);
		if(matchedQueryVars) {
			for(let queryVar of matchedQueryVars) {
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
		const nonOptionalPathRegex = /(?<=\/):(([a-zA-Z_\-0-9]+$)|([a-zA-Z_\-0-9]+(?=(\?:|\/))))/g;
		const optionalPathRegex = /\/:[a-zA-Z_\-0-9]+\?(?!:)/g;
		const nonOptionalQueryRegex = /(\\?)?[?&]:(([a-zA-Z_\-0-9]+$)|([a-zA-Z_\-0-9]+(?=&)))/g;
		const optionalQueryRegex = /(\\?)?[?&]:[a-zA-Z_\-0-9]+(?=\?)\?/g;
		// first replace any query string question marks since `?` is a special regex char 
		compiledUrlString = compiledUrlString.replace(/\?:/g, '\\?:')
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
		return new RegExp(`^${compiledUrlString}\$`)
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
		{title, url, method, accept, responseHeaders, response},
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
		for(let [key, value] of Object.entries(input)) {
			headers.set(key, String(value));
		}
		return headers;
	}
}
