import { describe, expect, it } from 'vitest';
import { generarPdfFactura } from '../../src/services/pdfGenerator.js';

const datosFactura = {
  nombreEmisor: 'DEMO SOCIEDAD ANONIMA',
  nitEmisor: '12345679',
  nombreComercialEmisor: 'DISTRIBUIDORA DEMO',
  direccionEmisor: 'AVENIDA LA BRIGADA',
  fechaHoraEmision: '2026-09-25T20:00:00-06:00',
  moneda: 'GTQ',
  nombreReceptor: 'PRODUCTOR EJEMPLO',
  idReceptor: '12521337',
  direccionReceptor: 'CIUDAD',
  items: [
    { descripcion: 'Producto Demo A', cantidad: 2, precioUnitario: 50, descuento: 0, total: 100 },
    { descripcion: 'Producto Demo B', cantidad: 1, precioUnitario: 100, descuento: 0, total: 100 },
  ],
  granTotal: 200,
};

const datosCertificacion = {
  numeroAutorizacion: '6AA71005-35E2-46DC-90C7-1DA5633A40B0',
  serie: '6AA71005',
  numeroDte: '904021724',
  fechaCertificacion: '2026-09-25T19:56:38.000Z',
  certificadorNombre: 'FacturaLab S.A.',
  certificadorNit: '567890120',
};

// pdfkit codifica el texto como hex dentro de arreglos "[...] TJ"; para poder
// verificar el contenido real del PDF hay que decodificar esos hex strings.
function extraerTextoPlano(buffer) {
  const contenido = buffer.toString('latin1');
  const operaciones = contenido.match(/\[(?:\s*(?:<[0-9A-Fa-f]+>|-?\d+(?:\.\d+)?))+\s*\]\s*TJ/g) || [];
  return operaciones
    .map((operacion) => {
      const tokens = operacion.match(/<[0-9A-Fa-f]+>/g) || [];
      return tokens.map((hex) => Buffer.from(hex.slice(1, -1), 'hex').toString('latin1')).join('');
    })
    .join(' ');
}

describe('generarPdfFactura', () => {
  it('genera un PDF válido (encabezado %PDF-)', async () => {
    const pdf = await generarPdfFactura(datosFactura, datosCertificacion);

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(0);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('incluye los datos de la factura, el detalle de items y el IVA calculado', async () => {
    const pdf = await generarPdfFactura(datosFactura, datosCertificacion);
    const texto = extraerTextoPlano(pdf);

    expect(texto).toContain('DEMO SOCIEDAD ANONIMA');
    expect(texto).toContain('12345679');
    expect(texto).toContain('AVENIDA LA BRIGADA');
    expect(texto).toContain('PRODUCTOR EJEMPLO');
    expect(texto).toContain('CIUDAD');
    expect(texto).toContain('Producto Demo A');
    expect(texto).toContain('Producto Demo B');
    expect(texto).toContain('200.00');
    // IVA de un item de Q100 (incluido, tasa 12%) = 100 / 1.12 * 0.12 = 10.71
    expect(texto).toContain('10.71');
  });

  it('incluye los datos de la certificación y del certificador', async () => {
    const pdf = await generarPdfFactura(datosFactura, datosCertificacion);
    const texto = extraerTextoPlano(pdf);

    expect(texto).toContain('6AA71005-35E2-46DC-90C7-1DA5633A40B0');
    expect(texto).toContain('904021724');
    expect(texto).toContain('FacturaLab S.A.');
    expect(texto).toContain('567890120');
  });

  it('incluye el aviso de que el documento no tiene validez fiscal', async () => {
    const pdf = await generarPdfFactura(datosFactura, datosCertificacion);
    const texto = extraerTextoPlano(pdf);

    expect(texto).toContain('sin validez fiscal');
  });
});
