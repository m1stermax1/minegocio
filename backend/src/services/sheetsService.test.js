import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.SPREADSHEET_ID = 'spreadsheet-id';
process.env.GOOGLE_PROJECT_ID = 'project-id';
process.env.GOOGLE_PRIVATE_KEY_ID = 'private-key-id';
process.env.GOOGLE_PRIVATE_KEY = 'private_key';
process.env.GOOGLE_CLIENT_EMAIL = 'test@example.com';
process.env.GOOGLE_CLIENT_ID = 'client-id';

const mockBatchUpdate = vi.fn();
const mockGet = vi.fn();
const mockValuesGet = vi.fn();
const mockValuesUpdate = vi.fn();
const mockGetClient = vi.fn().mockResolvedValue({});
const mockSheets = {
  spreadsheets: {
    get: mockGet,
    batchUpdate: mockBatchUpdate,
    values: {
      get: mockValuesGet,
      update: mockValuesUpdate,
    },
  },
};

vi.mock('googleapis', () => {
  const GoogleAuth = vi.fn(function() {
    this.getClient = mockGetClient;
  });

  return {
    google: {
      auth: {
        GoogleAuth,
      },
      sheets: vi.fn(() => mockSheets),
    },
  };
});

import { getInventoryData, getProvidersData, setInventoryRowStatus, appendInventoryItems } from './sheetsService.js';

describe('sheetsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usa texto seguro para inventario desde Sheets', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        sheets: [
          {
            data: [
              {
                rowData: [
                  {
                    values: [
                      { formattedValue: ' COD123 ' },
                      { formattedValue: ' Producto prueba ' },
                      { formattedValue: '150' },
                      { formattedValue: 'Proveedor X' },
                    ],
                    effectiveFormat: {
                      backgroundColor: { red: 1, green: 1, blue: 1 },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const inventory = await getInventoryData();
    expect(inventory).toEqual([
      {
        id: 0,
        codigo: 'COD123',
        descripcion: 'Producto prueba',
        precio: '150',
        proveedora: 'Proveedor X',
        estado: 'en stock',
      },
    ]);
  });

  it('usa texto seguro para proveedoras desde Sheets', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        sheets: [
          {
            data: [
              {
                rowData: [
                  {
                    values: [
                      { formattedValue: ' COD456 ' },
                      { formattedValue: ' Producto proveedora ' },
                      { formattedValue: '220' },
                      { formattedValue: 'Proveedor Y' },
                      {},
                      { formattedValue: 'PAGADO' },
                    ],
                    effectiveFormat: {
                      backgroundColor: { red: 1, green: 1, blue: 1 },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const providers = await getProvidersData();
    expect(providers).toEqual([
      {
        id: 0,
        codigo: 'COD456',
        nombre: 'Proveedor Y',
        descripcion: 'Producto proveedora',
        precio: '220',
        ganancia: '25%',
        estado: 'en stock',
        pago: 'pagado',
      },
    ]);
  });

  it('colorea columnas A-F cuando cambia a vendido', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        sheets: [
          {
            properties: {
              title: 'LOCAL MAXI',
              sheetId: 123,
            },
          },
        ],
      },
    });

    await setInventoryRowStatus(4, 'vendido');

    expect(mockBatchUpdate).toHaveBeenCalledWith({
      spreadsheetId: 'spreadsheet-id',
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 123,
                startRowIndex: 4,
                endRowIndex: 5,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 0.46666667,
                    green: 0.76862745,
                    blue: 0.16470588,
                  },
                },
              },
              fields: 'userEnteredFormat.backgroundColor',
            },
          },
        ],
      },
    });
  });

  it('genera un codigo de barra por cada item agregado', async () => {
    mockValuesGet.mockResolvedValueOnce({
      data: {
        values: [
          ['I1'],
          ['Item 1'],
        ],
      },
    });
    mockValuesUpdate.mockResolvedValueOnce({});

    const items = [
      { nombre: 'Item A', precio: 100, proveedora: 'P1' },
      { nombre: 'Item B', precio: 200, proveedora: 'P2' },
    ];

    const result = await appendInventoryItems(items);

    expect(result.generatedBarcodes).toHaveLength(2);
    expect(result.generatedBarcodes[0].codigo).toMatch(/^INV-/);
    expect(result.generatedBarcodes[1].codigo).toMatch(/^INV-/);
    expect(mockValuesUpdate).toHaveBeenCalledTimes(1);
  });
});
