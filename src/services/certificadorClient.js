import { randomUUID } from 'node:crypto';
import { ErrorCertificacion } from '../errors/ErrorCertificacion.js';

const NIT_RECHAZO = '00000000';
const NIT_TIMEOUT = '99999994';

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generarNumeroDte() {
  return String(Math.floor(100000000 + Math.random() * 900000000));
}

/**
 * Simula el envío de la factura al servicio de certificación (SAT/GFACE).
 * No hay llamada de red real: son reglas determinísticas sobre el NIT del
 * emisor para poder demostrar éxito, rechazo y timeout.
 *
 * @param {object} datosFactura datos extraídos por leerFacturaXml()
 * @param {object} [opciones]
 * @param {number} [opciones.delayMs=300] retardo simulado, en milisegundos
 * @returns {Promise<object>} número de autorización, serie, número de DTE y fecha de certificación
 * @throws {ErrorCertificacion} si el NIT del emisor dispara un rechazo o timeout simulado
 */
export async function certificarDocumento(datosFactura, { delayMs = 300 } = {}) {
  await esperar(delayMs);

  if (datosFactura.nitEmisor === NIT_TIMEOUT) {
    throw new ErrorCertificacion('Tiempo de espera agotado al conectar con el certificador');
  }

  if (datosFactura.nitEmisor === NIT_RECHAZO) {
    throw new ErrorCertificacion(`NIT emisor no autorizado para operar: ${datosFactura.nitEmisor}`);
  }

  const numeroAutorizacion = randomUUID().toUpperCase();

  return {
    numeroAutorizacion,
    serie: numeroAutorizacion.split('-')[0],
    numeroDte: generarNumeroDte(),
    fechaCertificacion: new Date().toISOString(),
  };
}
