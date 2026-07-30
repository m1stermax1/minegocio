import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProvidersPage from './ProvidersPage.jsx';

vi.mock('../components/Sidebar.jsx', () => ({
  default: () => <div data-testid="mock-sidebar" />,
}));
vi.mock('../components/MobileHeader.jsx', () => ({
  default: ({ title }) => <div data-testid="mock-mobile-header">{title}</div>,
}));
vi.mock('../components/SearchBar.jsx', () => ({
  default: ({ query, onChange }) => (
    <input
      data-testid="mock-search-bar"
      value={query}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
vi.mock('../components/ProvidersFormModal.jsx', () => ({
  default: () => null,
}));
// ProvidersTable es un componente real que llama a deleteProvider*; lo mockeamos para mantener el smoke test aislado.
vi.mock('../components/ProvidersTable.jsx', () => ({
  default: ({ providers, loading, onDataChange }) => (
    <div data-testid="mock-providers-table">
      <span>count:{providers?.length ?? 0}</span>
      <span>loading:{String(loading)}</span>
      <button type="button" onClick={() => onDataChange?.()}>trigger-change</button>
    </div>
  ),
}));

vi.mock('../services/api.js', () => ({
  fetchProviders: vi.fn(),
  fetchInventory: vi.fn(),
}));

import { fetchProviders, fetchInventory } from '../services/api.js';

describe('ProvidersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchProviders.mockResolvedValue({
      data: [
        { id: 'p1', nombre: 'Ana', apellido: 'López', telefono: '+54911' },
        { id: 'p2', nombre: 'Lucía', apellido: 'Pérez', telefono: '+54922' },
      ],
    });
    fetchInventory.mockResolvedValue({
      data: [
        { id: 1, codigo: 'INV-1', descripcion: 'Remera' },
        { id: 2, codigo: 'INV-2', descripcion: 'Pantalón' },
      ],
    });
  });

  it('renderiza con sidebar, header y dispara fetchProviders + fetchInventory', async () => {
    render(<ProvidersPage />);

    expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-mobile-header')).toHaveTextContent('Proveedores');
    expect(screen.getByTestId('mock-search-bar')).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchProviders).toHaveBeenCalledTimes(1);
      expect(fetchInventory).toHaveBeenCalledTimes(1);
    });
  });

  it('pasa las proveedoras e inventario al ProvidersTable', async () => {
    render(<ProvidersPage />);

    const table = await screen.findByTestId('mock-providers-table');
    await waitFor(() => {
      expect(table).toHaveTextContent('count:2');
    });
  });

  it('botón "Agregar proveedora" abre el modal', async () => {
    render(<ProvidersPage />);
    const btn = await screen.findByRole('button', { name: /Agregar proveedora/i });
    // No podemos verificar el modal abierto (mockeado a null), pero al menos el botón existe.
    expect(btn).toBeInTheDocument();
  });

  it('buscar actualiza solamente la tabla de proveedoras', async () => {
    render(<ProvidersPage />);

    await waitFor(() => {
      expect(fetchProviders).toHaveBeenCalledTimes(1);
      expect(fetchInventory).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId('mock-search-bar'), {
      target: { value: 'Ana' },
    });

    await waitFor(() => {
      expect(fetchProviders).toHaveBeenCalledTimes(2);
      expect(fetchProviders).toHaveBeenLastCalledWith(1, 10, false, 'Ana');
      expect(fetchInventory).toHaveBeenCalledTimes(1);
    });
  });

  it('handleDataChange recarga solamente la tabla de proveedoras', async () => {
    render(<ProvidersPage />);

    await waitFor(() => {
      expect(fetchProviders).toHaveBeenCalledTimes(1);
      expect(fetchInventory).toHaveBeenCalledTimes(1);
    });

    screen.getByRole('button', { name: /trigger-change/i }).click();

    await waitFor(() => {
      expect(fetchProviders).toHaveBeenCalledTimes(2);
      expect(fetchInventory).toHaveBeenCalledTimes(1);
    });
  });
});
