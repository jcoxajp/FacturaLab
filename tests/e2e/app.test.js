import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app.js';

describe('GET /api/health', () => {
  it('responde 200 con estado ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/facturas', () => {
  it('certifica una factura válida y devuelve el PDF', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .attach('factura', 'fixtures/factura-valida.xml');

    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('responde 400 si no se adjunta ningún archivo', async () => {
    const res = await request(app).post('/api/facturas');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/adjuntar/);
  });

  it('responde 400 si el archivo no es un XML', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .attach('factura', Buffer.from('esto no es un xml'), 'factura.txt');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/XML/);
  });

  it('responde 400 si el XML no pasa las validaciones de dominio', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .attach('factura', 'fixtures/factura-sin-nit-emisor.xml');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/NIT/);
  });

  it('responde 422 si el certificador rechaza la factura', async () => {
    const res = await request(app)
      .post('/api/facturas')
      .attach('factura', 'fixtures/factura-trigger-rechazo.xml');

    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/no autorizado/);
  });

  it('responde 400 si el archivo excede el tamaño máximo permitido', async () => {
    const xmlGigante = Buffer.from('<Factura>'.padEnd(2 * 1024 * 1024, ' ') + '</Factura>');

    const res = await request(app)
      .post('/api/facturas')
      .attach('factura', xmlGigante, 'factura-gigante.xml');

    expect(res.status).toBe(400);
  });
});
