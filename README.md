# FacturaLab

Simulador de certificador de facturas electrónicas (DTE-FEL, Guatemala). Es una **demo académica**: no hay integración real con SAT, GFACE ni ningún certificador autorizado. El flujo es:

1. En la web armás los datos de la factura (emisor, receptor, items) con un stepper — o le enviás tu propio XML directo a la API.
2. Se valida la estructura y las reglas de negocio (NIT con dígito verificador, total contra la suma de los items, NIT obligatorio si el total supera Q2,500).
3. Se "certifica" (simulación local, sin llamadas de red reales — hay NITs "gatillo" para forzar un rechazo o un timeout, ver más abajo).
4. Se genera el PDF de la factura certificada (con tabla, IVA por línea y código QR).

## Estado del proyecto

MVP funcional. Progreso:

- [x] Scaffold del proyecto (config, estructura de carpetas)
- [x] Lectura y validación del XML de la factura
- [x] Certificación simulada
- [x] Generación del PDF
- [x] API REST (Express)
- [x] Frontend (formulario con stepper)
- [ ] CI (GitHub Actions)
- [ ] Feature para el code review en vivo (historial en memoria)

## Instalación

```bash
npm ci
```

## Desarrollo

```bash
npm run dev
```

Abrí `http://localhost:3000` para usar el formulario, o llamá directo a la API:

```bash
curl -F "factura=@fixtures/factura-valida.xml" http://localhost:3000/api/facturas -o factura.pdf
```

## Validaciones y reglas de negocio

- El XML debe seguir el formato DTE-FEL (`Tipo="FACT"`), con NIT del emisor y del receptor (o `"CF"` en el receptor).
- Los NIT se validan con el dígito verificador real (algoritmo de complemento 11).
- El `GranTotal` debe coincidir con la suma de los items.
- Facturas mayores a Q2,500 no admiten `"CF"` como receptor — requieren NIT real.
- NITs "gatillo" del emisor para probar los distintos resultados de la certificación simulada: `00000000` (rechazo), `99999994` (timeout), cualquier otro NIT válido (éxito).

## Pruebas

```bash
npm test          # corre toda la suite una vez
npm run test:watch
npm run coverage
```

## Calidad de código

```bash
npm run lint
```

## Estructura del proyecto

```
src/
├── app.js                        # configuración de Express (estáticos, rutas, error handler)
├── server.js                     # bootstrap / listen
├── routes/facturas.routes.js     # POST /api/facturas
├── controllers/facturas.controller.js
├── services/
│   ├── xmlReader.js               # parseo y validación del XML (DTE-FEL)
│   ├── nit.js                     # dígito verificador de NIT + excepción "CF"
│   ├── certificadorClient.js      # certificación simulada (éxito/rechazo/timeout)
│   ├── pdfGenerator.js            # generación del PDF certificado
│   └── certificacionService.js    # orquestador: leer -> certificar -> PDF
├── errors/                        # XmlInvalidoError, ArchivoInvalidoError, ErrorCertificacion
└── middlewares/                   # multer (upload.js), errorHandler.js
public/
├── index.html                     # formulario con stepper (Datos -> Vista previa -> Resultado)
└── js/app.js                      # arma el XML, lo valida, lo envía a /api/facturas
tests/
├── unit/          # xmlReader, nit, certificadorClient, pdfGenerator
├── integration/   # certificacionService (flujo completo)
└── e2e/           # app.test.js (Supertest sobre /api/facturas)
fixtures/          # XML de ejemplo para pruebas y demo
```
