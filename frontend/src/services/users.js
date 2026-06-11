import { supabase } from "../services/supabase.js";

export async function getProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuario no autenticado");
  }

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id);

  return data;
}

export async function getOrganization() {}
