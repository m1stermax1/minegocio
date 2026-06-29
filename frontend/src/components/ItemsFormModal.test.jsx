import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ItemsFormModal from './ItemsFormModal.jsx';

vi.mock('../services/api.js', () => ({
  addInventoryItem: vi.fn(),
  printBarcode: vi.fn(),
  fetchProviders: vi.fn(),
  fetchProfiles: vi.fn(),
}));

import {
  addInventoryItem,
  printBarcode,
  fetchProviders,
  fetchProfiles,
} from '../services/api.js';

const providersData = {
  data: [
    { id: 'prov-1', first_name: 'María', last_name: 'García', telefono: '+5491144444444' },
    { id: 'prov-2', first_name: 'Lucía', last_name: 'Pérez', telefono: '+5491155555555' },
  ],
};

const renderModal = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onItemsAdded: vi.fn(),
    providers: providersData,
    providersRefresh: 0,
    ...overrides,
  };
  return render(<ItemsFormModal {...props} />);
};

describe('ItemsFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom no implementa window.open por defecto
    global.window.open = vi.fn();
    fetchProviders.mockResolvedValue(providersData);
    fetchProfiles.mockResolvedValue([
      { id: 'me', role: 'OWNER', first_name: 'Maxi', organization_id: 'org-1' },
    ]);
  });

  it('no renderiza nada cuando isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Agregar Productos')).not.toBeInTheDocument();
  });

  it('muestra el título y los campos principales al abrir', async () => {
    renderModal();

    expect(await screen.findByText('Agregar Productos')).toBeInTheDocument();
    expect(screen.getByLabelText(/Proveedora/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del Producto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Precio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Imprimir etiquetas al guardar/i)).toBeInTheDocument();
  });

  it('el checkbox de impresión arranca marcado por default', async () => {
    renderModal();
    const checkbox = await screen.findByLabelText(/Imprimir etiquetas al guardar/i);
    expect(checkbox).toBeChecked();
  });

  it('muestra error si no hay proveedora seleccionada al enviar', async () => {
    renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Nombre del Producto/i), 'Remera');
    await user.type(screen.getByLabelText(/^Precio/i), '1500');
    await user.click(screen.getByRole('button', { name: /Agregar a la lista/i }));
    await user.click(screen.getByRole('button', { name: /Guardar y Enviar por WhatsApp/i }));

    expect(await screen.findByText('Selecciona una proveedora')).toBeInTheDocument();
    expect(addInventoryItem).not.toHaveBeenCalled();
  });

  it('agrega item a la lista y luego llama addInventoryItem al enviar', async () => {
    addInventoryItem.mockResolvedValue({ barcodes: [] });
    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/Proveedora/i), 'prov-1');
    await user.type(screen.getByLabelText(/Nombre del Producto/i), 'Remera azul');
    await user.type(screen.getByLabelText(/^Precio/i), '1500');
    await user.click(screen.getByRole('button', { name: /Agregar a la lista/i }));

    expect(await screen.findByText('Remera azul')).toBeInTheDocument();
    expect(screen.getByText('$1.500')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Guardar y Enviar por WhatsApp/i }));

    await waitFor(() => {
      expect(addInventoryItem).toHaveBeenCalledTimes(1);
    });
    const sent = addInventoryItem.mock.calls[0][0];
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      nombre: 'Remera azul',
      precio: '1500',
      proveedora: 'prov-1',
    });
  });

  it('con checkbox activo y barcodes devueltos, llama printBarcode por cada uno', async () => {
    addInventoryItem.mockResolvedValue({
      barcodes: [{ codigo: 'INV-AAA' }, { codigo: 'INV-BBB' }],
    });
    printBarcode.mockResolvedValue({});

    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/Proveedora/i), 'prov-1');
    await user.type(screen.getByLabelText(/Nombre del Producto/i), 'Remera');
    await user.type(screen.getByLabelText(/^Precio/i), '2000');
    await user.click(screen.getByRole('button', { name: /Agregar a la lista/i }));
    await user.click(screen.getByRole('button', { name: /Guardar y Enviar por WhatsApp/i }));

    await waitFor(() => {
      expect(printBarcode).toHaveBeenCalledTimes(2);
    });
    expect(printBarcode).toHaveBeenCalledWith('INV-AAA');
    expect(printBarcode).toHaveBeenCalledWith('INV-BBB');
  });

  it('con checkbox desactivado, NO llama printBarcode', async () => {
    addInventoryItem.mockResolvedValue({
      barcodes: [{ codigo: 'INV-AAA' }, { codigo: 'INV-BBB' }],
    });
    printBarcode.mockResolvedValue({});

    renderModal();
    const user = userEvent.setup();

    await user.click(screen.getByLabelText(/Imprimir etiquetas al guardar/i));
    await user.selectOptions(screen.getByLabelText(/Proveedora/i), 'prov-1');
    await user.type(screen.getByLabelText(/Nombre del Producto/i), 'Remera');
    await user.type(screen.getByLabelText(/^Precio/i), '2000');
    await user.click(screen.getByRole('button', { name: /Agregar a la lista/i }));
    await user.click(screen.getByRole('button', { name: /Guardar y Enviar por WhatsApp/i }));

    await waitFor(() => {
      expect(addInventoryItem).toHaveBeenCalled();
    });
    expect(printBarcode).not.toHaveBeenCalled();
  });

  it('muestra advertencia si la impresión de etiquetas falla totalmente', async () => {
    addInventoryItem.mockResolvedValue({
      barcodes: [{ codigo: 'INV-AAA' }],
    });
    printBarcode.mockRejectedValue(new Error('printer offline'));

    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/Proveedora/i), 'prov-1');
    await user.type(screen.getByLabelText(/Nombre del Producto/i), 'Remera');
    await user.type(screen.getByLabelText(/^Precio/i), '2000');
    await user.click(screen.getByRole('button', { name: /Agregar a la lista/i }));
    await user.click(screen.getByRole('button', { name: /Guardar y Enviar por WhatsApp/i }));

    expect(
      await screen.findByText(/no se pudieron imprimir las etiquetas/i),
    ).toBeInTheDocument();
    expect(addInventoryItem).toHaveBeenCalled();
  });

  it('muestra error si addInventoryItem falla', async () => {
    addInventoryItem.mockRejectedValue(new Error('network'));

    renderModal();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText(/Proveedora/i), 'prov-1');
    await user.type(screen.getByLabelText(/Nombre del Producto/i), 'Remera');
    await user.type(screen.getByLabelText(/^Precio/i), '2000');
    await user.click(screen.getByRole('button', { name: /Agregar a la lista/i }));
    await user.click(screen.getByRole('button', { name: /Guardar y Enviar por WhatsApp/i }));

    expect(await screen.findByText('network')).toBeInTheDocument();
    expect(window.open).not.toHaveBeenCalled();
  });
});