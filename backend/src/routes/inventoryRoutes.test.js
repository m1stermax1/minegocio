import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/sheetsService.js', () => ({
  getInventoryData: vi.fn(),
  getProvidersData: vi.fn(),
  setInventoryRowStatus: vi.fn(),
  appendInventoryItems: vi.fn(),
  appendSaleRecord: vi.fn(),
  appendProviderPaymentOrders: vi.fn(),
  appendInvoiceRecord: vi.fn(),
  updateInvoiceRecordStatus: vi.fn(),
  parseGoogleSheetInvoiceData: vi.fn(),
}));

vi.mock('../services/afipService.js', () => ({
  issueFacturaC: vi.fn(),
}));

import inventoryRoutes from './inventoryRoutes.js';
import {
  getInventoryData,
  getProvidersData,
  setInventoryRowStatus,
  appendInventoryItems,
  appendSaleRecord,
  appendProviderPaymentOrders,
  appendInvoiceRecord,
  updateInvoiceRecordStatus,
  parseGoogleSheetInvoiceData,
} from '../services/sheetsService.js';
import { issueFacturaC } from '../services/afipService.js';

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

  it('creates a sale, invoice and provider payment orders on POST /inventory/sales', async () => {
    appendSaleRecord.mockResolvedValue();
    appendInvoiceRecord.mockResolvedValue();
    appendProviderPaymentOrders.mockResolvedValue({ ordersCreated: 1 });
    issueFacturaC.mockResolvedValue({ CAE: '12345678901234' });
    updateInvoiceRecordStatus.mockResolvedValue();

    const items = [
      { id: 2, codigo: 'CAB-001', descripcion: 'Remera', precio: '1200', proveedora: 'Proveedor X' },
    ];

    const response = await request(app)
      .post('/inventory/sales')
      .send({ items, metodoPago: 'efectivo' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(appendSaleRecord).toHaveBeenCalledOnce();
    expect(appendInvoiceRecord).toHaveBeenCalledOnce();
    expect(appendProviderPaymentOrders).toHaveBeenCalledOnce();
    expect(issueFacturaC).toHaveBeenCalledOnce();
    expect(updateInvoiceRecordStatus).toHaveBeenCalledOnce();
    expect(setInventoryRowStatus).toHaveBeenCalledWith(2, 'vendido', 'efectivo');
  });

  it('creates invoices from a google sheets link', async () => {
    parseGoogleSheetInvoiceData.mockResolvedValue([
      {
        producto: 'Remera',
        precio: '1500',
        provincia: 'CABA',
        dniCuit: '20391523224',
        direccion: 'Av. Siempre Viva 123',
        fecha: '2026-07-05',
      },
    ]);
    issueFacturaC.mockResolvedValue({ CAE: '12345678901234' });

    const response = await request(app)
      .post('/inventory/facturas/google-sheets')
      .send({ sheetUrl: 'https://docs.google.com/spreadsheets/d/abc123/edit' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(parseGoogleSheetInvoiceData).toHaveBeenCalledWith('https://docs.google.com/spreadsheets/d/abc123/edit');
    expect(issueFacturaC).toHaveBeenCalledOnce();
  });
});
