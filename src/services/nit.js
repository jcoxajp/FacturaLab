const NIT_REGEXP = /^[0-9]+-?[0-9kK]$/;

/**
 * Valida el formato y el dígito verificador de un NIT de Guatemala
 * (algoritmo de complemento 11).
 *
 * @param {string} nit
 * @returns {boolean}
 */
export function esNitValido(nit) {
  if (!nit || !NIT_REGEXP.test(nit)) {
    return false;
  }

  const nitSinGuion = nit.replace('-', '');
  const numero = nitSinGuion.slice(0, -1);
  const verificadorEsperado = nitSinGuion.slice(-1).toLowerCase();

  let factor = numero.length + 1;
  let total = 0;
  for (const digito of numero) {
    total += Number(digito) * factor;
    factor -= 1;
  }

  const modulo = (11 - (total % 11)) % 11;
  const verificadorCalculado = modulo === 10 ? 'k' : String(modulo);

  return verificadorEsperado === verificadorCalculado;
}

/**
 * "CF" (Consumidor Final) es el identificador que usan las facturas de
 * Guatemala cuando el receptor no proporciona NIT.
 *
 * @param {string} idReceptor
 * @returns {boolean}
 */
export function esConsumidorFinal(idReceptor) {
  return typeof idReceptor === 'string' && idReceptor.trim().toUpperCase() === 'CF';
}
