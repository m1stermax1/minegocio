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
  const response = await api.get('/inventory/providers', {
    params: { _t: Date.now() },
  });
  return response.data;
}

export async function fetchProvidersComplete() {
  const response = await api.get('/inventory/providers-list', {
    params: { _t: Date.now() },
  });
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

export async function fetchSales() {
  const response = await api.get('/inventory/sales');
  return response.data;
}

export async function fetchOwnerTotal() {
  const response = await api.get('/inventory/owner-total');
  return response.data?.totalOwner || 0;
}

export async function createSale(payload) {
  const response = await api.post('/inventory/sales', payload);
  return response.data;
}

export async function sendWhatsAppMessage(payload) {
  const response = await api.post('/inventory/whatsapp/send', payload);
  return response.data;
}

export async function createMercadoPagoTransfer(payload) {
  const response = await api.post('/inventory/mercadopago/transfer', payload);
  return response.data.redirectUrl || response.data.url;
}

export default api;
