import ProvidersFormModal from "../ProvidersFormModal";
import ItemsFormModal from "../ItemsFormModal";
import SalesModal from "../SalesModal";

export default function DashboardModals({
  inventory,
  providers,

  showProvidersModal,
  setShowProvidersModal,

  showItemsModal,
  setShowItemsModal,

  showSaleModal,
  setShowSaleModal,

  onProviderAdded,
  onItemAdded,
  onSaleCreated,
}) {
  return (
    <>
      <ProvidersFormModal
        isOpen={showProvidersModal}
        onClose={() =>
          setShowProvidersModal(false)
        }
        onProviderAdded={onProviderAdded}
        inventoryItems={inventory}
      />

      <ItemsFormModal
        isOpen={showItemsModal}
        onClose={() =>
          setShowItemsModal(false)
        }
        onItemsAdded={onItemAdded}
        providers={providers}
      />

      <SalesModal
        isOpen={showSaleModal}
        onClose={() =>
          setShowSaleModal(false)
        }
        inventoryItems={inventory}
        onSaleCreated={onSaleCreated}
      />
    </>
  );
}