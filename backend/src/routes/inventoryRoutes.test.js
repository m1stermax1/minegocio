import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/sheetsService.js', () => ({
  getInventoryData: vi.fn(),
  getProvidersData: vi.fn(),
  setInventoryRowStatus: vi.fn(),
  appendInventoryItems: vi.fn(),
}));

import inventoryRoutes from './inventoryRoutes.js';
import {
  getInventoryData,
  getProvidersData,
  setInventoryRowStatus,
  appendInventoryItems,
} from '../services/sheetsService.js';

const app = express();
app.use(express.json());
app.use('/inventory', inventoryRoutes);

describe('inventoryRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns inventory data from GET /inventory', async () => {
    getInventoryData.mockResolvedValue([
      {
        id: 0,
        codigo: '123',
        descripcion: 'Producto A',
        precio: '100',
        proveedora: 'Proveedor X',
        estado: 'en stock',
      },
    ]);

    const response = await request(app).get('/inventory');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 0,
        codigo: '123',
        descripcion: 'Producto A',
        precio: '100',
        proveedora: 'Proveedor X',
        estado: 'en stock',
      },
    ]);
    expect(getInventoryData).toHaveBeenCalledOnce();
  });

  it('returns provider items from GET /inventory/providers', async () => {
    getProvidersData.mockResolvedValue([
      {
        id: 0,
        codigo: 'ABC123',
        descripcion: 'Producto A',
        precio: '100',
        nombre: 'Proveedor X',
        ganancia: '25%',
        estado: 'en stock',
        pago: 'pagado',
      },
      {
        id: 1,
        codigo: 'DEF456',
        descripcion: 'Producto B',
        precio: '200',
        nombre: 'Proveedor X',
        ganancia: '25%',
        estado: 'en stock',
        pago: 'impago',
      },
    ]);

    const response = await request(app).get('/inventory/providers');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 0,
        codigo: 'ABC123',
        descripcion: 'Producto A',
        precio: '100',
        nombre: 'Proveedor X',
        ganancia: '25%',
        estado: 'en stock',
        pago: 'pagado',
      },
      {
        id: 1,
        codigo: 'DEF456',
        descripcion: 'Producto B',
        precio: '200',
        nombre: 'Proveedor X',
        ganancia: '25%',
        estado: 'en stock',
        pago: 'impago',
      },
    ]);
    expect(getProvidersData).toHaveBeenCalledOnce();
  });

  it('creates inventory items and returns barcode URLs from POST /inventory', async () => {
    appendInventoryItems.mockResolvedValue({
      generatedBarcodes: [{ codigo: 'INV-0001', fileName: 'INV-0001.svg' }],
    });

    const response = await request(app)
      .post('/inventory')
      .send([
        {
          nombre: 'Producto B',
          precio: '2500',
          proveedora: 'Proveedor Y',
        },
      ]);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      barcodes: [
        {
          codigo: 'INV-0001',
          url: '/barcodes/INV-0001.svg',
        },
      ],
    });
    expect(appendInventoryItems).toHaveBeenCalledOnce();
  });

  it('returns 400 when POST /inventory payload is invalid', async () => {
    const response = await request(app)
      .post('/inventory')
      .send([
        {
          nombre: 'Producto C',
          precio: '2500',
        },
      ]);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Campos inválidos. nombre, precio y proveedora son obligatorios.',
    });
  });

  it('updates status on PUT /inventory/:id/status', async () => {
    setInventoryRowStatus.mockResolvedValue();

    const response = await request(app)
      .put('/inventory/3/status')
      .send({ estado: 'vendido' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(setInventoryRowStatus).toHaveBeenCalledWith(3, 'vendido', undefined, undefined);
  });
});
