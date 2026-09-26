import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { certificarFactura } from '../../src/services/certificacionService.js';
import { XmlInvalidoError } from '../../src/errors/XmlInvalidoError.js';
import { ErrorCertificacion } from '../../src/errors/ErrorCertificacion.js';

const FACTURA_VALIDA = readFileSync('fixtures/factura-valida.xml', 'utf-8');
const FACTURA_SIN_NIT_EMISOR = readFileSync('fixtures/factura-sin-nit-emisor.xml', 'utf-8');
const FACTURA_TRIGGER_RECHAZO = readFileSync('fixtures/factura-trigger-rechazo.xml', 'utf-8');

const FACTURA_TRIGGER_TIMEOUT = FACTURA_VALIDA.replace('NITEmisor="12345679"', 'NITEmisor="99999994"');

describe('certificarFactura (flujo completo)', () => {
  it('lee, certifica y genera el PDF de una factura válida', async () => {
    const resultado = await certificarFactura(FACTURA_VALIDA, { delayMs: 0 });

    expect(resultado.datosFactura.nitEmisor).toBe('12345679');
    expect(resultado.datosCertificacion.numeroAutorizacion).toBeTruthy();
    expect(Buffer.isBuffer(resultado.pdf)).toBe(true);
    expect(resultado.pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('se detiene en la lectura si el XML es inválido, sin llegar a certificar', async () => {
    await expect(certificarFactura(FACTURA_SIN_NIT_EMISOR, { delayMs: 0 })).rejects.toThrow(
      XmlInvalidoError,
    );
  });

  it('se detiene en la certificación si el certificador rechaza la factura', async () => {
    await expect(certificarFactura(FACTURA_TRIGGER_RECHAZO, { delayMs: 0 })).rejects.toThrow(
      ErrorCertificacion,
    );
  });

  it('se detiene en la certificación si el certificador da timeout', async () => {
    await expect(certificarFactura(FACTURA_TRIGGER_TIMEOUT, { delayMs: 0 })).rejects.toThrow(
      /Tiempo de espera/,
    );
  });
});
