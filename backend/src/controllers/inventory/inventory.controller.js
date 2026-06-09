import { supabase } from "../lib/supabase.js";

export const getInventory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("inventory")
      .select("*");

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};