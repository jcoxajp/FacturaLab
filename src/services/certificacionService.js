import { leerFacturaXml } from './xmlReader.js';
import { certificarDocumento } from './certificadorClient.js';
import { generarPdfFactura } from './pdfGenerator.js';
import { registrarCertificacion } from './historialCertificaciones.js';

/**
 * Orquesta el flujo completo: leer XML -> certificar -> generar PDF.
 *
 * @param {string} xmlString contenido del XML de la factura
 * @param {object} [opciones]
 * @param {number} [opciones.delayMs] retardo simulado de la certificación (ver certificarDocumento)
 * @returns {Promise<{datosFactura: object, datosCertificacion: object, pdf: Buffer}>}
 * @throws {import('../errors/XmlInvalidoError.js').XmlInvalidoError} si el XML es inválido
 * @throws {import('../errors/ErrorCertificacion.js').ErrorCertificacion} si la certificación falla
 */
export async function certificarFactura(xmlString, opciones) {
  const datosFactura = leerFacturaXml(xmlString);
  const datosCertificacion = await certificarDocumento(datosFactura, opciones);
  const pdf = await generarPdfFactura(datosFactura, datosCertificacion);

  registrarCertificacion(datosFactura, datosCertificacion);

  return { datosFactura, datosCertificacion, pdf };
}
