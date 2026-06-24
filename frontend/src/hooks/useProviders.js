import { useEffect, useState } from "react";
import { fetchProviders } from "./api";

export function useProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProviders = async () => {
    try {
      setLoading(true);

      const data = await fetchProviders();

      setProviders(data || []);
    } catch (err) {
      console.error(err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  return {
    providers,
    loading,
    reloadProviders: loadProviders,
  };
}