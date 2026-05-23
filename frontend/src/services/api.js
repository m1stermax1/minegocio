import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function fetchInventory() {
  const response = await api.get('/inventory');
  return response.data;
}

export async function fetchProviders() {
  const response = await api.get('/inventory/providers');
  return response.data;
}

export async function fetchProvidersComplete() {
  const response = await api.get('/inventory/providers-list');
  return response.data;
}

export async function addProvider(nombre, apellido, telefono, notas = '') {
  const response = await api.post('/inventory/providers', {
    nombre,
    apellido,
    telefono,
    notas,
  });
  return response.data;
}

export async function updateInventoryRowStatus(id, estado, metodoPago, precioVentaManual) {
  const response = await api.put(`/inventory/${id}/status`, { 
    estado, 
    metodoPago, 
    precioVentaManual 
  });
  return response.data;
}

export async function addInventoryItem(item) {
  const response = await api.post('/inventory', item);
  return response.data;
}

export async function fetchDashboardCounts() {
  const response = await api.get('/inventory/counts');
  return response.data;
}

export default api;
