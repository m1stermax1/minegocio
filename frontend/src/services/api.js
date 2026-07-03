import axios from "axios";
import { getProfile, getSessionUser } from "./users";
import { supabase } from "./supabase";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

api.interceptors.request.use(async (config) => {
  const perfil = await getSessionUser();
  if (perfil?.access_token) {
    config.headers.Authorization = `Bearer ${perfil.access_token}`;
  }
  return config;
});

export async function fetchInventory(page, limit, selectedProdiver, all = false) {
  const params = new URLSearchParams();
  if (all) {
    params.set("all", "true");
  } else {
    if (page != null) params.set("page", String(page));
    if (limit != null) params.set("limit", String(limit));
  }
  if (selectedProdiver) params.set("provider_id", selectedProdiver);

  const qs = params.toString();
  const url = qs ? `/inventory?${qs}` : "/inventory";
  const response = await api.get(url);
  return response;
}

//para traer productos de tienda nube
// export async function fetchTienaNubeInventory() {
//
//   const tiendanuebeProducts = await axios.get(
//     "https://lilaferiaamericana.mitiendanube.com/productos",
//   );
//
//   const $ = cheerio.load(data);
//
//   const tiendaNube = [];
//
//   $(".js-item-product").each((_, element) => {
//
//   });
//
//   return tiendaNube
// };

export async function fetchProviders(page = 1, limit = 10, all = false) {
  if (all) {
    // Fetch a large number to get all providers (adjust as needed)
    limit = 1000;
    page = 1;
  }
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await api.get(`/providers?${params}`);
  return response.data;
}

export async function fetchProviderPayments() {
  const response = await api.get("/inventory/providers/payments", {
    params: { _t: Date.now() },
  });
  return response.data;
}

export async function fetchProfiles() {
  const response = await api.get("/profiles");
  return response?.data;
};

export async function addProvider(
  getOrganizationId,
  nombre,
  apellido,
  telefono,
  bankalias = "",
) {
  console.log("pase por el add provider");
  const response = await api.post("/providers/add", {
    getOrganizationId,
    nombre,
    apellido,
    telefono,
    bankalias,
  });
  console.log("aca hizo el post al endpoint");
  return response.data;
}

export async function updateInventoryRowStatus(id, estado) {
  const response = await api.patch(`/inventory/${id}/status`, {
    status: estado == "AVAILABLE" ? "SOLD" : "AVAILABLE",
  });
  return response.data;
}

export async function addInventoryItem(items) {
  const response = await api.post("/inventory/add", items);
  return response.data;
}

export async function fetchDashboardCounts() {
  const response = await api.get("/dashboard/counts");
  return response.data;
}

export async function fetchSales(page = 1, limit = 10, all = false) {
  if (all) {
    limit = 1000;
    page = 1;
  }
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await api.get(`/sales?${params}`);
  return response.data;
}

export async function fetchSalesItems() {
  const response = await api.get("/sales/sales-items");
  return response.data;
}

export async function fetchOwnerTotal() {
  const response = await api.get("/inventory/owner-total");
  return response.data?.totalOwner || 0;
}

export async function createSale(payload) {
  const response = await api.post("/sales/add", payload);
  console.log("Respuesta del createSale: ", response.data);
  return response.data;
}

export async function printBarcode(barcode) {
  console.log("Barcode", barcode)
  const response = await api.post("/inventory/print-barcode", {barcode: barcode});
  return response;
}

export async function deleteProvider(id) {
  const response = await api.delete(`/providers/${id}`);
  return response.data;
}

export async function deleteProviders({ ids, alsoDeleteItems = false } = {}) {
  const response = await api.delete("/providers", {
    data: { ids, alsoDeleteItems, alsoDeleteItems },});
  return response.data;
}

export async function deleteInventoryItem(id) {
  const response = await api.delete(`/inventory/${id}`);
  return response.data;
}

export async function deleteInventoryItems({ ids, onlyAvailable = true } = {}) {
  const response = await api.delete("/inventory", {
    data: { ids, onlyAvailable },
  });
  return response.data;
}

export async function createSalesItem(payload) {
  const response = await api.post("/sales/add-sale-item", payload);
  return response.data;
}

export async function fetchInvoices(page = 1, limit = 10, all = false) {
  if (all) {
    limit = 1000;
    page = 1;
  }
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await api.get(`/invoices?${params}`);
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
  const response = await api.put("/payments/status", {
    codigos,
    status,
  });
  return response.data;
}

export async function fetchPayments(page = 1, limit = 10, all = false) {
  if (all) {
    limit = 1000;
    page = 1;
  }
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await api.get(`/payments?${params}`);
  return response.data;
}

export async function createPayments(payload) {
  const response = await api.post("/payments/add", payload);
  return response.data;
}

export async function createPaymentItems(payload) {
  const response = await api.post("/payments/add-item", payload);
  return response.data;
}

export async function createInvoices(payload) {
  const response = await api.post("/invoices/add", payload);
  return response.data;
};

export async function changeInventoryItem(payload) {
  console.log("Payload", payload)
  const response = await api.post(`/inventory/${payload?.inventory_id}`);
  return response.data;
};

export default api;