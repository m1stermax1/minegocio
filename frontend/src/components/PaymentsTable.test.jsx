import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentsTable from './PaymentsTable.jsx';

vi.mock('../services/api.js', () => ({
  updatePaymentStatus: vi.fn(),
  fetchProviders: vi.fn(),
}));

describe('PaymentsTable', () => {
  it('usa el porcentaje de la proveedora para calcular el monto a pagar', () => {
    render(
      <PaymentsTable
        payments={[
          {
            provider_id: 'prov-1',
            barcode: 'INV-AAA',
            description: 'Remera Azul',
            precio: 1000,
            total_amount: 0,
            estado: 'pendiente',
          },
        ]}
        providers={{ data: [{ id: 'prov-1', first_name: 'María', last_name: 'Lopez', percentage: 35 }] }}
        loading={false}
      />,
    );

    expect(screen.getByText('$350,00')).toBeInTheDocument();
  });
});
