import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_HISTORIAL,
  limpiarHistorial,
  obtenerHistorial,
  registrarCertificacion,
} from '../../src/services/historialCertificaciones.js';

describe('historialCertificaciones', () => {
  const facturaBase = {
    nitEmisor: '12345679',
    nombreEmisor: 'DISTRIBUIDORA DEMO',
    idReceptor: '12521337',
    nombreReceptor: 'CLIENTE EJEMPLO',
    granTotal: 250.0,
  };

  const certificacionBase = {
    numeroAutorizacion: 'A1B2C3D4-E5F6-7890-ABCD-1234567890AB',
    serie: 'A1B2C3D4',
    numeroDte: '123456789',
    fechaCertificacion: '2026-09-26T12:00:00.000Z',
  };

  beforeEach(() => {
    limpiarHistorial();
  });

  it('inicia con un historial vacío', () => {
    expect(obtenerHistorial()).toEqual([]);
  });

  it('registra una certificación con los campos esperados', () => {
    registrarCertificacion(facturaBase, certificacionBase);

    const historial = obtenerHistorial();
    expect(historial).toHaveLength(1);
    expect(historial[0]).toEqual({
      nitEmisor: '12345679',
      nombreEmisor: 'DISTRIBUIDORA DEMO',
      idReceptor: '12521337',
      nombreReceptor: 'CLIENTE EJEMPLO',
      granTotal: 250.0,
      numeroAutorizacion: 'A1B2C3D4-E5F6-7890-ABCD-1234567890AB',
      serie: 'A1B2C3D4',
      numeroDte: '123456789',
      fechaCertificacion: '2026-09-26T12:00:00.000Z',
    });
  });

  it('ubica la certificación más reciente en la primera posición', () => {
    registrarCertificacion(
      { ...facturaBase, nombreReceptor: 'Cliente Primero' },
      { ...certificacionBase, numeroDte: '111111111' },
    );

    registrarCertificacion(
      { ...facturaBase, nombreReceptor: 'Cliente Segundo' },
      { ...certificacionBase, numeroDte: '222222222' },
    );

    const historial = obtenerHistorial();
    expect(historial).toHaveLength(2);
    expect(historial[0].nombreReceptor).toBe('Cliente Segundo');
    expect(historial[1].nombreReceptor).toBe('Cliente Primero');
  });

  it(`mantiene un máximo de ${MAX_HISTORIAL} elementos descartando los más antiguos`, () => {
    for (let i = 1; i <= 15; i++) {
      registrarCertificacion(
        { ...facturaBase, nombreReceptor: `Cliente ${i}` },
        { ...certificacionBase, numeroDte: String(100000000 + i) },
      );
    }

    const historial = obtenerHistorial();
    expect(historial).toHaveLength(MAX_HISTORIAL);
    expect(historial[0].nombreReceptor).toBe('Cliente 15');
    expect(historial[MAX_HISTORIAL - 1].nombreReceptor).toBe('Cliente 6');
  });

  it('retorna una copia del arreglo para evitar modificaciones externas', () => {
    registrarCertificacion(facturaBase, certificacionBase);

    const copia = obtenerHistorial();
    copia.push({ nombreReceptor: 'Intruso' });
    copia[0].nombreReceptor = 'Modificado';

    const actual = obtenerHistorial();
    expect(actual).toHaveLength(1);
    expect(actual[0].nombreReceptor).toBe('CLIENTE EJEMPLO');
  });
});
