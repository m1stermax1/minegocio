import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import SalesModal from './SalesModal.jsx';

vi.mock('../services/api.js', () => ({
  createSale: vi.fn(),
  createSalesItem: vi.fn(),
  createPayments: vi.fn(),
  createInvoices: vi.fn(),
  updateInventoryRowStatus: vi.fn(),
}));

vi.mock('../services/users.js', () => ({
  getProfile: vi.fn(),
}));

import {
  createSale,
  createSalesItem,
  createPayments,
  createInvoices,
  updateInventoryRowStatus,
} from '../services/api.js';
import { getProfile } from '../services/users.js';

const renderModal = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    inventoryItems: [],
    onSaleCreated: vi.fn(),
    isLoadingInventory: false,
    ...overrides,
  };
  return render(<SalesModal {...props} />);
};

const PROVIDER_ITEM = {
  id: 1,
  barcode: 'INV-AAA',
  description: 'Remera Azul',
  price: 1000,
  status: 'AVAILABLE',
  provider_id: 'prov-1',
  providerName: 'María',
  // profile_id ausente => producto de proveedora
};

const OWN_ITEM = {
  id: 2,
  barcode: 'INV-BBB',
  description: 'Pantalón mío',
  price: 2000,
  status: 'AVAILABLE',
  profile_id: 'me',
  providerName: 'mío',
};

describe('SalesModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProfile.mockResolvedValue([{ organization_id: 'org-1' }]);
    createSale.mockResolvedValue({ data: [{ id: 'sale-1' }] });
    createSalesItem.mockResolvedValue({});
    createPayments.mockResolvedValue({});
    createInvoices.mockResolvedValue({});
    updateInventoryRowStatus.mockResolvedValue({});
  });

  it('no renderiza nada cuando isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Agregar Venta')).not.toBeInTheDocument();
  });

  it('muestra título y campos al abrir', async () => {
    renderModal();
    expect(await screen.findByText('Agregar Venta')).toBeInTheDocument();
    expect(screen.getByLabelText(/Buscar producto/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cargar venta/i })).toBeInTheDocument();
  });

  it('muestra error si no hay productos seleccionados al enviar', async () => {
    renderModal();
    const user = userEvent.setup();
    // No agrego items, solo selecciono método
    await user.click(screen.getByRole('button', { name: /^Efectivo/i }));
    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    expect(
      await screen.findByText(/Agrega al menos un producto a la venta/i),
    ).toBeInTheDocument();
  });

  it('muestra error si no hay método de pago al enviar', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));

    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    expect(
      await screen.findByText(/Selecciona un método de pago/i),
    ).toBeInTheDocument();
  });

  it('agrega item a la venta y suma al totalAmount', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));

    // El item aparece en "Prendas agregadas"
    expect(await screen.findByText('Remera Azul')).toBeInTheDocument();
    // Total bruto visible (item.proveedora => price completo)
    expect(screen.getByText(/\$ ?1\.000/)).toBeInTheDocument();
  });

  it('calcula descuento 10% efectivo y 5% transferencia', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));

    // Total bruto 1000, efectivo 900, transferencia 950
    expect(await screen.findByText(/\$ ?1\.000/)).toBeInTheDocument();
    expect(screen.getByText(/\$ ?900/)).toBeInTheDocument();
    expect(screen.getByText(/\$ ?950/)).toBeInTheDocument();
  });

  it('al pagar con efectivo: createSale con total*0.9 y NO crea invoice', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));
    await user.click(screen.getByRole('button', { name: /^Efectivo/i }));
    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    await waitFor(() => {
      expect(createSale).toHaveBeenCalledTimes(1);
    });
    expect(createSale).toHaveBeenCalledWith(
      expect.objectContaining({ totalSale: 900, metodoPago: 'efectivo' }),
    );
    expect(createInvoices).not.toHaveBeenCalled();
  });

  it('al pagar con transferencia: createSale con total*0.95 Y crea invoice', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));
    await user.click(screen.getByRole('button', { name: /^Transferencia/i }));
    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    await waitFor(() => {
      expect(createSale).toHaveBeenCalledTimes(1);
    });
    expect(createSale).toHaveBeenCalledWith(
      expect.objectContaining({ totalSale: 950, metodoPago: 'transferencia' }),
    );
    expect(createInvoices).toHaveBeenCalledTimes(1);
    expect(createInvoices).toHaveBeenCalledWith(
      expect.objectContaining({ total_amout: 950, orgId: 'org-1' }),
    );
  });

  it('item CON proveedora: llama createPayments con el 60% del precio', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));
    await user.click(screen.getByRole('button', { name: /^Efectivo/i }));
    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    await waitFor(() => {
      expect(createPayments).toHaveBeenCalledTimes(1);
    });
    expect(createPayments).toHaveBeenCalledWith(
      expect.objectContaining({
        inventory_id: 1,
        providerId: 'prov-1',
        total_amout: 600, // 1000 * 0.6
        barcode: 'INV-AAA',
        orgId: 'org-1',
      }),
    );
  });

  it('item MÍO (con profile_id): NO llama createPayments', async () => {
    renderModal({ inventoryItems: [OWN_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-BBB');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));
    await user.click(screen.getByRole('button', { name: /^Efectivo/i }));
    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    await waitFor(() => {
      expect(createSale).toHaveBeenCalledTimes(1);
    });
    expect(createPayments).not.toHaveBeenCalled();
  });

  it('mezcla proveedora + mío: solo crea payment para el de proveedora', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM, OWN_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-BBB');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));

    await user.click(screen.getByRole('button', { name: /^Transferencia/i }));
    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    await waitFor(() => {
      expect(createPayments).toHaveBeenCalledTimes(1);
    });
    expect(createPayments).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'prov-1', total_amout: 600 }),
    );
    expect(createInvoices).toHaveBeenCalledTimes(1);
  });

  it('click en price card setea el método de pago', async () => {
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));

    // La price card de efectivo debe setear el método
    const efectivoCard = screen.getByRole('button', { name: /Efectivo/i });
    await user.click(efectivoCard);
    expect(efectivoCard).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    await waitFor(() => {
      expect(createSale).toHaveBeenCalledWith(
        expect.objectContaining({ metodoPago: 'efectivo' }),
      );
    });
  });

  it('muestra error si createSale falla', async () => {
    createSale.mockRejectedValue({
      response: { data: { error: 'sale failed' } },
    });
    renderModal({ inventoryItems: [PROVIDER_ITEM] });
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Buscar producto/i), 'INV-AAA');
    await user.click(await screen.findByRole('button', { name: /^Agregar$/ }));
    await user.click(screen.getByRole('button', { name: /^Efectivo/i }));
    await user.click(screen.getByRole('button', { name: /Cargar venta/i }));

    expect(await screen.findByText('sale failed')).toBeInTheDocument();
    expect(createSalesItem).not.toHaveBeenCalled();
    expect(createPayments).not.toHaveBeenCalled();
  });
});