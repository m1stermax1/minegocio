import { supabase } from "../../services/supabaseService.js";

export async function getPayments(organizationId) {
  const { data, error } = await supabase.from("payments").select("*").eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  return data ?? [];
}
