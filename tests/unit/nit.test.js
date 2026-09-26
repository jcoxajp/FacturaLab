import { describe, expect, it } from 'vitest';
import { esConsumidorFinal, esNitValido } from '../../src/services/nit.js';

describe('esNitValido', () => {
  it('acepta un NIT con dígito verificador correcto', () => {
    expect(esNitValido('12345679')).toBe(true);
    expect(esNitValido('12521337')).toBe(true);
  });

  it('acepta un NIT con guion antes del dígito verificador', () => {
    expect(esNitValido('1234567-9')).toBe(true);
  });

  it('acepta un dígito verificador "k" cuando el módulo da 10', () => {
    expect(esNitValido('99999994')).toBe(true);
    expect(esNitValido('99999999')).toBe(false);
  });

  it('rechaza un NIT con dígito verificador incorrecto', () => {
    expect(esNitValido('12345678')).toBe(false);
    expect(esNitValido('87654321')).toBe(false);
  });

  it('rechaza formatos que no son un NIT', () => {
    expect(esNitValido('abc')).toBe(false);
    expect(esNitValido('92000000000K')).toBe(false);
  });

  it('rechaza valores vacíos o nulos', () => {
    expect(esNitValido('')).toBe(false);
    expect(esNitValido(null)).toBe(false);
    expect(esNitValido(undefined)).toBe(false);
  });
});

describe('esConsumidorFinal', () => {
  it('acepta "CF" sin importar mayúsculas/espacios', () => {
    expect(esConsumidorFinal('CF')).toBe(true);
    expect(esConsumidorFinal('cf')).toBe(true);
    expect(esConsumidorFinal(' Cf ')).toBe(true);
  });

  it('rechaza cualquier otro valor', () => {
    expect(esConsumidorFinal('12521337')).toBe(false);
    expect(esConsumidorFinal('')).toBe(false);
    expect(esConsumidorFinal(null)).toBe(false);
    expect(esConsumidorFinal(undefined)).toBe(false);
  });
});
