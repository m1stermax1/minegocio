import { supabase } from "../services/supabase.js";

export async function getProfile() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Usuario no autenticado");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id);

  return data;
}

export async function getSessionUser() {
  const {
    data: { session },
    error: userError,
  } = await supabase.auth.getSession();

  return session;
}

export async function getOrganization(orgId) {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();
  if (error) {
    console.error("Error fetching organization:", error);
    throw error;
  }
  return data;
}
