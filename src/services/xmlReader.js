import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { XmlInvalidoError } from '../errors/XmlInvalidoError.js';
import { esConsumidorFinal, esNitValido } from './nit.js';

const TOLERANCIA_TOTAL = 0.01;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  parseAttributeValue: false,
});

function esNumeroValido(valor) {
  return typeof valor === 'number' && Number.isFinite(valor);
}

function normalizarItems(itemsNode) {
  if (!itemsNode || !itemsNode.Item) {
    return [];
  }
  const items = Array.isArray(itemsNode.Item) ? itemsNode.Item : [itemsNode.Item];
  return items.map((item) => ({
    descripcion: item.Descripcion ?? '',
    cantidad: item.Cantidad,
    precioUnitario: item.PrecioUnitario,
    descuento: item.Descuento ?? 0,
    total: item.Total,
  }));
}

/**
 * Lee y valida un XML de factura electrónica (DTE-FEL, Tipo="FACT") y extrae
 * los datos necesarios para el proceso de certificación.
 *
 * @param {string} xmlString contenido del XML como texto
 * @returns {object} datos de la factura (emisor, receptor, items, gran total)
 * @throws {XmlInvalidoError} si el XML está mal formado o le faltan campos obligatorios
 */
export function leerFacturaXml(xmlString) {
  const validacion = XMLValidator.validate(xmlString);
  if (validacion !== true) {
    throw new XmlInvalidoError(`XML mal formado: ${validacion.err.msg}`);
  }

  const documento = parser.parse(xmlString);
  const datosEmision = documento?.GTDocumento?.SAT?.DTE?.DatosEmision;

  if (!datosEmision) {
    throw new XmlInvalidoError(
      'El XML no contiene los campos obligatorios de una factura DTE-FEL (DatosEmision)',
    );
  }

  const { DatosGenerales: datosGenerales, Emisor: emisor, Receptor: receptor, Items: items, Totales: totales } =
    datosEmision;

  if (!emisor || !receptor || !totales) {
    throw new XmlInvalidoError(
      'El XML no contiene los campos obligatorios (Emisor, Receptor, Totales)',
    );
  }

  const nitEmisor = emisor.NITEmisor;
  const idReceptor = receptor.IDReceptor;

  if (!nitEmisor || !idReceptor) {
    throw new XmlInvalidoError('NIT del emisor o ID del receptor no encontrado');
  }

  if (!esNitValido(nitEmisor)) {
    throw new XmlInvalidoError(`NIT del emisor inválido: ${nitEmisor}`);
  }

  if (!esConsumidorFinal(idReceptor) && !esNitValido(idReceptor)) {
    throw new XmlInvalidoError(`NIT del receptor inválido: ${idReceptor}`);
  }

  const itemsFactura = normalizarItems(items);
  if (itemsFactura.length === 0) {
    throw new XmlInvalidoError('La factura debe contener al menos un item');
  }

  for (const item of itemsFactura) {
    if (!esNumeroValido(item.cantidad) || item.cantidad <= 0) {
      throw new XmlInvalidoError(`Cantidad inválida para el item "${item.descripcion}"`);
    }
    if (!esNumeroValido(item.precioUnitario) || item.precioUnitario <= 0) {
      throw new XmlInvalidoError(`Precio unitario inválido para el item "${item.descripcion}"`);
    }
    if (!esNumeroValido(item.total)) {
      throw new XmlInvalidoError(`Total inválido para el item "${item.descripcion}"`);
    }
  }

  const granTotal = totales.GranTotal;
  if (!esNumeroValido(granTotal)) {
    throw new XmlInvalidoError('El campo GranTotal no es un valor numérico válido');
  }

  const sumaItems = itemsFactura.reduce((acumulado, item) => acumulado + item.total, 0);
  if (Math.abs(sumaItems - granTotal) > TOLERANCIA_TOTAL) {
    throw new XmlInvalidoError(
      `El GranTotal (${granTotal}) no coincide con la suma de los items (${sumaItems.toFixed(2)})`,
    );
  }

  return {
    tipo: datosGenerales?.Tipo ?? '',
    fechaHoraEmision: datosGenerales?.FechaHoraEmision ?? '',
    moneda: datosGenerales?.CodigoMoneda ?? '',
    nitEmisor,
    nombreEmisor: emisor.NombreEmisor ?? '',
    nombreComercialEmisor: emisor.NombreComercial ?? '',
    idReceptor,
    nombreReceptor: receptor.NombreReceptor ?? '',
    items: itemsFactura,
    granTotal,
  };
}
