import { supabase } from "../../services/supabaseService.js";


export async function getProviders(organizationId) {
    const { data, error } = await supabase
        .from("providers")
        .select("*").eq("organization_id", organizationId);

    if (error) {
        throw error;
    }

    return data ?? [];
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

