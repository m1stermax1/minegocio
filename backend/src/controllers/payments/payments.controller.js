import { supabase } from "../../services/supabaseService.js";

export async function getPayments() {
  const { data, error } = await supabase.from("payments").select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}
