import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ProvidersFormModal from './ProvidersFormModal.jsx';

vi.mock('../services/api.js', () => ({
  addProvider: vi.fn(),
}));

vi.mock('../services/users.js', () => ({
  getProfile: vi.fn(),
}));

import { addProvider } from '../services/api.js';
import { getProfile } from '../services/users.js';

const renderModal = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onProviderAdded: vi.fn(),
    ...overrides,
  };
  return render(<ProvidersFormModal {...props} />);
};

describe('ProvidersFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getProfile.mockResolvedValue([{ organization_id: 'org-123' }]);
    addProvider.mockResolvedValue({});
  });

  it('no renderiza nada cuando isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Nueva Proveedora')).not.toBeInTheDocument();
  });

  it('muestra título, campos y botón al abrir', async () => {
    renderModal();
    expect(await screen.findByText('Nueva Proveedora')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Apellido/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Alias o CBU/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar proveedora/i })).toBeInTheDocument();
  });

  it('completa y envía, llama addProvider con orgId correcto', async () => {
    const onClose = vi.fn();
    const onProviderAdded = vi.fn();
    renderModal({ onClose, onProviderAdded });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Nombre/), 'María');
    await user.type(screen.getByLabelText(/Apellido/), 'García');
    await user.type(screen.getByLabelText(/Teléfono/), '+5491144444444');
    await user.type(screen.getByLabelText(/Alias o CBU/), 'maria.mp');
    await user.click(screen.getByRole('button', { name: /Guardar proveedora/i }));

    await waitFor(() => {
      expect(addProvider).toHaveBeenCalledTimes(1);
    });
    expect(addProvider).toHaveBeenCalledWith(
      'org-123',
      'María',
      'García',
      '+5491144444444',
      'maria.mp',
    );
    expect(onProviderAdded).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra error si faltan campos obligatorios', async () => {
    renderModal();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Guardar proveedora/i }));

    expect(
      await screen.findByText(/Nombre, apellido y teléfono son obligatorios/i),
    ).toBeInTheDocument();
    expect(addProvider).not.toHaveBeenCalled();
  });

  it('muestra error si addProvider falla', async () => {
    addProvider.mockRejectedValue({
      response: { data: { error: 'duplicate provider' } },
    });
    renderModal();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Nombre/), 'María');
    await user.type(screen.getByLabelText(/Apellido/), 'García');
    await user.type(screen.getByLabelText(/Teléfono/), '+5491144444444');
    await user.click(screen.getByRole('button', { name: /Guardar proveedora/i }));

    expect(await screen.findByText('duplicate provider')).toBeInTheDocument();
  });
});