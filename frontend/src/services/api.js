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

export default api;
