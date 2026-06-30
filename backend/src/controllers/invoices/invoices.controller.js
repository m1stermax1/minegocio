import { supabase } from "../../services/supabaseService.js";

export const getInvoices = async (organizationId, page = 1, limit = 20) => {
    const from = (page - 1) * limit;
    const to = page * limit - 1;

    try {
        const { data, error, count } = await supabase
            .from("invoices")
            .select("*", { count: "exact" })
            .eq("organization_id", organizationId)
            .range(from, to);

        if (error) {
            return {
                success: false,
                error: error.message,
            };
        }

        return {
            success: true,
            data,
            count,
        };
    } catch (err) {
        return {
            success: false,
            error: err.message,
        };
    }
};