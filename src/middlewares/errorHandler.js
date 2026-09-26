import multer from 'multer';
import { XmlInvalidoError } from '../errors/XmlInvalidoError.js';
import { ArchivoInvalidoError } from '../errors/ArchivoInvalidoError.js';
import { ErrorCertificacion } from '../errors/ErrorCertificacion.js';

export function errorHandler(err, _req, res, _next) {
  if (err instanceof XmlInvalidoError || err instanceof ArchivoInvalidoError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof ErrorCertificacion) {
    return res.status(422).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}
