import { supabase } from "../../services/supabaseService.js";

export async function getSessionUser() {
  const {
    data: { user },
  } = await supabase.auth.getSession;

  console.log(await supabase.auth.getUser())
  const userId = "hola";

  return userId;
}
