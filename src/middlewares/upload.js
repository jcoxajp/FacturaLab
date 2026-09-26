import multer from 'multer';
import { ArchivoInvalidoError } from '../errors/ArchivoInvalidoError.js';

const TIPOS_MIME_PERMITIDOS = new Set(['text/xml', 'application/xml']);
const TAMANO_MAXIMO_BYTES = 1 * 1024 * 1024;

function filtroXml(req, file, cb) {
  const esXmlPorExtension = file.originalname.toLowerCase().endsWith('.xml');
  const esXmlPorMimeType = TIPOS_MIME_PERMITIDOS.has(file.mimetype);

  if (!esXmlPorExtension && !esXmlPorMimeType) {
    return cb(new ArchivoInvalidoError('El archivo debe ser un XML (.xml)'));
  }

  cb(null, true);
}

export const uploadFactura = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_BYTES },
  fileFilter: filtroXml,
}).single('factura');
