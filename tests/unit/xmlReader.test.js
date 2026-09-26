import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { leerFacturaXml } from '../../src/services/xmlReader.js';
import { XmlInvalidoError } from '../../src/errors/XmlInvalidoError.js';

const FACTURA_VALIDA = readFileSync('fixtures/factura-valida.xml', 'utf-8');
const FACTURA_SIN_NIT_EMISOR = readFileSync('fixtures/factura-sin-nit-emisor.xml', 'utf-8');

const XML_MAL_FORMADO = '<dte:GTDocumento><dte:SAT></dte:GTDocumento>';

const XML_SIN_DATOS_EMISION = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE></dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_SIN_TOTALES = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_SIN_ITEMS = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
        <dte:Totales><dte:GranTotal>100.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_TOTAL_NO_NUMERICO = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>1</dte:Cantidad>
            <dte:PrecioUnitario>100.00</dte:PrecioUnitario>
            <dte:Total>100.00</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>NO_ES_UN_NUMERO</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_TOTAL_NO_COINCIDE = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>1</dte:Cantidad>
            <dte:PrecioUnitario>100.00</dte:PrecioUnitario>
            <dte:Total>100.00</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>999.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_CANTIDAD_INVALIDA = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>0</dte:Cantidad>
            <dte:PrecioUnitario>100.00</dte:PrecioUnitario>
            <dte:Total>0.00</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>0.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_PRECIO_INVALIDO = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>1</dte:Cantidad>
            <dte:PrecioUnitario>0</dte:PrecioUnitario>
            <dte:Total>0.00</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>0.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_NIT_EMISOR_INVALIDO = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345678" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>1</dte:Cantidad>
            <dte:PrecioUnitario>100.00</dte:PrecioUnitario>
            <dte:Total>100.00</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>100.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_NIT_RECEPTOR_INVALIDO = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="87654321" NombreReceptor="Receptor Demo"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>1</dte:Cantidad>
            <dte:PrecioUnitario>100.00</dte:PrecioUnitario>
            <dte:Total>100.00</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>100.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_RECEPTOR_CONSUMIDOR_FINAL = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="CF" NombreReceptor="Consumidor Final"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>1</dte:Cantidad>
            <dte:PrecioUnitario>100.00</dte:PrecioUnitario>
            <dte:Total>100.00</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>100.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

const XML_ITEM_TOTAL_INVALIDO = `<?xml version="1.0"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
  <dte:SAT>
    <dte:DTE>
      <dte:DatosEmision>
        <dte:Emisor NITEmisor="12345679" NombreEmisor="Emisor Demo"/>
        <dte:Receptor IDReceptor="12521337" NombreReceptor="Receptor Demo"/>
        <dte:Items>
          <dte:Item>
            <dte:Descripcion>Producto A</dte:Descripcion>
            <dte:Cantidad>1</dte:Cantidad>
            <dte:PrecioUnitario>100.00</dte:PrecioUnitario>
            <dte:Total>NO_ES_UN_NUMERO</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales><dte:GranTotal>100.00</dte:GranTotal></dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
  </dte:SAT>
</dte:GTDocumento>`;

describe('leerFacturaXml', () => {
  it('extrae los datos correctos de una factura válida', () => {
    const datos = leerFacturaXml(FACTURA_VALIDA);

    expect(datos.tipo).toBe('FACT');
    expect(datos.nitEmisor).toBe('12345679');
    expect(datos.nombreEmisor).toBe('DEMO SOCIEDAD ANONIMA');
    expect(datos.idReceptor).toBe('12521337');
    expect(datos.nombreReceptor).toBe('PRODUCTOR EJEMPLO');
    expect(datos.items).toHaveLength(2);
    expect(datos.items[0]).toMatchObject({
      descripcion: 'Producto Demo A',
      cantidad: 2,
      precioUnitario: 50,
      total: 100,
    });
    expect(datos.granTotal).toBe(200);
  });

  it('lanza XmlInvalidoError si el XML está mal formado', () => {
    expect(() => leerFacturaXml(XML_MAL_FORMADO)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_MAL_FORMADO)).toThrow(/mal formado/);
  });

  it('lanza XmlInvalidoError si falta el NIT del emisor', () => {
    expect(() => leerFacturaXml(FACTURA_SIN_NIT_EMISOR)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(FACTURA_SIN_NIT_EMISOR)).toThrow(/NIT/);
  });

  it('lanza XmlInvalidoError si faltan los Totales', () => {
    expect(() => leerFacturaXml(XML_SIN_TOTALES)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_SIN_TOTALES)).toThrow(/campos obligatorios/);
  });

  it('lanza XmlInvalidoError si no hay items', () => {
    expect(() => leerFacturaXml(XML_SIN_ITEMS)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_SIN_ITEMS)).toThrow(/al menos un item/);
  });

  it('lanza XmlInvalidoError si el GranTotal no es numérico', () => {
    expect(() => leerFacturaXml(XML_TOTAL_NO_NUMERICO)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_TOTAL_NO_NUMERICO)).toThrow(/numérico/);
  });

  it('lanza XmlInvalidoError si el GranTotal no coincide con la suma de los items', () => {
    expect(() => leerFacturaXml(XML_TOTAL_NO_COINCIDE)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_TOTAL_NO_COINCIDE)).toThrow(/no coincide/);
  });

  it('lanza XmlInvalidoError si un item tiene cantidad inválida', () => {
    expect(() => leerFacturaXml(XML_CANTIDAD_INVALIDA)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_CANTIDAD_INVALIDA)).toThrow(/Cantidad inválida/);
  });

  it('lanza XmlInvalidoError si falta la sección DatosEmision', () => {
    expect(() => leerFacturaXml(XML_SIN_DATOS_EMISION)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_SIN_DATOS_EMISION)).toThrow(/campos obligatorios/);
  });

  it('lanza XmlInvalidoError si un item tiene precio unitario inválido', () => {
    expect(() => leerFacturaXml(XML_PRECIO_INVALIDO)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_PRECIO_INVALIDO)).toThrow(/Precio unitario inválido/);
  });

  it('lanza XmlInvalidoError si el total de un item no es numérico', () => {
    expect(() => leerFacturaXml(XML_ITEM_TOTAL_INVALIDO)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_ITEM_TOTAL_INVALIDO)).toThrow(/Total inválido/);
  });

  it('lanza XmlInvalidoError si el NIT del emisor no pasa el dígito verificador', () => {
    expect(() => leerFacturaXml(XML_NIT_EMISOR_INVALIDO)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_NIT_EMISOR_INVALIDO)).toThrow(/NIT del emisor inválido/);
  });

  it('lanza XmlInvalidoError si el NIT del receptor no pasa el dígito verificador', () => {
    expect(() => leerFacturaXml(XML_NIT_RECEPTOR_INVALIDO)).toThrow(XmlInvalidoError);
    expect(() => leerFacturaXml(XML_NIT_RECEPTOR_INVALIDO)).toThrow(/NIT del receptor inválido/);
  });

  it('acepta "CF" como receptor (consumidor final, sin NIT)', () => {
    const datos = leerFacturaXml(XML_RECEPTOR_CONSUMIDOR_FINAL);
    expect(datos.idReceptor).toBe('CF');
  });
});
