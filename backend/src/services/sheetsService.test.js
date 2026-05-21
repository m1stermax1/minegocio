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
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
                      {},
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
                      {},
                      {},
                      {},
                      {},
                      {},
                      { formattedValue: 'si' },
                      {},
                      { formattedValue: 'Proveedor Y' },
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

  it('colorea A-H, K y L en verde, I y J en rojo, y guarda timestamp en E cuando cambia a vendido', async () => {
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

    const batchCall = mockBatchUpdate.mock.calls[0][0];
    expect(batchCall.spreadsheetId).toBe('spreadsheet-id');
    expect(batchCall.requestBody.requests).toHaveLength(4);

    expect(batchCall.requestBody.requests[0]).toEqual({
      repeatCell: {
        range: {
          sheetId: 123,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 0,
          endColumnIndex: 8,
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
    });

    expect(batchCall.requestBody.requests[1]).toEqual({
      repeatCell: {
        range: {
          sheetId: 123,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 8,
          endColumnIndex: 10,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: {
              red: 1,
              green: 0,
              blue: 0,
            },
          },
        },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });

    expect(batchCall.requestBody.requests[2]).toEqual({
      repeatCell: {
        range: {
          sheetId: 123,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 10,
          endColumnIndex: 12,
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
    });

    expect(batchCall.requestBody.requests[3]).toEqual({
      repeatCell: {
        range: {
          sheetId: 123,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 4,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredValue: {
            stringValue: expect.any(String),
          },
        },
        fields: 'userEnteredValue',
      },
    });
  });

  it('borra la fecha de venta en E cuando cambia a en stock', async () => {
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

    await setInventoryRowStatus(4, 'en stock');

    const batchCall = mockBatchUpdate.mock.calls[0][0];
    expect(batchCall.requestBody.requests[3]).toEqual({
      repeatCell: {
        range: {
          sheetId: 123,
          startRowIndex: 4,
          endRowIndex: 5,
          startColumnIndex: 4,
          endColumnIndex: 5,
        },
        cell: {
          userEnteredValue: {
            stringValue: '',
          },
        },
        fields: 'userEnteredValue',
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

    const updateCall = mockValuesUpdate.mock.calls[0][0];
    expect(updateCall.range).toBe('LOCAL MAXI!A2:L3');
    expect(updateCall.requestBody.values).toHaveLength(2);
    expect(updateCall.requestBody.values[0]).toEqual([
      expect.any(String),
      'Item A',
      '100',
      '0',
      '',
      '',
      '60',
      '',
      'no',
      '',
      'P1',
      expect.any(String),
    ]);
    expect(updateCall.requestBody.values[1]).toEqual([
      expect.any(String),
      'Item B',
      '200',
      '0',
      '',
      '',
      '120',
      '',
      'no',
      '',
      'P2',
      expect.any(String),
    ]);
  });
});
