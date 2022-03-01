export default class UrlVariable {
  constructor(
    public name: string,
    public optional: boolean = false,
  ) {
  }

  static fromString(str: string): UrlVariable {
    const optional = str.endsWith('?');
    const name = str.replace(/\?$/, '');
    return new UrlVariable(name, optional);
  }
}
