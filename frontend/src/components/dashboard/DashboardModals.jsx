import ProvidersFormModal from "../ProvidersFormModal";
import ItemsFormModal from "../ItemsFormModal";
import SalesModal from "../SalesModal";
import CloseDayModal from "./CloseDayModal";

export default function DashboardModals({
  inventory,
  providers,
  stats,
 
  showProvidersModal,
  setShowProvidersModal,

  showItemsModal,
  setShowItemsModal,

  showSaleModal,
  setShowSaleModal,

  onProviderAdded,
  onItemAdded,
  onSaleCreated,
  showCloseDayModal,
  setShowCloseDayModal,
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
        inventoryItems={inventory?.data}
        onSaleCreated={onSaleCreated}
      />

      <CloseDayModal
        isOpen={showCloseDayModal}
        onClose={() => setShowCloseDayModal(false)}
        stats={stats}
        onClosed={() => {
          // After closing day reload relevant data
          onSaleCreated && onSaleCreated();
        }}
      />
    </>
  );
}