# FacturaLab

Simulador de certificador de facturas electrónicas (DTE-FEL, Guatemala). Es una **demo académica**: no hay integración real con SAT, GFACE ni ningún certificador autorizado. El flujo es:

1. Se sube un XML de factura (formato DTE-FEL, `Tipo="FACT"`).
2. Se valida su estructura y sus datos.
3. Se "certifica" (simulación local, sin llamadas de red reales).
4. Se genera el PDF de la factura certificada.

## Estado del proyecto

En construcción. Progreso:

- [x] Scaffold del proyecto (config, estructura de carpetas)
- [ ] Lectura y validación del XML de la factura
- [ ] Certificación simulada
- [ ] Generación del PDF
- [ ] API REST (Express)
- [ ] Frontend
- [ ] CI (GitHub Actions)

## Instalación

```bash
npm ci
```

## Desarrollo

```bash
npm run dev
```

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
├── app.js                # configuración de Express (middlewares, rutas, estáticos)
├── server.js              # bootstrap / listen
├── routes/                # definición de endpoints
├── controllers/           # capa HTTP: valida entrada, llama servicios, arma la respuesta
├── services/               # lógica de dominio (lectura de XML, certificación simulada, generación de PDF)
├── errors/                 # errores de dominio
└── middlewares/            # multer, manejo de errores
public/                    # frontend estático (HTML + Tailwind CDN + JS vanilla)
tests/
├── unit/
├── integration/
└── e2e/
fixtures/                  # XML de ejemplo para pruebas y demo
```
