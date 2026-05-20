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
    ranges: ["LOCAL MAXI!A:E"],
    includeGridData: true,
  });

  const rows = response.data.sheets[0].data[0].rowData || [];

  return rows
    .filter((row) => {
      const cells = row.values || [];

      // verifica si alguna celda tiene contenido
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
      const proveedora = getCellText(cells[3]) || "mío";

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
    ranges: ["LOCAL MAXI!A:F"],
    includeGridData: true,
  });

  const rows = response.data.sheets[0].data[0].rowData || [];

  return rows
    .map((row, index) => {
      const cells = row.values || [];
      const codigo = getCellText(cells[0]);
      const descripcion = getCellText(cells[1]);
      const precioRaw = getCellText(cells[2]);
      const nombre = getCellText(cells[3]);
      const pagoRaw = getCellText(cells[5]).toLowerCase();

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
        pago: pagoRaw ? "pagado" : "impago",
      };
    })
    .filter((item) => item.nombre);
}

export async function getProvidersList() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!D:D"],
    includeGridData: true,
  });

  const rows = response.data.sheets[0].data[0].rowData || [];

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
    (sheetItem) => sheetItem.properties?.title?.toLowerCase() === "local maxi",
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
              endColumnIndex: 4,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor,
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
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 1,
                  green: 0,
                  blue: 0,
                },
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

    return [
      codigo,
      item.nombre || "",
      item.precio?.toString() || "",
      item.proveedora || "",
    ];
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `LOCAL MAXI!A${startRow}:D${startRow + values.length - 1}`,
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });

  return { generatedBarcodes };
}
