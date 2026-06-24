import { useEffect, useState } from "react";
import { fetchInventory } from "./api";

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInventory = async () => {
    try {
      setLoading(true);

      const response = await fetchInventory();

      setInventory(response?.data || []);
    } catch (error) {
      console.error(error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return {
    inventory,
    loading,
    reloadInventory: loadInventory,
  };
}