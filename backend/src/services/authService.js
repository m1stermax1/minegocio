import { supabaseAdmin } from "./supabaseService.js";

export async function createUserOrganization({
    userId,
    name,
    email,
    businessName,
}) {
    console.log("Creating organization for user:", { userId, name, email, businessName });
    const { data: organization, error: organizationError } =
        await supabaseAdmin
            .from("organizations")
            .insert({
                name: businessName,
            })
            .select()
            .single();

    if (organizationError) {
        throw organizationError;
    }

    if (organizationError) {
        throw organizationError;
    }

    const { data: profile, error: profileError } =
        await supabaseAdmin
            .from("profiles")
            .insert({
                id: userId,
                email,
                name,
                organization_id: organization.id,
                role: "ADMIN",
            })
            .select()
            .single();

    if (profileError) {
        throw profileError;
    }

    return {organization, profile};
}