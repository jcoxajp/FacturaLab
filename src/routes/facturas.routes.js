import { Router } from 'express';
import { uploadFactura } from '../middlewares/upload.js';
import {
  crearFacturaCertificada,
  obtenerHistorialController,
} from '../controllers/facturas.controller.js';

export const facturasRouter = Router();

facturasRouter.get('/historial', obtenerHistorialController);
facturasRouter.post('/', uploadFactura, crearFacturaCertificada);
