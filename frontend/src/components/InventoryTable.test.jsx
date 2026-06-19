import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import InventoryTable from './InventoryTable.jsx';

vi.mock('../services/api.js', () => ({
  updateInventoryRowStatus: vi.fn(),
  addInventoryItem: vi.fn(),
}));

import { updateInventoryRowStatus, addInventoryItem } from '../services/api.js';

const renderWithRef = (props) => {
  const ref = { current: null };
  render(<InventoryTable ref={ref} {...props} />);
  return ref;
};

describe('InventoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado de no hay productos cuando la lista está vacía', () => {
    renderWithRef({ items: [], loading: false, onItemAdded: vi.fn(), providers: [] });
    expect(screen.getByText('No se encontraron productos.')).toBeInTheDocument();
  });

  it('llama updateInventoryRowStatus al cambiar el estado de un item', async () => {
    updateInventoryRowStatus.mockResolvedValue();
    const items = [
      {
        id: 0,
        codigo: '1234',
        descripcion: 'Producto A',
        precio: 1500,
        proveedora: 'Proveedor X',
        estado: 'vendido',
      },
    ];

    renderWithRef({ items, loading: false, onItemAdded: vi.fn(), providers: [] });

    const statusButton = screen.getByRole('button', { name: /vendido/i });
    await userEvent.click(statusButton);

    expect(updateInventoryRowStatus).toHaveBeenCalledWith(0, 'en stock');
  });

  it('abre modal y agrega un item llamando addInventoryItem', async () => {
    addInventoryItem.mockResolvedValue({
      barcodes: [{ codigo: 'INV-0001', url: '/barcodes/INV-0001.svg' }],
    });
    const ref = { current: null };
    render(<InventoryTable ref={ref} items={[{ id: 1, codigo: '100', descripcion: 'Producto X', precio: 10, proveedora: 'Proveedor Z', estado: 'en stock' }]} loading={false} onItemAdded={vi.fn()} providers={[{ id: 1, nombre: 'Proveedor Z' }]} />);

    await act(async () => {
      ref.current.openAddItemModal();
    });

    const nombreInput = await screen.findByLabelText('Nombre del producto');
    const precioInput = screen.getByLabelText('Precio');
    const proveedoraInput = screen.getByLabelText('Proveedora');
    const submitButton = screen.getByRole('button', { name: /Agregar 1 item/i });

    await userEvent.type(nombreInput, 'Nuevo Producto');
    await userEvent.type(precioInput, '2000');
    await userEvent.type(proveedoraInput, 'Proveedor Z');
    await userEvent.click(submitButton);

    expect(addInventoryItem).toHaveBeenCalledWith([
      {
        nombre: 'Nuevo Producto',
        precio: 2000,
        proveedora: 'Proveedor Z',
      },
    ]);

    expect(await screen.findByText('Códigos de barra generados')).toBeInTheDocument();
    expect(screen.getByText('INV-0001')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Descargar SVG/i })).toHaveAttribute('href', '/barcodes/INV-0001.svg');
  });
});
