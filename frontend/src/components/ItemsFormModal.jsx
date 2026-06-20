import { useState, useEffect } from "react";
import {
  addInventoryItem,
  fetchProviders,
  fetchProfiles,
} from "../services/api.js";

function ItemsFormModal({
  isOpen,
  onClose,
  onItemsAdded,
  defaultProviderId,
  providersRefresh,
  providers: parentProviders = [],
}) {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    if (parentProviders?.data?.length > 0) {
      setProviders(parentProviders);

      return;
    }
    (async () => {
      try {
        const data = await fetchProviders();
        setProviders(data || []);
        const profiles = await fetchProfiles();
        const filterProfileByOwner = profiles?.filter(
          (profile) => profile?.role == "ADMIN" || profile.role == "OWNER",
        )[0];
        console.log("Perfiles", filterProfileByOwner);
        setSelectedProvider(filterProfileByOwner);
      } catch (err) {
        console.error("Error cargando proveedoras:", err);
      }
    })();
  }, [isOpen, providersRefresh, parentProviders, defaultProviderId]);

  useEffect(() => {
    if (!isOpen) {
      // setSelectedProvider(null);
      setItems([]);
      setNewItemName("");
      setNewItemPrice("");
      setError("");
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (!sheetUrl) {
      if (!newItemName.trim() || !newItemPrice.toString().trim()) {
        setError("Nombre y precio son obligatorios");
        return;
      }
    }

    const priceNum = parseFloat(newItemPrice.toString().replace(/,/g, "."));
    if (Number.isNaN(priceNum)) {
      setError("Precio inválido");
      return;
    }

    setItems((prev) => [
      ...prev,
      { id: Date.now(), nombre: newItemName.trim(), precio: priceNum },
    ]);

    setNewItemName("");
    setNewItemPrice("");
    setError("");
  };

  const handleRemoveItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const generateWhatsAppMessage = () => {
    if (!items.length || !selectedProvider) return "";

    let message = `Hola, te paso el detalle de las prendas:\n\n`;
    const total = items.reduce((s, it) => s + it.precio, 0);

    items.forEach((item) => {
      message += `${item.nombre} - $${item.precio.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}\n`;
    });

    message += `\n*Del valor de cada prenda el 60% serìa para vos!* \n\n*Si se vende algo durante la semana te estaremos contactando el dìa Sàbado para realizar la transferencia o nos avisas si lo retiras durante la semana!*`;
    return message;
  };

  const generateWhatsAppLink = () => {
    const message = generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const phone = (selectedProvider?.telefono || "").replace(/\D/g, "");
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSelectedProvider(selectedProvider?.id);
    if (!selectedProvider) return setError("Selecciona una proveedora");
    if (!items?.length && !sheetUrl) return setError("Agrega al menos un item");

    setLoading(true);

    try {
      if (!sheetUrl) {
        if (
          selectedProvider?.role == "ADMIN" ||
          selectedProvider?.role == "OWNER"
        ) {
          const itemsToAdd = items.map((item) => ({
            nombre: item.nombre,
            precio: item.precio.toString(),
            profile_id: selectedProvider?.id,
            orgId: selectedProvider?.organization_id,
            providerName: selectedProvider?.first_name,
          }));

          await addInventoryItem(itemsToAdd);
        } else {
          const itemsToAdd = items.map((item) => ({
            nombre: item.nombre,
            precio: item.precio.toString(),
            proveedora: selectedProvider?.id,
            orgId: selectedProvider?.organization_id,
            providerName: selectedProvider?.first_name,
          }));

          await addInventoryItem(itemsToAdd);
        }

      } else {
        const SHEET_ID = sheetUrl?.match(/\/d\/([^/]+)/)?.[1];
        const SHEET_NAME = "LOCAL MAXI";
        const response = await fetch(
          `https://opensheet.elk.sh/${SHEET_ID}/${SHEET_NAME}`,
        );
        const data = await response.json();

        if (
          selectedProvider?.role == "ADMIN" ||
          selectedProvider?.role == "OWNER"
        ) {
          const products = data.map((row) => ({
            nombre: row.Nombre,
            precio: Number(row.Precio * 1000),
            profile_id: selectedProvider?.id,
            orgId: selectedProvider?.organization_id,
            providerName:
              selectedProvider?.first_name || selectedProvider?.name,
          }));

          await addInventoryItem(products);
        } else {
          const products = data.map((row) => ({
            nombre: row.Nombre,
            precio: Number(row.Precio * 1000),
            proveedora: selectedProvider?.id,
            orgId: selectedProvider?.organization_id,
            providerName:
              selectedProvider?.first_name || selectedProvider?.name,
          }));
          await addInventoryItem(products);
        }
      }

      setItems([]);
      setNewItemName("");
      setNewItemPrice("");
      setSelectedProvider("");
      onItemsAdded?.();
      const whatsappLink = generateWhatsAppLink();
      window.open(whatsappLink, "_blank");
      onClose();
    } catch (err) {
      console.error("Error agregando items:", err);
      setError(err || "Error al agregar los items");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = items.reduce((s, it) => s + it.precio, 0);

  const listProfiles = async () => {
    return;
  };

  console.log(
    "Dueña de producto o proveedora seleccionada: ",
    selectedProvider,
  );

  return (
    <div className="fixed inset-0 backdrop-blur flex items-center justify-center p-5 z-50">
      <div className="itemsModal w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-4 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold">Agregar Productos</h2>
            <p className="text-slate-400 text-sm m-0">
              Agrega productos y envíalos por WhatsApp
            </p>
          </div>
          <button
            type="button"
            className="text-slate-400 text-xl p-1 rounded-full hover:text-slate-100"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid gap-4">
            {error && (
              <div className="text-rose-300 bg-rose-900/20 border border-rose-800 rounded-md p-3">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-200">
                Proveedora *
              </label>
              <select
                className="w-full mt-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                value={selectedProvider?.id ?? ""}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedProvider(
                    providers?.data?.find((prov) => prov.id === id) || null,
                  );
                }}
                disabled={loading}
              >
                <option value="">Selecciona una proveedora</option>
                {providers?.data?.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.first_name} {prov.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-700 mt-4 pt-4">
              <h3 className="text-sm font-semibold mb-3">Agregar Producto</h3>

              <div className="grid gap-3 mb-3">
                <div>
                  <label className="text-sm text-slate-200">
                    Desde un excel pùblico
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1rhto6v0wefqDlnlgJ1U-ALv3VXSQNQmmquY7Z5PykYE/edit?gid=0#gid=0"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-200">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ej: Remera azul"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-200">Precio</label>
                  <input
                    type="number"
                    className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-slate-100"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Ej: 1500"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  className="bg-accent text-slate-900 font-semibold rounded-lg px-4 py-2 w-full"
                  onClick={handleAddItem}
                  disabled={loading}
                >
                  Agregar Producto
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold mb-3">
                  Productos ({items.length})
                </h3>
                <div className="grid gap-2 max-h-[200px] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-3 rounded-md bg-slate-900/30"
                    >
                      <div>
                        <p className="m-0 font-semibold">{item.nombre}</p>
                        <p className="m-0 text-sm text-slate-400">
                          ${item.precio.toLocaleString("es-AR")}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="bg-rose-900/30 text-rose-300 border border-rose-700 rounded-md px-3 py-1"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}

                  <div className="mt-3 p-3 bg-emerald-900/20 rounded-md border-l-4 border-emerald-700">
                    <p className="m-0 text-sm text-slate-400">Total</p>
                    <p className="m-0 text-lg font-bold">
                      ${total.toLocaleString("es-AR")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end p-4 border-t border-slate-700">
              <button
                type="button"
                className="bg-slate-900/40 border border-slate-700 text-slate-100 rounded-lg px-3 py-2"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-accent text-slate-900 font-semibold rounded-lg px-4 py-2"
              // disabled={loading || !items.length || !selectedProvider}
              >
                {loading ? "Enviando..." : "✓ Guardar y Enviar por WhatsApp"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemsFormModal;
