import { supabase } from "../../services/supabaseService.js";

export async function getInvoices(organizationId) {
  const { data, error } = await supabase.from("invoices").select("*").eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  return data ?? [];
}