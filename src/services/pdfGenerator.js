import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const TASA_IVA = 0.12;

const COLOR_PRIMARIO = '#4F46E5';
const COLOR_TEXTO = '#1E293B';
const COLOR_TEXTO_SUAVE = '#64748B';
const COLOR_BORDE = '#CBD5E1';
const COLOR_FONDO_ENCABEZADO = '#EEF2FF';

const MARGEN = 50;
const COLUMNAS = [
  { titulo: 'No.', ancho: 25, alinear: 'center' },
  { titulo: 'Descripción', ancho: 165, alinear: 'left' },
  { titulo: 'Cantidad', ancho: 50, alinear: 'right' },
  { titulo: 'P. Unitario (Q)', ancho: 75, alinear: 'right' },
  { titulo: 'Descuento (Q)', ancho: 70, alinear: 'right' },
  { titulo: 'Total (Q)', ancho: 65, alinear: 'right' },
  { titulo: 'IVA (Q)', ancho: 62, alinear: 'right' },
];
const ANCHO_TABLA = COLUMNAS.reduce((suma, columna) => suma + columna.ancho, 0);
const ALTO_FILA = 20;

const formateadorMoneda = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatearMoneda(numero) {
  return formateadorMoneda.format(numero);
}

// Duplica el formato de fecha del frontend (public/js/app.js) por la misma
// razón: no hay build step que comparta código entre navegador y servidor.
function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}

function ivaIncluidoEn(monto) {
  return (monto / (1 + TASA_IVA)) * TASA_IVA;
}

function dibujarFilaTabla(doc, x, y, valores, opciones = {}) {
  const { negrita = false, colorFondo = null, colorTexto = COLOR_TEXTO } = opciones;

  if (colorFondo) {
    doc.rect(x, y, ANCHO_TABLA, ALTO_FILA).fill(colorFondo);
  }

  doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(8).fillColor(colorTexto);

  let cursorX = x;
  COLUMNAS.forEach((columna, indice) => {
    doc.text(valores[indice] ?? '', cursorX + 3, y + 6, {
      width: columna.ancho - 6,
      align: columna.alinear,
    });
    cursorX += columna.ancho;
  });
}

function dibujarTablaItems(doc, x, yInicio, items) {
  let y = yInicio;

  dibujarFilaTabla(
    doc,
    x,
    y,
    COLUMNAS.map((columna) => columna.titulo),
    { negrita: true, colorFondo: COLOR_FONDO_ENCABEZADO, colorTexto: COLOR_PRIMARIO },
  );
  y += ALTO_FILA;

  let totalDescuento = 0;
  let totalIva = 0;
  let granTotal = 0;

  items.forEach((item, indice) => {
    const iva = ivaIncluidoEn(item.total);
    totalDescuento += item.descuento || 0;
    totalIva += iva;
    granTotal += item.total;

    dibujarFilaTabla(doc, x, y, [
      String(indice + 1),
      item.descripcion,
      item.cantidad.toFixed(2),
      formatearMoneda(item.precioUnitario),
      formatearMoneda(item.descuento || 0),
      formatearMoneda(item.total),
      formatearMoneda(iva),
    ]);
    y += ALTO_FILA;
  });

  dibujarFilaTabla(
    doc,
    x,
    y,
    ['', '', '', '', formatearMoneda(totalDescuento), formatearMoneda(granTotal), formatearMoneda(totalIva)],
    { negrita: true },
  );
  y += ALTO_FILA;

  doc.strokeColor(COLOR_BORDE).lineWidth(0.5);
  doc.rect(x, yInicio, ANCHO_TABLA, y - yInicio).stroke();
  for (let fila = 1; fila <= items.length + 1; fila += 1) {
    const yLinea = yInicio + fila * ALTO_FILA;
    doc.moveTo(x, yLinea).lineTo(x + ANCHO_TABLA, yLinea).stroke();
  }
  let xLinea = x;
  for (const columna of COLUMNAS) {
    xLinea += columna.ancho;
    doc.moveTo(xLinea, yInicio).lineTo(xLinea, y).stroke();
  }

  return y;
}

/**
 * Genera el PDF de la factura ya certificada, a partir de los datos leídos
 * del XML original y los datos devueltos por la certificación simulada.
 *
 * @param {object} datosFactura datos extraídos por leerFacturaXml()
 * @param {object} datosCertificacion datos retornados por certificarDocumento()
 * @returns {Promise<Buffer>} el PDF generado, en memoria
 */
export async function generarPdfFactura(datosFactura, datosCertificacion) {
  const datosQr = JSON.stringify({
    autorizacion: datosCertificacion.numeroAutorizacion,
    nitEmisor: datosFactura.nitEmisor,
    total: datosFactura.granTotal,
  });
  const qrBuffer = await QRCode.toBuffer(datosQr, { width: 100, margin: 1 });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'letter', margin: MARGEN, compress: false });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const anchoPagina = doc.page.width - MARGEN * 2;
    const columnaIzquierda = MARGEN;
    const columnaDerecha = MARGEN + anchoPagina / 2 + 10;

    doc.fillColor(COLOR_PRIMARIO).font('Helvetica-Bold').fontSize(18).text('FACTURA ELECTRÓNICA CERTIFICADA', {
      align: 'center',
    });
    doc.moveDown(0.3);
    doc
      .strokeColor(COLOR_PRIMARIO)
      .lineWidth(2)
      .moveTo(MARGEN, doc.y)
      .lineTo(doc.page.width - MARGEN, doc.y)
      .stroke();
    doc.moveDown(0.8);

    const yInfo = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(COLOR_TEXTO);
    doc.text('Emisor', columnaIzquierda, yInfo);
    doc.font('Helvetica').fontSize(9);
    doc.text(datosFactura.nombreEmisor, columnaIzquierda, doc.y);
    doc.text(`NIT: ${datosFactura.nitEmisor}`, columnaIzquierda, doc.y);
    if (datosFactura.nombreComercialEmisor) {
      doc.text(`Nombre comercial: ${datosFactura.nombreComercialEmisor}`, columnaIzquierda, doc.y);
    }
    if (datosFactura.direccionEmisor) {
      doc.text(`Dirección: ${datosFactura.direccionEmisor}`, columnaIzquierda, doc.y);
    }
    const yFinEmisor = doc.y;

    doc.font('Helvetica-Bold').fontSize(9).text('Número de autorización', columnaDerecha, yInfo);
    doc.font('Helvetica').fontSize(8);
    doc.text(datosCertificacion.numeroAutorizacion, columnaDerecha, doc.y);
    doc.text(`Serie: ${datosCertificacion.serie}   No. DTE: ${datosCertificacion.numeroDte}`, columnaDerecha, doc.y);
    doc.text(`Emisión: ${formatearFecha(datosFactura.fechaHoraEmision)}`, columnaDerecha, doc.y);
    doc.text(`Certificación: ${formatearFecha(datosCertificacion.fechaCertificacion)}`, columnaDerecha, doc.y);
    doc.text(`Moneda: ${datosFactura.moneda || 'GTQ'}`, columnaDerecha, doc.y);
    const yFinAutorizacion = doc.y;

    // Altura real de la columna más alta (no un colchón fijo, que dejaba un
    // espacio muerto grande cuando el bloque de la derecha era más corto).
    doc.y = Math.max(yFinEmisor, yFinAutorizacion);
    doc.moveDown(0.6);

    const yReceptor = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).text('Receptor', columnaIzquierda, yReceptor);
    doc.font('Helvetica').fontSize(9);
    doc.text(datosFactura.nombreReceptor, columnaIzquierda, doc.y);
    doc.text(`NIT/ID: ${datosFactura.idReceptor}`, columnaIzquierda, doc.y);
    if (datosFactura.direccionReceptor) {
      doc.text(`Dirección: ${datosFactura.direccionReceptor}`, columnaIzquierda, doc.y);
    }
    doc.moveDown(0.8);

    const yTabla = doc.y;
    const yDespuesTabla = dibujarTablaItems(doc, MARGEN, yTabla, datosFactura.items);
    doc.y = yDespuesTabla;
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(7).fillColor(COLOR_TEXTO_SUAVE);
    doc.text('* Sujeto a pagos trimestrales ISR', columnaIzquierda, doc.y);
    doc.moveDown(0.8);

    const yCertificador = doc.y;
    doc.rect(columnaIzquierda, yCertificador, ANCHO_TABLA, 28).strokeColor(COLOR_BORDE).lineWidth(0.5).stroke();
    doc.font('Helvetica-Bold').fontSize(8).fillColor(COLOR_TEXTO);
    doc.text('Datos del certificador', columnaIzquierda + 6, yCertificador + 5);
    doc.font('Helvetica').fontSize(8);
    doc.text(
      `${datosCertificacion.certificadorNombre}   NIT: ${datosCertificacion.certificadorNit}`,
      columnaIzquierda + 6,
      yCertificador + 16,
    );

    const yQr = yCertificador + 28 + 15;
    doc.image(qrBuffer, columnaIzquierda, yQr, { width: 70, height: 70 });
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(COLOR_TEXTO_SUAVE)
      .text('Verificación (simulada)', columnaIzquierda, yQr + 72, { width: 70, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(COLOR_TEXTO_SUAVE)
      .text('Documento sin validez fiscal — simulación académica', columnaIzquierda, doc.page.height - MARGEN - 10, {
        width: ANCHO_TABLA,
        align: 'right',
      });

    doc.end();
  });
}
