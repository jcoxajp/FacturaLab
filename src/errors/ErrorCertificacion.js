export class ErrorCertificacion extends Error {
  constructor(message) {
    super(message);
    this.name = 'ErrorCertificacion';
  }
}
