import { supabase } from "../../services/supabaseService.js";
import { getSessionUser } from "../session/session.controller.js";

export async function getUsers() {
  const userIs = await getSessionUser();
  //   const { data, error } = await supabase
  //     .from("profiles")
  //     .select("organization_id")
  //     .eq("id", userId)
  //     .single();

  //   if (error) {
  //     throw error;
  //   }

  return userIs;
}

export async function getOrganizationIdByUser(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }
 return data;
};
