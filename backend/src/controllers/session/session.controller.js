import { supabaseAdmin } from "../../services/supabaseService.js";

export async function getSessionUser() {
  const {
    data: { user },
  } = await supabaseAdmin.auth.getSession;

  console.log(await supabaseAdmin.auth.getUser())
  const userId = "hola";

  return userId;
}
