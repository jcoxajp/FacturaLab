export class XmlInvalidoError extends Error {
  constructor(message) {
    super(message);
    this.name = 'XmlInvalidoError';
  }
}
