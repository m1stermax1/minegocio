import { supabaseAdmin } from "../../services/supabaseService.js";

export async function getProviders() {
    const { data, error } = await supabaseAdmin
        .from("providers")
        .select("*");

    if (error) {
        throw error;
    }

    return data ?? [];
}

export async function addNewProvider(nombre, apellido, telefono, bankalias = '') {
//   const { sheets, spreadsheetId } = await getSheetsClient();

  const values = [[nombre, apellido, telefono, bankalias]];

  console.log("llegue al controler")

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

