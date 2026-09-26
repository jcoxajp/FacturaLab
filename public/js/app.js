// Duplica la validación de NIT de src/services/nit.js: no hay build step que
// comparta código entre el navegador y el servidor, así que se repite aquí
// a propósito (es una función corta y sin dependencias).
function esNitValido(nit) {
  if (!nit || !/^[0-9]+-?[0-9kK]$/.test(nit)) {
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

function esConsumidorFinal(idReceptor) {
  return typeof idReceptor === 'string' && idReceptor.trim().toUpperCase() === 'CF';
}

const LIMITE_CONSUMIDOR_FINAL = 2500;

function escapeXml(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(texto) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Resalta un tag XML completo (incluye < y >) coloreando nombre, atributos y valores,
// igual que el visor de XML nativo del navegador.
function resaltarTag(tagCompleto) {
  const interior = tagCompleto.slice(1, -1);

  if (interior.startsWith('?')) {
    return `<span class="text-slate-500">&lt;${escapeHtml(interior)}&gt;</span>`;
  }

  const esCierre = interior.startsWith('/');
  const esAutocierre = interior.endsWith('/');
  const cuerpo = interior.slice(esCierre ? 1 : 0, esAutocierre ? -1 : undefined);

  const espacioIndex = cuerpo.search(/\s/);
  const nombreTag = espacioIndex === -1 ? cuerpo : cuerpo.slice(0, espacioIndex);
  const atributosTexto = espacioIndex === -1 ? '' : cuerpo.slice(espacioIndex);

  const atributosHtml = atributosTexto.replace(
    /([\w:-]+)(=)("[^"]*")/g,
    (_coincidencia, nombre, igual, valor) =>
      `<span class="text-amber-300">${escapeHtml(nombre)}</span><span class="text-slate-500">${igual}</span><span class="text-emerald-400">${escapeHtml(valor)}</span>`,
  );

  const puntuacion = (texto) => `<span class="text-slate-500">${texto}</span>`;

  return (
    puntuacion('&lt;' + (esCierre ? '/' : '')) +
    `<span class="text-sky-400">${escapeHtml(nombreTag)}</span>` +
    atributosHtml +
    puntuacion((esAutocierre ? '/' : '') + '&gt;')
  );
}

function resaltarXml(xml) {
  const regexTag = /<[^>]+>/g;
  let resultado = '';
  let ultimoIndice = 0;
  let coincidencia;

  while ((coincidencia = regexTag.exec(xml)) !== null) {
    resultado += escapeHtml(xml.slice(ultimoIndice, coincidencia.index));
    resultado += resaltarTag(coincidencia[0]);
    ultimoIndice = regexTag.lastIndex;
  }
  resultado += escapeHtml(xml.slice(ultimoIndice));

  return resultado;
}

// Recorta lo escrito a máximo 2 decimales en tiempo real (cantidad, precio unitario).
// Los campos son type="text": un type="number" descarta el valor completo en
// cuanto se le asigna un string intermedio inválido (ej. "2."), lo que le
// borraba el punto decimal al usuario apenas lo escribía.
function limitarADosDecimales(valor) {
  const coincidencia = valor.match(/^\d*(\.\d{0,2})?/);
  return coincidencia ? coincidencia[0] : valor;
}

function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return fechaIso;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(fecha.getDate())}/${pad(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}

let items = [];
let itemIdSeq = 0;
let xmlGenerado = '';

const el = (id) => document.getElementById(id);
const itemsLista = el('items-lista');
const totalFacturaEl = el('total-factura');
const erroresFormularioEl = el('errores-formulario');

function agregarItem(valores = {}) {
  items.push({
    id: itemIdSeq++,
    descripcion: valores.descripcion ?? '',
    cantidad: valores.cantidad ?? 1,
    precioUnitario: valores.precioUnitario ?? '',
  });
  renderItems();
}

function eliminarItem(id) {
  items = items.filter((item) => item.id !== id);
  if (items.length === 0) {
    agregarItem();
    return;
  }
  renderItems();
}

function actualizarItem(id, campo, valor) {
  const item = items.find((i) => i.id === id);
  if (item) {
    item[campo] = valor;
  }
  renderTotales();
}

function calcularTotal() {
  return items.reduce((suma, item) => suma + Number(item.cantidad) * Number(item.precioUnitario), 0);
}

function renderTotales() {
  totalFacturaEl.textContent = calcularTotal().toFixed(2);
  for (const item of items) {
    const subtotalEl = document.querySelector(`[data-subtotal="${item.id}"]`);
    if (subtotalEl) {
      subtotalEl.textContent = (Number(item.cantidad) * Number(item.precioUnitario)).toFixed(2);
    }
  }
}

function renderItems() {
  itemsLista.innerHTML = items
    .map(
      (item) => `
    <div class="grid grid-cols-12 gap-2 items-center" data-item="${item.id}">
      <input type="text" class="col-span-5 border rounded px-2 py-1 text-sm" placeholder="Descripción"
        value="${escapeXml(item.descripcion)}" data-campo="descripcion" />
      <input type="text" inputmode="decimal" class="col-span-2 border rounded px-2 py-1 text-sm" placeholder="Cant."
        value="${item.cantidad}" data-campo="cantidad" data-decimal="true" />
      <div class="col-span-2 flex items-center border rounded overflow-hidden">
        <span class="px-2 text-slate-400 text-sm bg-slate-50">Q</span>
        <input type="text" inputmode="decimal" class="w-full px-2 py-1 text-sm border-0 focus:ring-0" placeholder="0.00"
          value="${item.precioUnitario}" data-campo="precioUnitario" data-decimal="true" />
      </div>
      <span class="col-span-2 text-sm text-right">Q<span data-subtotal="${item.id}">0.00</span></span>
      <button type="button" class="col-span-1 text-red-500 hover:text-red-700" data-eliminar="${item.id}">✕</button>
    </div>`,
    )
    .join('');

  for (const fila of itemsLista.querySelectorAll('[data-item]')) {
    const id = Number(fila.dataset.item);
    for (const input of fila.querySelectorAll('[data-campo]')) {
      input.addEventListener('input', () => {
        if (input.dataset.decimal) {
          input.value = limitarADosDecimales(input.value);
        }
        actualizarItem(id, input.dataset.campo, input.value);
      });
    }
    fila.querySelector('[data-eliminar]').addEventListener('click', () => eliminarItem(id));
  }

  renderTotales();
}

function irAPaso(numero) {
  el('paso-datos').hidden = numero !== 1;
  el('paso-preview').hidden = numero !== 2;
  el('paso-resultado').hidden = numero !== 3;

  for (const circulo of document.querySelectorAll('.paso-circulo')) {
    const paso = Number(circulo.closest('[data-step]').dataset.step);
    const activo = paso <= numero;
    circulo.classList.toggle('bg-indigo-600', activo);
    circulo.classList.toggle('text-white', activo);
    circulo.classList.toggle('bg-slate-300', !activo);
    circulo.classList.toggle('text-slate-600', !activo);
  }
}

function validarFormulario() {
  const errores = [];
  const nitEmisor = el('emisor-nit').value.trim();
  const nombreEmisor = el('emisor-nombre').value.trim();
  const nombreReceptor = el('receptor-nombre').value.trim();
  const esCf = el('receptor-cf').checked;
  const nitReceptor = esCf ? 'CF' : el('receptor-nit').value.trim();

  if (!nombreEmisor) errores.push('Falta el nombre del emisor.');
  if (!esNitValido(nitEmisor)) errores.push('El NIT del emisor no es válido.');
  if (!nombreReceptor) errores.push('Falta el nombre del receptor.');
  if (!esConsumidorFinal(nitReceptor) && !esNitValido(nitReceptor)) {
    errores.push('El NIT del receptor no es válido (o marcá la casilla "CF").');
  }
  if (items.length === 0) errores.push('Agregá al menos un item.');
  for (const item of items) {
    if (!item.descripcion.trim()) errores.push('Hay un item sin descripción.');
    if (!(Number(item.cantidad) > 0)) errores.push(`Cantidad inválida en "${item.descripcion || 'item'}".`);
    if (!(Number(item.precioUnitario) > 0)) errores.push(`Precio unitario inválido en "${item.descripcion || 'item'}".`);
  }
  if (calcularTotal() > LIMITE_CONSUMIDOR_FINAL && esConsumidorFinal(nitReceptor)) {
    errores.push(`Las facturas mayores a Q${LIMITE_CONSUMIDOR_FINAL} requieren el NIT del receptor (no se admite "CF").`);
  }

  const direccion = el('receptor-direccion').value.trim();

  return { errores, nitEmisor, nombreEmisor, nombreReceptor, nitReceptor, direccion };
}

function construirXml({ nitEmisor, nombreEmisor, nombreReceptor, nitReceptor, direccion }) {
  const total = calcularTotal().toFixed(2);
  const fecha = new Date().toISOString().replace(/\.\d{3}Z$/, '-06:00');

  const itemsXml = items
    .map((item, indice) => {
      const subtotal = (Number(item.cantidad) * Number(item.precioUnitario)).toFixed(2);
      return `    <dte:Item BienOServicio="B" NumeroLinea="${indice + 1}">
      <dte:Cantidad>${Number(item.cantidad).toFixed(2)}</dte:Cantidad>
      <dte:UnidadMedida>UNI</dte:UnidadMedida>
      <dte:Descripcion>${escapeXml(item.descripcion)}</dte:Descripcion>
      <dte:PrecioUnitario>${Number(item.precioUnitario).toFixed(2)}</dte:PrecioUnitario>
      <dte:Precio>${subtotal}</dte:Precio>
      <dte:Descuento>0.00</dte:Descuento>
      <dte:Total>${subtotal}</dte:Total>
    </dte:Item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTDocumento Version="0.1" xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0">
<dte:SAT ClaseDocumento="dte">
<dte:DTE ID="DatosCertificados">
<dte:DatosEmision ID="DatosEmision">
<dte:DatosGenerales CodigoMoneda="GTQ" FechaHoraEmision="${fecha}" Tipo="FACT"/>
<dte:Emisor NITEmisor="${escapeXml(nitEmisor)}" NombreEmisor="${escapeXml(nombreEmisor)}">
</dte:Emisor>
<dte:Receptor IDReceptor="${escapeXml(nitReceptor)}" NombreReceptor="${escapeXml(nombreReceptor)}">
<dte:DireccionReceptor>
<dte:Direccion>${escapeXml(direccion)}</dte:Direccion>
</dte:DireccionReceptor>
</dte:Receptor>
<dte:Items>
${itemsXml}
</dte:Items>
<dte:Totales>
<dte:GranTotal>${total}</dte:GranTotal>
</dte:Totales>
</dte:DatosEmision>
</dte:DTE>
</dte:SAT>
</dte:GTDocumento>`;
}

function mostrarErroresFormulario(errores) {
  if (errores.length === 0) {
    erroresFormularioEl.hidden = true;
    erroresFormularioEl.textContent = '';
    return;
  }
  erroresFormularioEl.hidden = false;
  erroresFormularioEl.textContent = errores.join('\n');
}

async function enviarACertificar() {
  el('resultado-cargando').hidden = false;
  el('resultado-exito').hidden = true;
  el('resultado-error').hidden = true;

  const archivo = new Blob([xmlGenerado], { type: 'application/xml' });
  const formData = new FormData();
  formData.append('factura', archivo, 'factura.xml');

  try {
    const respuesta = await fetch('/api/facturas', { method: 'POST', body: formData });

    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      throw new Error(cuerpo.error || `Error HTTP ${respuesta.status}`);
    }

    const pdfBlob = await respuesta.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const fechaCertificacion = respuesta.headers.get('x-fecha-certificacion');

    el('res-autorizacion').textContent = respuesta.headers.get('x-numero-autorizacion') || '—';
    el('res-serie').textContent = respuesta.headers.get('x-serie') || '—';
    el('res-dte').textContent = respuesta.headers.get('x-numero-dte') || '—';
    el('res-fecha').textContent = fechaCertificacion ? formatearFecha(fechaCertificacion) : '—';
    el('res-pdf-embed').src = pdfUrl;
    el('res-pdf-descarga').href = pdfUrl;

    el('resultado-cargando').hidden = true;
    el('resultado-exito').hidden = false;
  } catch (error) {
    el('res-error-mensaje').textContent = error.message;
    el('resultado-cargando').hidden = true;
    el('resultado-error').hidden = false;
  }
}

function limpiarFormulario() {
  el('emisor-nit').value = '12345679';
  el('emisor-nombre').value = 'DISTRIBUIDORA DEMO';
  el('receptor-nombre').value = '';
  el('receptor-nit').value = '';
  el('receptor-nit').disabled = false;
  el('receptor-cf').checked = false;
  el('receptor-direccion').value = 'Ciudad';
  items = [];
  agregarItem();
  mostrarErroresFormulario([]);
}

el('btn-agregar-item').addEventListener('click', () => agregarItem());

el('receptor-cf').addEventListener('change', (evento) => {
  el('receptor-nit').disabled = evento.target.checked;
  if (evento.target.checked) el('receptor-nit').value = '';
});

el('btn-limpiar').addEventListener('click', limpiarFormulario);

el('btn-ejemplo').addEventListener('click', () => {
  el('receptor-nombre').value = 'PRODUCTOR EJEMPLO';
  el('receptor-nit').value = '12521337';
  el('receptor-cf').checked = false;
  el('receptor-nit').disabled = false;
  items = [];
  agregarItem({ descripcion: 'Producto Demo A', cantidad: 2, precioUnitario: 50 });
  agregarItem({ descripcion: 'Producto Demo B', cantidad: 1, precioUnitario: 100 });
});

el('btn-vista-previa').addEventListener('click', () => {
  const { errores, ...datos } = validarFormulario();
  mostrarErroresFormulario(errores);
  if (errores.length > 0) return;

  xmlGenerado = construirXml(datos);
  el('xml-preview').innerHTML = resaltarXml(xmlGenerado);
  irAPaso(2);
});

el('btn-volver-editar').addEventListener('click', () => irAPaso(1));
el('btn-nueva-factura').addEventListener('click', () => {
  limpiarFormulario();
  irAPaso(1);
});

el('btn-certificar').addEventListener('click', () => {
  irAPaso(3);
  enviarACertificar();
});

agregarItem();
irAPaso(1);
