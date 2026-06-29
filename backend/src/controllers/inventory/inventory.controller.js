import { supabase } from "../../services/supabaseService.js";
import { getSessionUser } from "../session/session.controller.js";

export const getInventory = async (
  organizationId,
  page = 1,
  limit = 10,
  selectedProvider,
  all = false,
) => {
  try {
    let query = supabase
      .from("inventory")
      .select("*", { count: "exact", head: false })
      .eq("organization_id", organizationId);

    if (selectedProvider) {
      query = query.eq("provider_id", selectedProvider);
    }

    if (all) {
      const { data, error, count } = await query;
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data, totalItems: count };
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error, count } = await query.range(from, to);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      totalItems: count,
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
    const payload = preparedItems?.map((item) => ({
      organization_id: item?.orgId,
      provider_id: item?.proveedora,
      description: item?.nombre,
      price: item?.precio,
      status: "AVAILABLE",
      providerName: item?.providerName,
      barcode: item?.barcode,
      profile_id: item?.profile,
    }));

    const { data, error } = await supabase
      .from("inventory")
      .insert(payload)
      .select();

    console.log("payload:", payload);
    console.log("data:", data);
    console.log("error:", error);

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Error ", err);
  }
};

export const changeItemStatus = async (inventoryId) => {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .update({ status: "SOLD" })
      .eq("id", inventoryId);
    if (error) {
      throw error;
    }
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

export const deleteInventoryItems = async (
  ids,
  organizationId,
  onlyAvailable = true,
) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: "No se recibieron IDs para eliminar" };
    }

    let query = supabase
      .from("inventory")
      .delete({ count: "exact" })
      .in("id", ids)
      .eq("organization_id", organizationId);

    if (onlyAvailable) {
      query = query.eq("status", "AVAILABLE");
    }

    const { count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      deletedItems: count ?? ids.length,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
};
