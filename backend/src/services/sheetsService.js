import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bwipjs from "bwip-js";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getCellText(cell) {
  return cell?.formattedValue?.toString().trim() || "";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BARCODES_DIR = path.join(__dirname, "..", "..", "barcodes");
fs.mkdirSync(BARCODES_DIR, { recursive: true });

function generateBarcodeSvg(code) {
  const svgString = bwipjs.toSVG({
    bcid: "code128",
    text: code,
    scale: 3,
    height: 40,
    includetext: true,
    textxalign: "center",
    textsize: 13,
    backgroundcolor: "FFFFFF",
    paddingwidth: 10,
    paddingheight: 10,
  });

  const safeCode = code.replace(/[^A-Za-z0-9_-]/g, "_");
  const fileName = `${safeCode}.svg`;
  const filePath = path.join(BARCODES_DIR, fileName);
  fs.writeFileSync(filePath, svgString, "utf8");
  return { fileName, filePath };
}

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
    ranges: ["LOCAL MAXI!A:K"],
    includeGridData: true,
  });

  const rows = response.data.sheets[0].data[0].rowData || [];

  return rows
    .filter((row) => {
      const cells = row.values || [];

      return cells.some((cell) => {
        const value =
          cell?.formattedValue ||
          cell?.effectiveValue?.stringValue ||
          cell?.effectiveValue?.numberValue;

        return value !== undefined && value !== "";
      });
    })
    .map((row, index) => {
      const cells = row.values || [];

      const codigo = getCellText(cells[0]);
      const descripcion = getCellText(cells[1]);
      const precio = getCellText(cells[2]);
      const proveedora = getCellText(cells[10]) || "mío";

      const bg = cells[0]?.effectiveFormat?.backgroundColor;

      const isGreen = bg && bg.green > 0.5 && bg.red < 0.5;

      return {
        id: index,
        codigo,
        descripcion,
        precio,
        proveedora,
        estado: isGreen ? "vendido" : "en stock",
      };
    });
}

export async function getProvidersData() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!A:K"],
    includeGridData: true,
  });

  const rows = response.data.sheets[0].data[0].rowData || [];

  return rows
    .map((row, index) => {
      const cells = row.values || [];
      const codigo = getCellText(cells[0]);
      const descripcion = getCellText(cells[1]);
      const precioRaw = getCellText(cells[2]);
      const nombre = getCellText(cells[10]);
      const pagoRaw = getCellText(cells[8]).toLowerCase();
      const isPaid = ["si", "pagado", "yes", "true"].includes(pagoRaw);

      const bg = cells[0]?.effectiveFormat?.backgroundColor;
      const isGreen = bg && bg.green > 0.5 && bg.red < 0.5;

      return {
        id: index,
        codigo,
        nombre,
        descripcion,
        precio: precioRaw,
        ganancia: "25%",
        estado: isGreen ? "vendido" : "en stock",
        pago: isPaid ? "pagado" : "impago",
      };
    })
    .filter((item) => item.nombre);
}

export async function getProvidersList() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!K:K"],
    includeGridData: true,
  });

  const rows = response.data.sheets[0].data[0].rowData || [];

  // Extraer valores únicos de la columna K (proveedora)
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

export async function getProvidersListComplete() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'proveedoras maxi!A:F',
    });

    const rows = response.data.values || [];

    return rows
      .filter((row) => {
        const hasValue = row.some((cell) => cell !== undefined && cell !== "");
        if (!hasValue) {
          return false;
        }

        const firstCell = row[0]?.toString().trim().toLowerCase() || "";
        if (firstCell === "nombre") {
          return false;
        }

        return true;
      })
      .map((row, index) => ({
        id: index,
        nombre: row[0]?.toString().trim() || "",
        apellido: row[1]?.toString().trim() || "",
        telefono: row[2]?.toString().trim() || "",
        alias: row[3]?.toString().trim() || "",
        cbu: row[4]?.toString().trim() || "",
      }));
  } catch (err) {
    console.warn(
      'proveedoras maxi sheet not found or error reading values, returning empty list:',
      err.message,
    );
    return [];
  }
}

export async function addNewProvider(nombre, apellido, telefono, notas = '') {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const values = [[nombre, apellido, telefono, notas]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'proveedoras maxi!A:D',
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    return { success: true, nombre, apellido, telefono };
  } catch (err) {
    throw new Error(`Failed to add provider: ${err.message}`);
  }
}

export async function setInventoryRowStatus(rowIndex, estado, metodoPago, precioVentaManual) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!A:G"],
    includeGridData: true,
    fields: "sheets.data.rowData",
  });

  const sheet = metadata.data.sheets?.[0];
  if (!sheet) {
    throw new Error("No se encontró la hoja 'LOCAL MAXI'");
  }

  const sheetMetadata = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!A:A"],
    includeGridData: false,
    fields: "sheets.properties",
  });

  const sheetData = sheetMetadata.data.sheets?.find(
    (sheetItem) => sheetItem.properties?.title?.toLowerCase() === "local maxi",
  );

  if (!sheetData) {
    throw new Error("No se encontró la hoja 'LOCAL MAXI'");
  }

  const sheetId = sheetData.properties.sheetId;
  const isVendido = estado?.toLowerCase() === "vendido";
  
  let precioVentaValue = { userEnteredValue: { numberValue: 0 } };
  let metodoPagoValue = { userEnteredValue: { stringValue: '' } };
  let gananciaValue = { userEnteredValue: { numberValue: 0 } };
  
  if (isVendido) {
    const rowData = sheet.data?.[0]?.rowData?.[rowIndex];
    const precioSuggeridoCell = rowData?.values?.[2];
    const precioSuggeridoRaw = getCellText(precioSuggeridoCell);
    const precioSuggeridoNum = Number(precioSuggeridoRaw) || 0;
    
    const porcentajeDueñaCell = rowData?.values?.[6];
    const porcentajeDueñaRaw = getCellText(porcentajeDueñaCell);
    const porcentajeDueñaNum = Number(porcentajeDueñaRaw) || 0;
    
    let precioVenta = precioVentaManual ? Number(precioVentaManual) : 0;
    
    if (!precioVentaManual && metodoPago) {
      if (metodoPago === 'efectivo') {
        precioVenta = precioSuggeridoNum * 0.90; // 10% discount
      } else if (metodoPago === 'transferencia') {
        precioVenta = precioSuggeridoNum * 0.95; // 5% discount
      } else if (metodoPago === 'debito/credito') {
        precioVenta = precioSuggeridoNum * 0.9441; // 5.59% discount
      }
    }
    
    const ganancia = precioVenta - porcentajeDueñaNum;
    
    precioVentaValue = { userEnteredValue: { numberValue: precioVenta } };
    metodoPagoValue = { userEnteredValue: { stringValue: metodoPago || 'sin especificar' } };
    gananciaValue = { userEnteredValue: { numberValue: ganancia } };
  }
  
  const greenBackground = isVendido
    ? { red: 0.46666667, green: 0.76862745, blue: 0.16470588 }
    : { red: 1, green: 1, blue: 1 };
  const redBackground = isVendido
    ? { red: 1, green: 0, blue: 0 }
    : { red: 1, green: 1, blue: 1 };
  const fechaVentaValue = isVendido
    ? { userEnteredValue: { stringValue: new Date().toISOString().replace('T', ' ').split('.')[0] } }
    : { userEnteredValue: { stringValue: '' } };

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
              endColumnIndex: 8,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: greenBackground,
              },
            },
            fields: "userEnteredFormat.backgroundColor",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 8,
              endColumnIndex: 10,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: redBackground,
              },
            },
            fields: "userEnteredFormat.backgroundColor",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 10,
              endColumnIndex: 12,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: greenBackground,
              },
            },
            fields: "userEnteredFormat.backgroundColor",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 4,
              endColumnIndex: 5,
            },
            cell: fechaVentaValue,
            fields: "userEnteredValue",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 3,
              endColumnIndex: 4,
            },
            cell: precioVentaValue,
            fields: "userEnteredValue",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 5,
              endColumnIndex: 6,
            },
            cell: metodoPagoValue,
            fields: "userEnteredValue",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 7,
              endColumnIndex: 8,
            },
            cell: gananciaValue,
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });
}

export async function appendInventoryItems(items) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "LOCAL MAXI!A:B",
    majorDimension: "COLUMNS",
  });

  const columnAValues = (response.data.values && response.data.values[0]) || [];
  const columnBValues = (response.data.values && response.data.values[1]) || [];
  let lastNonEmptyRowB = 0;

  for (let i = columnBValues.length - 1; i >= 0; i--) {
    if (columnBValues[i]?.toString().trim()) {
      lastNonEmptyRowB = i + 1; // rows are 1-based
      break;
    }
  }

  const startRow = lastNonEmptyRowB + 1;
  const generatedBarcodes = [];

  const values = items.map((item) => {
    const codigo = `INV-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const { fileName } = generateBarcodeSvg(codigo);
    generatedBarcodes.push({ codigo, fileName });

    const precioNumber = Number(item.precio) || 0;
    const porcentajeDueña = precioNumber * 0.6;

    const fechaCarga = new Date().toISOString().split('T')[0];

    return [
      codigo,
      item.nombre || "",
      item.precio?.toString() || "0",
      "0",
      "",
      "",
      porcentajeDueña.toString(),
      "",
      "no",
      "",
      item.proveedora || "",
      fechaCarga,
    ];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `LOCAL MAXI!A${startRow}:L${startRow + values.length - 1}`,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });

  return { generatedBarcodes };
}

export async function getSalesData() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'ventas maxi!A:D',
    });

    const rows = response.data.values || [];

    return rows.map((row) => {
      const fecha = row[0] || "";
      const metodoPago = row[1] || "";
      const montoTotal = Number(row[2]) || 0;
      let items = [];

      if (row[3]) {
        try {
          items = JSON.parse(row[3]);
        } catch {
          items = row[3]
            .toString()
            .split(";;")
            .map((itemText) => {
              const parts = itemText.split(" | ");
              return {
                codigo: parts[0] || "",
                descripcion: parts[1] || "",
                proveedora: parts[2] || "",
                precio: Number(parts[3]) || 0,
              };
            });
        }
      }

      return {
        fecha,
        metodoPago,
        montoTotal,
        items,
      };
    });
  } catch (error) {
    console.error('Error leyendo ventas:', error);
    return [];
  }
}

export async function appendSaleRecord({ fecha, metodoPago, montoTotal, items }) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const values = [[
    fecha,
    metodoPago,
    montoTotal,
    JSON.stringify(items),
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'ventas maxi!A:D',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}
