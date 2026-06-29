import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import InventoryTable from './InventoryTable.jsx';

vi.mock('../services/api.js', () => ({
  updateInventoryRowStatus: vi.fn(),
  addInventoryItem: vi.fn(),
  deleteInventoryItem: vi.fn(),
  deleteInventoryItems: vi.fn(),
}));

import { updateInventoryRowStatus, addInventoryItem, deleteInventoryItem, deleteInventoryItems } from '../services/api.js';

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

  // --- Selección múltiple + delete ---
  const inventoryItems = [
    { id: 1, barcode: 'INV-AAA', description: 'Remera', price: 1000, status: 'AVAILABLE' },
    { id: 2, barcode: 'INV-BBB', description: 'Pantalón', price: 2000, status: 'SOLD' },
    { id: 3, barcode: 'INV-CCC', description: 'Vestido', price: 1500, status: 'AVAILABLE' },
  ];

  it('selecciona 2 items y elimina solo disponibles (onlyAvailable=true)', async () => {
    const onItemAdded = vi.fn();
    deleteInventoryItems.mockResolvedValue({ success: true, deletedItems: 2 });
    render(
      <InventoryTable
        items={inventoryItems}
        loading={false}
        onItemAdded={onItemAdded}
        providers={[]}
      />,
    );

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // item 1 (Remera AVAILABLE)
    await user.click(checkboxes[3]); // item 3 (Vestido AVAILABLE)

    await user.click(screen.getByRole('button', { name: /Eliminar seleccionados/i }));

    // Modal de confirmación
    expect(await screen.findByText(/Eliminar productos/i)).toBeInTheDocument();

    // Click en "Solo borrar los disponibles"
    await user.click(screen.getByRole('button', { name: /Solo borrar los disponibles/i }));

    await waitFor(() => {
      expect(deleteInventoryItems).toHaveBeenCalledWith({
        ids: ['1', '3'],
        onlyAvailable: true,
      });
    });
    expect(deleteInventoryItem).not.toHaveBeenCalled();
    expect(onItemAdded).toHaveBeenCalled();
  });

  it('opción destructiva envía onlyAvailable=false', async () => {
    deleteInventoryItems.mockResolvedValue({ success: true });
    render(
      <InventoryTable items={inventoryItems} loading={false} onItemAdded={vi.fn()} providers={[]} />,
    );

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    await user.click(screen.getByRole('button', { name: /Eliminar seleccionados/i }));
    await user.click(screen.getByRole('button', { name: /Borrar todos \(incluye vendidos\)/i }));

    await waitFor(() => {
      expect(deleteInventoryItems).toHaveBeenCalledWith({
        ids: ['1', '2'],
        onlyAvailable: false,
      });
    });
  });

  it('al seleccionar 1 solo item llama deleteInventoryItem (endpoint single)', async () => {
    deleteInventoryItem.mockResolvedValue({ success: true });
    render(
      <InventoryTable items={inventoryItems} loading={false} onItemAdded={vi.fn()} providers={[]} />,
    );

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // item 1

    await user.click(screen.getByRole('button', { name: /Eliminar seleccionados/i }));
    await user.click(screen.getByRole('button', { name: /Borrar todos \(incluye vendidos\)/i }));

    await waitFor(() => {
      expect(deleteInventoryItem).toHaveBeenCalledWith('1');
    });
    expect(deleteInventoryItems).not.toHaveBeenCalled();
  });

  it('modal muestra resumen de items vendidos cuando hay SOLD entre seleccionados', async () => {
    render(
      <InventoryTable items={inventoryItems} loading={false} onItemAdded={vi.fn()} providers={[]} />,
    );

    const user = userEvent.setup();
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // AVAILABLE
    await user.click(checkboxes[2]); // SOLD

    await user.click(screen.getByRole('button', { name: /Eliminar seleccionados/i }));

    // 1 vendido entre los 2 seleccionados
    expect(
      await screen.findByText(/De los 2 items seleccionados, 1 ya están vendidos/i),
    ).toBeInTheDocument();
  });

  it('select all selecciona todos los items', async () => {
    render(
      <InventoryTable items={inventoryItems} loading={false} onItemAdded={vi.fn()} providers={[]} />,
    );

    const user = userEvent.setup();
    const selectAll = screen.getByRole('checkbox', { name: /Seleccionar todos los items/i });
    await user.click(selectAll);

    expect(screen.getByText(/3 items seleccionados/i)).toBeInTheDocument();
  });
});
