import { supabase } from "../../services/supabaseService.js";

export const getInventory = async () => {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*");

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
};

export const addItemToInventory = async (preparedItems) => {
  try {
    console.log("Llegamos al addItemToInventory");

    const payload = preparedItems?.map((item) => ({ organization_id: item?.orgId, provider_id: item?.proveedora, description: item?.nombre, price: item?.precio, status: 'AVAILABLE', providerName: item?.providerName}));

    const { data, error } = await supabase
      .from('inventory')
      .insert(payload)
      .select();


    console.log("payload:", payload);
    console.log("data:", data);
    console.log("error:", error);
    return {
      success: true,
      data
    };
  } catch (err) {
    console.error('Error ', err);
  }
};