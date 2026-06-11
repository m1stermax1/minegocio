import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function fetchInventory() {
  const response = await api.get("/inventory");
  return response.data;
}

export async function fetchProviders() {
  // const response = await api.get("/inventory/providers", {
  //   params: { _t: Date.now() },
  // });
  const response = await api.get("/providers");
  return response.data;
}

export async function fetchProvidersComplete() {
  const response = await api.get("/inventory/providers-list", {
    params: { _t: Date.now() },
  });
  return response.data;
}

export async function fetchProviderPayments() {
  const response = await api.get("/inventory/providers/payments", {
    params: { _t: Date.now() },
  });
  return response.data;
}

export async function addProvider(orgId, nombre, apellido, telefono, bankalias = "") {
  console.log("pase por el add provider")
  const response = await api.post("/providers/add", {
    orgId,
    nombre,
    apellido,
    telefono,
    bankalias,
  });
  console.log("aca hizo el post al endpoint");
  return response.data;
}

export async function updateInventoryRowStatus(
  id,
  estado,
  metodoPago,
  precioVentaManual,
) {
  const response = await api.put(`/inventory/${id}/status`, {
    estado,
    metodoPago,
    precioVentaManual,
  });
  return response.data;
}

export async function addInventoryItem(item) {
  const response = await api.post("/inventory", item);
  return response.data;
}

export async function fetchDashboardCounts() {
  const response = await api.get("/inventory/counts");
  return response.data;
}

export async function fetchSales() {
  const response = await api.get("/inventory/sales");
  return response.data;
}

export async function fetchOwnerTotal() {
  const response = await api.get("/inventory/owner-total");
  return response.data?.totalOwner || 0;
}

export async function createSale(payload) {
  const response = await api.post("/inventory/sales", payload);
  return response.data;
}

export async function fetchInvoices() {
  const response = await api.get("/inventory/facturas", {
    params: { _t: Date.now() },
  });
  return response.data;
}

export async function issueInvoice(facturaId) {
  const response = await api.post(
    `/inventory/facturas/${encodeURIComponent(facturaId)}/facturar`,
  );
  return response.data;
}

export async function sendWhatsAppMessage(payload) {
  const response = await api.post("/inventory/whatsapp/send", payload);
  return response.data;
}

export async function createMercadoPagoTransfer(payload) {
  const response = await api.post("/inventory/mercadopago/transfer", payload);
  return response.data.redirectUrl || response.data.url;
}

export async function updatePaymentStatus(codigos, status) {
  const response = await api.put("/inventory/providers/payments/status", {
    codigos,
    status,
  });
  return response.data;
}

export default api;
