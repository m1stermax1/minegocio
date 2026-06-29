import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../components/Sidebar.jsx', () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock('../services/dashboardService.js', () => ({
  getDashboardData: vi.fn(),
  getInventory: vi.fn(),
  getProviders: vi.fn(),
  getSales: vi.fn(),
}));

vi.mock('../services/api.js', () => ({
  addInventoryItem: vi.fn(),
  printBarcode: vi.fn(),
  fetchProviders: vi.fn(),
  fetchProfiles: vi.fn(),
  createSale: vi.fn(),
  createSalesItem: vi.fn(),
  createPayments: vi.fn(),
  createInvoices: vi.fn(),
  updateInventoryRowStatus: vi.fn(),
  addProvider: vi.fn(),
}));

vi.mock('../services/users.js', () => ({
  getProfile: vi.fn(),
}));

// Mock minimal de ItemsFormModal que dispara onItemsAdded para verificar el ciclo de stock
// sin atarnos al formulario completo (los inputs del modal usan <label> sin htmlFor).
vi.mock('../components/ItemsFormModal.jsx', () => ({
  default: ({ isOpen, onItemsAdded }) =>
    isOpen ? (
      <div data-testid="mock-items-form">
        <button
          type="button"
          onClick={() =>
            onItemsAdded?.([
              { codigo: 'INV-NEW', descripcion: 'Remera', precio: 1000, proveedora: 'p1' },
            ])
          }
        >
          Mock add
        </button>
      </div>
    ) : null,
}));

import {
  getDashboardData,
  getInventory,
  getProviders,
} from '../services/dashboardService';
import {
  addInventoryItem,
  printBarcode,
} from '../services/api.js';
import { getProfile } from '../services/users.js';

import DashboardPage from './DashboardPage.jsx';

const makeStockItem = (id) => ({
  id,
  barcode: `INV-${id}`,
  description: `Item ${id}`,
  price: 1000,
  status: 'AVAILABLE',
  provider_id: 'prov-1',
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window.open = vi.fn();

    // dashboardData con conteos completos (NO limitados a 10)
    getDashboardData.mockResolvedValue({
      dashboardData: {
        inStockCount: 47, // simula que el total es 47, no 10
        soldCount: 12,
      },
      providers: { data: [{ id: 'p1', first_name: 'María' }] },
      salesData: { data: [] },
      salesItems: { data: [] },
    });

    getInventory.mockResolvedValue({
      data: Array.from({ length: 47 }, (_, i) => makeStockItem(i + 1)),
      totalItems: 47,
    });
    getProviders.mockResolvedValue({ data: [{ id: 'p1', first_name: 'María' }] });

    addInventoryItem.mockResolvedValue({ barcodes: [{ codigo: 'INV-NEW' }] });
    printBarcode.mockResolvedValue({});
    getProfile.mockResolvedValue([{ organization_id: 'org-1' }]);
  });

  it('muestra el conteo TOTAL de productos en stock (no limitado a 10)', async () => {
    renderDashboard();

    // Espera a que stats.inStockCount = 47 aparezca en pantalla
    await waitFor(() => {
      expect(screen.getByText('47')).toBeInTheDocument();
    });
    expect(screen.getByText('Productos en stock')).toBeInTheDocument();
  });

  it('carga el inventario con all=true (sin paginación) para el modal de venta', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(getInventory).toHaveBeenCalledWith({ all: true });
    });
  });

  it('muestra conteos de proveedoras y vendidos', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // soldCount
    });
    expect(screen.getByText('Productos vendidos')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // providersCount
    expect(screen.getByText('Proveedoras')).toBeInTheDocument();
  });

  it('al agregar producto desde el dashboard, NO falla aunque la impresora no esté disponible', async () => {
    renderDashboard();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Agregar producto/i }));

    // Dispara onItemsAdded del modal mockeado → triggers loadInventory + loadDashboard
    await user.click(screen.getByText(/Mock add/i));

    await waitFor(() => {
      expect(getDashboardData).toHaveBeenCalled();
    });
    // No debe romperse ni mostrar error
    expect(screen.queryByText(/network/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error al agregar los items/i)).not.toBeInTheDocument();
  });

  it('al agregar producto refresca el conteo del dashboard', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('47')).toBeInTheDocument();
    });

    // Backend ahora devuelve 48 después del refresh
    getDashboardData.mockResolvedValueOnce({
      dashboardData: { inStockCount: 48, soldCount: 12 },
      providers: { data: [{ id: 'p1', first_name: 'María' }] },
      salesData: { data: [] },
      salesItems: { data: [] },
    });
    getInventory.mockResolvedValueOnce({
      data: Array.from({ length: 48 }, (_, i) => makeStockItem(i + 1)),
      totalItems: 48,
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Agregar producto/i }));

    // Dispara onItemsAdded → loadInventory() + loadDashboard() → card "Productos en stock" pasa a 48
    await user.click(screen.getByText(/Mock add/i));

    await waitFor(() => {
      expect(screen.getByText('48')).toBeInTheDocument();
    });
  });
});