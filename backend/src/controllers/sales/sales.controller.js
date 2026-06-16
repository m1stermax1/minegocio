import { supabase } from "../../services/supabaseService.js";

export const getSales = async () => {
  try {
    const { data, error } = await supabase
      .from("sales")
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

export const getSalesItems = async () => {
  try {
    const { data, error } = await supabase
      .from("sale_items")
      .select("*");

      console.log("Llego al getSales")

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
}