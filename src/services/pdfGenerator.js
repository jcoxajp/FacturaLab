import PDFDocument from 'pdfkit';

/**
 * Genera el PDF de la factura ya certificada, a partir de los datos leídos
 * del XML original y los datos devueltos por la certificación simulada.
 *
 * @param {object} datosFactura datos extraídos por leerFacturaXml()
 * @param {object} datosCertificacion datos retornados por certificarDocumento()
 * @returns {Promise<Buffer>} el PDF generado, en memoria
 */
export function generarPdfFactura(datosFactura, datosCertificacion) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'letter', margin: 50, compress: false });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('FACTURA ELECTRÓNICA CERTIFICADA', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Emisor: ${datosFactura.nombreEmisor} (NIT: ${datosFactura.nitEmisor})`);
    doc.text(`Receptor: ${datosFactura.nombreReceptor} (ID: ${datosFactura.idReceptor})`);
    doc.moveDown();

    doc.fontSize(11).text('Detalle:', { underline: true });
    doc.fontSize(9);
    for (const item of datosFactura.items) {
      doc.text(
        `${item.descripcion} - Cant: ${item.cantidad} x Q${item.precioUnitario.toFixed(2)} = Q${item.total.toFixed(2)}`,
      );
    }
    doc.moveDown();

    doc.fontSize(12).text(`TOTAL: Q${datosFactura.granTotal.toFixed(2)}`);
    doc.moveDown();

    doc.fontSize(11).text('Certificación', { underline: true });
    doc.fontSize(9);
    doc.text(`Número de autorización: ${datosCertificacion.numeroAutorizacion}`);
    doc.text(`Serie: ${datosCertificacion.serie}  No. DTE: ${datosCertificacion.numeroDte}`);
    doc.text(`Fecha de certificación: ${datosCertificacion.fechaCertificacion}`);

    doc.end();
  });
}
