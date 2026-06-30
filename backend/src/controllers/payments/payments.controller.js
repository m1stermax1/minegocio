import { supabase } from "../../services/supabaseService.js";

export async function getPayments(organizationId, page = 1, limit = 20) {
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    const { data, error, count } = await supabase
        .from("payments")
        .select("*", { count: "exact" })
        .eq("organization_id", organizationId)
        .range(from, to);

    if (error) {
        throw error;
    }

    return { data: data ?? [], count: count ?? 0 };
}
