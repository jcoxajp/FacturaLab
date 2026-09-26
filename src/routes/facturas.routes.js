import { Router } from 'express';
import { uploadFactura } from '../middlewares/upload.js';
import { crearFacturaCertificada } from '../controllers/facturas.controller.js';

export const facturasRouter = Router();

facturasRouter.post('/', uploadFactura, crearFacturaCertificada);
