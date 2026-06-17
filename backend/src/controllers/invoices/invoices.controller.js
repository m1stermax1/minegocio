import { supabase } from "../../services/supabaseService.js";

export async function getInvoices() {
  const { data, error } = await supabase.from("invoices").select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}