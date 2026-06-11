import { supabaseAdmin } from "../../services/supabaseService.js";
import { getSessionUser } from "../session/session.controller.js";

export async function getUsers() {
  const userIs = await getSessionUser();
  console.log(userIs);
//   const { data, error } = await supabaseAdmin
//     .from("profiles")
//     .select("organization_id")
//     .eq("id", userId)
//     .single();

//   if (error) {
//     throw error;
//   }

  return userIs;
}
