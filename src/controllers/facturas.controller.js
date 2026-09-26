import { certificarFactura } from '../services/certificacionService.js';
import { ArchivoInvalidoError } from '../errors/ArchivoInvalidoError.js';

export async function crearFacturaCertificada(req, res) {
  if (!req.file) {
    throw new ArchivoInvalidoError('Debe adjuntar un archivo XML en el campo "factura"');
  }

  const xmlString = req.file.buffer.toString('utf-8');
  const { pdf } = await certificarFactura(xmlString);

  res.status(201).type('application/pdf').send(pdf);
}
