import { supabase } from "./supabase.js";

export async function fetchSafeRecords(orgId, page = 1, limit = 10) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("safe")
      .select(`*, organization_id`, { count: "exact" })
      .eq("organization_id", orgId)
      .order("closed_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return { data, total: count ?? 0 };
  } catch (err) {
    console.error("Error fetching safe records:", err);
    return { data: [], total: 0 };
  }
}

export async function insertSafeRecord(payload) {
  try {
    const { data, error } = await supabase.from("safe").insert([payload]);
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error inserting safe record:", err);
    throw err;
  }
}

export default { fetchSafeRecords, insertSafeRecord };
