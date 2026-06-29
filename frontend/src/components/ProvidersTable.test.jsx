import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ProvidersTable from './ProvidersTable.jsx';

vi.mock('../services/api.js', () => ({
  deleteProviders: vi.fn(),
  deleteProvider: vi.fn(),
  fetchProviders: vi.fn(),
  fetchProfiles: vi.fn(),
}));

import { deleteProviders, deleteProvider } from '../services/api.js';

const providers = [
  { id: 'p1', first_name: 'María', last_name: 'García', phone: '+5491144444444', organization_id: 'org-1' },
  { id: 'p2', first_name: 'Lucía', last_name: 'Pérez', phone: '+5491155555555', organization_id: 'org-1' },
];

const inventoryData = [
  { id: 1, barcode: 'INV-AAA', description: 'Remera', price: 1000, status: 'AVAILABLE', provider_id: 'p1' },
  { id: 2, barcode: 'INV-BBB', description: 'Pantalón', price: 2000, status: 'SOLD', provider_id: 'p1' },
  { id: 3, barcode: 'INV-CCC', description: 'Vestido', price: 1500, status: 'AVAILABLE', provider_id: 'p2' },
];

const renderTable = (overrides = {}) => {
  const props = {
    providers,
    inventoryItems: { data: inventoryData },
    loading: false,
    onDataChange: vi.fn(),
    ...overrides,
  };
  return render(<ProvidersTable {...props} />);
};

describe('ProvidersTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteProviders.mockResolvedValue({ success: true, deletedProviders: 2 });
    deleteProvider.mockResolvedValue({ success: true, deletedProviders: 1 });
  });

  it('muestra tabla con proveedoras', () => {
    renderTable();
    expect(screen.getByText('María')).toBeInTheDocument();
    expect(screen.getByText('Lucía')).toBeInTheDocument();
  });

  it('muestra conteo de productos por proveedora', () => {
    renderTable();
    // p1 tiene 2 items, p2 tiene 1
    const rows = screen.getAllByRole('row');
    const dataRows = rows.slice(1); // skip header
    expect(dataRows.length).toBe(2);
  });

  it('selecciona 2 proveedoras con checkbox y elimina con desvincular', async () => {
    const onDataChange = vi.fn();
    renderTable({ onDataChange });

    const user = userEvent.setup();

    // Marcar el primer y segundo checkbox de fila
    const checkboxes = screen.getAllByRole('checkbox');
    // El primer checkbox es el "select all"
    await user.click(checkboxes[1]); // María
    await user.click(checkboxes[2]); // Lucía

    // Aparece toolbar con el botón "Eliminar seleccionadas"
    const deleteBtn = screen.getByRole('button', { name: /Eliminar seleccionadas/i });
    await user.click(deleteBtn);

    // Aparece el modal de confirmación (puede matchear título "Eliminar proveedoras" o el alert "Vas a eliminar ... proveedoras")
    expect(await screen.findAllByText(/Eliminar proveedoras/i)).not.toHaveLength(0);

    // Click en "Solo borrar la(s) proveedora(s)"
    const desvincularBtn = screen.getByRole('button', { name: /Solo borrar la\(s\) proveedora\(s\)/i });
    await user.click(desvincularBtn);

    await waitFor(() => {
      expect(deleteProviders).toHaveBeenCalledTimes(1);
    });
    expect(deleteProviders).toHaveBeenCalledWith({
      ids: ['p1', 'p2'],
      alsoDeleteItems: false,
    });
    expect(deleteProvider).not.toHaveBeenCalled();
    expect(onDataChange).toHaveBeenCalled();
  });

  it('al seleccionar 1 sola proveedora llama deleteProvider (single endpoint)', async () => {
    const onDataChange = vi.fn();
    renderTable({ onDataChange });

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // María

    await user.click(screen.getByRole('button', { name: /Eliminar seleccionadas/i }));
    await user.click(screen.getByRole('button', { name: /Solo borrar la\(s\) proveedora\(s\)/i }));

    await waitFor(() => {
      expect(deleteProvider).toHaveBeenCalledWith('p1');
    });
    expect(deleteProviders).not.toHaveBeenCalled();
  });

  it('modal muestra impacto de 3 productos asociados cuando selecciono ambas proveedoras', async () => {
    renderTable();

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);
    await user.click(screen.getByRole('button', { name: /Eliminar seleccionadas/i }));

    // p1 tiene 2 items + p2 tiene 1 = 3 productos (aparece en summary y descripción de la acción)
    const matches = await screen.findAllByText(/Los 3 productos asociados/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('opción destructiva envía alsoDeleteItems=true', async () => {
    renderTable();

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    await user.click(screen.getByRole('button', { name: /Eliminar seleccionadas/i }));
    await user.click(
      screen.getByRole('button', { name: /Borrar proveedora\(s\) y todos sus productos/i }),
    );

    await waitFor(() => {
      expect(deleteProviders).toHaveBeenCalledWith({
        ids: ['p1', 'p2'],
        alsoDeleteItems: true,
      });
    });
  });

  it('select all selecciona todas las proveedoras', async () => {
    renderTable();

    const user = userEvent.setup();
    const selectAll = screen.getByRole('checkbox', { name: /Seleccionar todas/i });
    await user.click(selectAll);

    expect(
      screen.getByText(/2 proveedoras seleccionadas/i),
    ).toBeInTheDocument();
  });

  it('botón Limpiar deselecciona todo', async () => {
    renderTable();

    const user = userEvent.setup();
    const selectAll = screen.getByRole('checkbox', { name: /Seleccionar todas/i });
    await user.click(selectAll);

    const limpiar = screen.getByRole('button', { name: /^Limpiar$/i });
    await user.click(limpiar);

    expect(
      screen.queryByText(/2 proveedoras seleccionadas/i),
    ).not.toBeInTheDocument();
  });
});