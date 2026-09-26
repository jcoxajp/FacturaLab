import { describe, expect, it } from 'vitest';
import { certificarDocumento } from '../../src/services/certificadorClient.js';
import { ErrorCertificacion } from '../../src/errors/ErrorCertificacion.js';

const UUID_REGEXP = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/;

const datosFactura = (nitEmisor) => ({
  nitEmisor,
  idReceptor: '12521337',
  items: [{ descripcion: 'Producto A', cantidad: 1, precioUnitario: 100, total: 100 }],
  granTotal: 100,
});

describe('certificarDocumento', () => {
  it('certifica exitosamente una factura con NIT válido', async () => {
    const resultado = await certificarDocumento(datosFactura('12345679'), { delayMs: 0 });

    expect(resultado.numeroAutorizacion).toMatch(UUID_REGEXP);
    expect(resultado.serie).toBe(resultado.numeroAutorizacion.split('-')[0]);
    expect(resultado.numeroDte).toMatch(/^\d{9}$/);
    expect(() => new Date(resultado.fechaCertificacion).toISOString()).not.toThrow();
  });

  it('lanza ErrorCertificacion (rechazo) cuando el NIT emisor es el gatillo de rechazo', async () => {
    await expect(certificarDocumento(datosFactura('00000000'), { delayMs: 0 })).rejects.toThrow(
      ErrorCertificacion,
    );
    await expect(certificarDocumento(datosFactura('00000000'), { delayMs: 0 })).rejects.toThrow(
      /no autorizado/,
    );
  });

  it('lanza ErrorCertificacion (timeout) cuando el NIT emisor es el gatillo de timeout', async () => {
    await expect(certificarDocumento(datosFactura('99999994'), { delayMs: 0 })).rejects.toThrow(
      ErrorCertificacion,
    );
    await expect(certificarDocumento(datosFactura('99999994'), { delayMs: 0 })).rejects.toThrow(
      /Tiempo de espera/,
    );
  });

  it('genera un número de autorización distinto en cada llamada', async () => {
    const primero = await certificarDocumento(datosFactura('12345679'), { delayMs: 0 });
    const segundo = await certificarDocumento(datosFactura('12345679'), { delayMs: 0 });

    expect(primero.numeroAutorizacion).not.toBe(segundo.numeroAutorizacion);
  });
});
