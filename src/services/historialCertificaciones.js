export const MAX_HISTORIAL = 10;

let historial = [];

/**
 * Registra una certificación exitosa en el historial en memoria.
 *
 * @param {object} datosFactura
 * @param {object} datosCertificacion
 */
export function registrarCertificacion(datosFactura, datosCertificacion) {
  const registro = {
    nitEmisor: datosFactura.nitEmisor,
    nombreEmisor: datosFactura.nombreEmisor,
    idReceptor: datosFactura.idReceptor,
    nombreReceptor: datosFactura.nombreReceptor,
    granTotal: datosFactura.granTotal,
    numeroAutorizacion: datosCertificacion.numeroAutorizacion,
    serie: datosCertificacion.serie,
    numeroDte: datosCertificacion.numeroDte,
    fechaCertificacion: datosCertificacion.fechaCertificacion,
  };

  historial.unshift(registro);

  if (historial.length > MAX_HISTORIAL) {
    historial = historial.slice(0, MAX_HISTORIAL);
  }
}

/**
 * Retorna una copia del historial actual.
 *
 * @returns {Array<object>}
 */
export function obtenerHistorial() {
  return historial.map((item) => ({ ...item }));
}

/**
 * Limpia el historial (uso interno y pruebas).
 */
export function limpiarHistorial() {
  historial = [];
}

