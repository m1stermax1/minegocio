import { supabase } from "../../services/supabaseService.js";


export async function getProviders(
  organizationId,
  page = 1,
  limit = 20,
  searchQuery = "",
) {
  const from = (page - 1) * limit;
  const to = page * limit - 1;

  let query = supabase
    .from("providers")
    .select(`
    *,
    inventory(count)
  `, { count: "exact" })
    .eq("organization_id", organizationId);

  const term = searchQuery.trim().replace(/[,%_()]/g, "\\$&");
  if (term) {
    query = query.or(
      `first_name.ilike.%${term}%,last_name.ilike.%${term}%,phone.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw error;
  }

  return { data: data ?? [], count: count ?? 0 };
}

export async function addNewProvider(nombre, apellido, telefono, bankalias = '') {
  //   const { sheets, spreadsheetId } = await getSheetsClient();

  const values = [[nombre, apellido, telefono, bankalias]];

  try {
    // await sheets.spreadsheets.values.append({
    //   spreadsheetId,
    //   range: 'proveedoras maxi!A:D',
    //   valueInputOption: 'RAW',
    //   requestBody: { values },
    // });

    return { success: true, nombre, apellido, telefono, bankalias };
  } catch (err) {
    throw new Error(`Failed to add provider: ${err.message}`);
  }
}


export async function deleteProviders(ids, organizationId, alsoDeleteItems = false) {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: "No se recibieron IDs para eliminar" };
    }

    let deletedItems = 0;

    if (alsoDeleteItems) {
      const { count: itemsCount, error: itemsError } = await supabase
        .from("inventory")
        .delete({ count: "exact" })
        .in("provider_id", ids)
        .eq("organization_id", organizationId);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }
      deletedItems = itemsCount ?? 0;
    }

    const { count, error } = await supabase
      .from("providers")
      .delete({ count: "exact" })
      .in("id", ids)
      .eq("organization_id", organizationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      deletedProviders: count ?? ids.length,
      deletedItems,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function updateProvider(id, organizationId, updateData) {
  try {
    const payload = {};
    if (updateData.first_name !== undefined) payload.first_name = updateData.first_name.trim();
    if (updateData.last_name !== undefined) payload.last_name = updateData.last_name.trim();
    if (updateData.phone !== undefined) payload.phone = updateData.phone.trim();
    if (updateData.bankalias !== undefined) payload.bankalias = updateData.bankalias.trim();
    if (updateData.percentage !== undefined) {
      const p = Number(updateData.percentage);
      if (!Number.isFinite(p) || p <= 0 || p > 100) {
        return { success: false, error: "El porcentaje debe ser mayor a 0 y menor o igual a 100." };
      }
      payload.percentage = p;
    }

    const { data, error } = await supabase
      .from("providers")
      .update(payload)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data?.[0] || null,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

