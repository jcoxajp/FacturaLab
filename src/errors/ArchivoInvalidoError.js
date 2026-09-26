export class ArchivoInvalidoError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ArchivoInvalidoError';
  }
}
