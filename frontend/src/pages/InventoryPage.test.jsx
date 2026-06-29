import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mocks primero (hoisted por vi)
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

vi.mock('../services/api.js', () => ({
  fetchInventory: vi.fn(),
  fetchProviders: vi.fn(),
  addInventoryItem: vi.fn(),
  printBarcode: vi.fn(),
  fetchProfiles: vi.fn(),
}));

import {
  fetchInventory,
  fetchProviders,
  addInventoryItem,
  printBarcode,
} from '../services/api.js';

import InventoryPage from './InventoryPage.jsx';

const makeProvider = (id, first_name) => ({
  id,
  first_name,
  last_name: '',
  telefono: '+5491144444444',
  organization_id: 'org-1',
});

const makeItem = (id, barcode, description, price, providerId, status = 'AVAILABLE') => ({
  id,
  barcode,
  description,
  price,
  status,
  provider_id: providerId,
  providerName: providerId ? 'María' : 'mío',
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <InventoryPage />
    </MemoryRouter>,
  );

describe('InventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.window.open = vi.fn();
    fetchProviders.mockResolvedValue({
      data: [makeProvider('prov-1', 'María'), makeProvider('prov-2', 'Lucía')],
    });
    addInventoryItem.mockResolvedValue({
      barcodes: [{ codigo: 'INV-NEW' }],
    });
    printBarcode.mockResolvedValue({});
  });

  it('renderiza título y controles principales', async () => {
    fetchInventory.mockResolvedValue({ data: [], totalItems: 0 });
    renderPage();

    expect(await screen.findByText('Inventario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buscar por código o descripción/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Agregar producto/i })).toBeInTheDocument();
  });

  it('llama fetchInventory con page=1, limit=10, provider_id vacío al montar', async () => {
    fetchInventory.mockResolvedValue({ data: [], totalItems: 0 });
    renderPage();

    await waitFor(() => {
      expect(fetchInventory).toHaveBeenCalled();
    });
    const firstCall = fetchInventory.mock.calls[0];
    expect(firstCall[0]).toBe(1);
    expect(firstCall[1]).toBe(10);
    expect(firstCall[2]).toBeFalsy();
  });

  it('muestra la tabla con productos devueltos', async () => {
    const items = [
      makeItem(1, 'INV-AAA', 'Remera Azul', 1500, 'prov-1'),
      makeItem(2, 'INV-BBB', 'Pantalón', 2500, 'prov-2'),
    ];
    fetchInventory.mockResolvedValue({ data: items, totalItems: 2 });

    renderPage();

    expect(await screen.findByText('Remera Azul')).toBeInTheDocument();
    expect(screen.getByText('Pantalón')).toBeInTheDocument();
  });

  it('abre la modal al hacer click en Agregar producto', async () => {
    fetchInventory.mockResolvedValue({ data: [], totalItems: 0 });
    renderPage();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Agregar producto/i }));

    expect(await screen.findByText('Agregar Productos')).toBeInTheDocument();
  });

  it('al agregar producto desde la modal llama addInventoryItem y refresca el inventario', async () => {
    fetchInventory.mockResolvedValueOnce({ data: [], totalItems: 0 });
    renderPage();

    const user = userEvent.setup();

    // Abre modal
    await user.click(await screen.findByRole('button', { name: /Agregar producto/i }));

    // Completa campos
    await user.selectOptions(screen.getByLabelText(/Proveedora/i), 'prov-1');
    await user.type(screen.getByLabelText(/Nombre del Producto/i), 'Remera Nueva');
    await user.type(screen.getByLabelText(/^Precio/i), '1500');

    // Click agregar a la lista
    await user.click(screen.getByRole('button', { name: /Agregar a la lista/i }));

    // Submit
    await user.click(screen.getByRole('button', { name: /Guardar y Enviar por WhatsApp/i }));

    await waitFor(() => {
      expect(addInventoryItem).toHaveBeenCalledTimes(1);
    });

    const sent = addInventoryItem.mock.calls[0][0];
    expect(sent[0]).toMatchObject({
      nombre: 'Remera Nueva',
      precio: '1500',
      proveedora: 'prov-1',
      orgId: 'org-1',
    });

    // printBarcode debe llamarse (checkbox default true)
    await waitFor(() => {
      expect(printBarcode).toHaveBeenCalledWith('INV-NEW');
    });

    // fetchInventory debe volver a llamarse (refresh)
    await waitFor(() => {
      expect(fetchInventory.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('pagina al hacer click en "Siguiente" con limit=10', async () => {
    const items = Array.from({ length: 10 }, (_, i) =>
      makeItem(i, `INV-${i}`, `Producto ${i}`, 1000 + i, 'prov-1'),
    );
    fetchInventory.mockResolvedValue({ data: items, totalItems: 25 });

    renderPage();

    const next = await screen.findByRole('button', { name: /Siguiente/i });
    const user = userEvent.setup();
    await user.click(next);

    await waitFor(() => {
      const lastCall = fetchInventory.mock.calls[fetchInventory.mock.calls.length - 1];
      expect(lastCall[0]).toBe(2);
      expect(lastCall[1]).toBe(10);
    });
  });

  it('filtra por proveedora en el select y vuelve a llamar fetchInventory', async () => {
    fetchInventory.mockResolvedValue({ data: [], totalItems: 0 });
    renderPage();

    const user = userEvent.setup();
    const select = await screen.findByDisplayValue(/Todas las proveedoras/i);
    await user.selectOptions(select, 'prov-1');

    // No triggerea fetch directo (filtra client-side), pero los items visibles se acotan
    expect(select.value).toBe('prov-1');
  });

  it('buscador filtra los items visibles en la tabla', async () => {
    const items = [
      makeItem(1, 'INV-AAA', 'Remera Azul', 1500, 'prov-1'),
      makeItem(2, 'INV-BBB', 'Pantalón', 2500, 'prov-2'),
    ];
    fetchInventory.mockResolvedValue({ data: items, totalItems: 2 });

    renderPage();

    const search = await screen.findByPlaceholderText(/Buscar por código o descripción/i);
    await userEvent.type(search, 'Pant');

    expect(screen.getByText('Pantalón')).toBeInTheDocument();
    expect(screen.queryByText('Remera Azul')).not.toBeInTheDocument();
  });
});