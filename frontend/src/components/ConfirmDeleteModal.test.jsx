import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ConfirmDeleteModal from './ConfirmDeleteModal.jsx';

const renderModal = (overrides = {}) => {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Eliminar proveedoras',
    count: 2,
    entityLabel: 'proveedora',
    impactSummary: '5 productos asociados quedarán sin proveedora',
    actions: [
      {
        value: 'desvincular',
        label: 'Solo borrar la proveedora',
        description: 'Los productos quedan sin proveedora',
      },
      {
        value: 'cascade',
        label: 'Borrar proveedora y todos sus productos',
        description: 'Acción destructiva',
        danger: true,
      },
    ],
    loading: false,
    ...overrides,
  };
  return render(<ConfirmDeleteModal {...props} />);
};

describe('ConfirmDeleteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen=false', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Eliminar proveedoras')).not.toBeInTheDocument();
  });

  it('muestra título, conteo y resumen de impacto', () => {
    renderModal();

    expect(screen.getByText('Eliminar proveedoras')).toBeInTheDocument();
    expect(screen.getByText(/Vas a eliminar/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText(/proveedoras/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/5 productos asociados quedarán sin proveedora/i),
    ).toBeInTheDocument();
  });

  it('muestra todas las acciones con sus descripciones', () => {
    renderModal();

    expect(
      screen.getByRole('button', { name: /Solo borrar la proveedora/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Borrar proveedora y todos sus productos/i,
      }),
    ).toBeInTheDocument();
  });

  it('click en una acción llama onConfirm con el value y luego onClose', async () => {
    const onConfirm = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    renderModal({ onConfirm, onClose });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /Borrar proveedora y todos/i }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('cascade');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('click en Cancelar NO llama onConfirm y sí llama onClose', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderModal({ onConfirm, onClose });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('muestra warning custom cuando se pasa', () => {
    renderModal({ warning: 'Cuidado: esto afecta 3 ventas' });
    expect(screen.getByText(/Cuidado: esto afecta 3 ventas/i)).toBeInTheDocument();
  });

  it('deshabilita botones de acción cuando loading=true', () => {
    renderModal({ loading: true });
    const cascade = screen.getByRole('button', {
      name: /Borrar proveedora y todos/i,
    });
    expect(cascade).toBeDisabled();
  });
});
