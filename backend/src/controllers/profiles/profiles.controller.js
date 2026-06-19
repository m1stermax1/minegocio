import { supabase } from "../../services/supabaseService.js";

export async function getProfiles(organizationId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  return data ?? [];
}