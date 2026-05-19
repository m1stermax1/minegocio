import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();
console.log(process.env.GOOGLE_PRIVATE_KEY);

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

async function getSheetsClient() {
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error("Falta SPREADSHEET_ID en .env");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID.replace(/\\n/g, "\n"),
      private_key: process.env.GOOGLE_PRIVATE_KEY,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
    },
    scopes: SCOPES,
  });

  const client = await auth.getClient();
  return {
    sheets: google.sheets({ version: "v4", auth: client }),
    spreadsheetId,
  };
}

export async function getInventoryData() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!A:E"],
    includeGridData: true,
  });

  const rows =
    response.data.sheets[0].data[0].rowData || [];

  return rows.map((row, index) => {
    const cells = row.values || [];

    // CELDA CODIGO (columna A)
    const codigoCell = cells[0];

    // TEXTO
    const codigo =
      codigoCell?.formattedValue || "";

    // COLOR DE FONDO
    const bg =
      codigoCell?.effectiveFormat?.backgroundColor;

    // Detectar verde
    const isGreen =
      bg &&
      bg.green > 0.5 &&
      bg.red < 0.5;

    return {
      id: index,

      codigo,

      descripcion:
        cells[1]?.formattedValue || "",

      precio:
        cells[2]?.formattedValue || "",

      proveedora:
        cells[3]?.formattedValue || "mío",

      estado: isGreen
        ? "vendido"
        : "en stock",
    };
  });
}

export async function getProvidersData() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!A:F"],
    includeGridData: true,
  });

  const rows =
    response.data.sheets[0].data[0].rowData || [];

  return rows.map((row, index) => {
    const cells = row.values || [];
    const codigo = cells[0]?.formattedValue || "";
    const precioRaw = cells[2]?.formattedValue || "";
    const precioNumber = Number(precioRaw);
    const pagoRaw = cells[5]?.formattedValue?.toString().trim().toLowerCase() || "";

    const bg =
      cells[0]?.effectiveFormat?.backgroundColor;

    const isGreen =
      bg &&
      bg.green > 0.5 &&
      bg.red < 0.5;

    return {
      id: index,
      codigo,
      nombre: cells[3]?.formattedValue || "",
      descripcion: cells[1]?.formattedValue || "",
      precio: precioRaw,
      ganancia: !Number.isNaN(precioNumber) ? "25%" : "25%",
      estado: isGreen ? "vendido" : "en stock",
      pago: pagoRaw ? "pagado" : "impago",
    };
  }).filter((item) => item.nombre);
}

export async function getProvidersList() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!D:D"],
    includeGridData: true,
  });

  const rows =
    response.data.sheets[0].data[0].rowData || [];

  // Extraer valores únicos de la columna D (proveedora)
  const providersSet = new Set();
  
  rows.forEach((row) => {
    const cells = row.values || [];
    const proveedora = cells[0]?.formattedValue?.trim();
    
    if (proveedora && proveedora.toLowerCase() !== "proveedora") {
      providersSet.add(proveedora);
    }
  });

  // Convertir a array de objetos
  return Array.from(providersSet).map((nombre, index) => ({
    id: index,
    nombre,
  }));
}

export async function setInventoryRowStatus(rowIndex, estado) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!A:A"],
    includeGridData: false,
    fields: "sheets.properties",
  });

  const sheet = metadata.data.sheets?.find(
    (sheetItem) =>
      sheetItem.properties?.title?.toLowerCase() === "LOCAL MAXI",
  );

  if (!sheet) {
    throw new Error("No se encontró la hoja 'LOCAL MAXI'");
  }

  const sheetId = sheet.properties.sheetId;
  const isVendido = estado?.toLowerCase() === "vendido";
  const backgroundColor = isVendido
    ? { red: 0.46666667, green: 0.76862745, blue: 0.16470588 }
    : { red: 1, green: 1, blue: 1 };

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor,
              },
            },
            fields: "userEnteredFormat.backgroundColor",
          },
        },
      ],
    },
  });
}

export async function appendInventoryItems(items) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const values = items.map((item, index) => [
    `AUTO-${Date.now()}-${index + 1}`,
    item.nombre,
    item.precio?.toString() || '',
    item.proveedora || '',
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'LOCAL MAXI!A:D',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values,
    },
  });
}
