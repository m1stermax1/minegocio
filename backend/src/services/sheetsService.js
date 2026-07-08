import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bwipjs from "bwip-js";
import { google } from "googleapis";
import dotenv from "dotenv";
import { exec } from "child_process";
import sharp from "sharp";
import crypto from "crypto";

dotenv.config();

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getCellText(cell) {
  return cell?.formattedValue?.toString().trim() || "";
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "..", "..", "temp");
fs.mkdirSync(TEMP_DIR, { recursive: true });

async function generateBarcodeAndPrint(code) {
  const safeCode = code.replace(/[^A-Za-z0-9_-]/g, "_");

  const filePath = path.join(
    TEMP_DIR,
    `${safeCode}-${Date.now()}.png`
  );

  // Generar barcode chico y nítido
  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: "code128",
    text: code,

    scale: 3,
    height: 8,

    includetext: true,
    textxalign: "center",
    textsize: 7,

    paddingwidth: 0,
    paddingheight: 0,

    backgroundcolor: "FFFFFF",
  });

  // Rotar barcode
  const rotatedBarcode = await sharp(barcodeBuffer)
    .rotate(90)
    .resize({
      width: 90,
      height: 260,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  // Canvas exacto para 1.5cm x 3cm
  const finalImage = await sharp({
    create: {
      width: 96,
      height: 300,
      channels: 3,
      background: "#FFFFFF",
    },
  })
    .composite([
      {
        input: rotatedBarcode,
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(filePath, finalImage);
  console.log("INICIO IMPRESION:", code);

  await new Promise((resolve, reject) => {
    exec(
      `python -m niimprint -m d110 -c usb -a COM3 --density 3 -i "${filePath}"`,
      (error, stdout, stderr) => {
        console.log("FIN IMPRESION:", code);
        console.log("STDOUT:", stdout);
        console.log("STDERR:", stderr);

        if (error) {
          reject(stderr || error.message);
          return;
        }

        resolve();
      }
    );
  });

  fs.unlinkSync(filePath);


  return {
    success: true,
    code,
  };
}

async function getSheetsClient(spreadsheetIdOverride) {
  const spreadsheetId = spreadsheetIdOverride || process.env.SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error("Falta SPREADSHEET_ID en .env");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID?.replace(/\\n/g, "\n"),
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

function normalizeHeader(value = "") {
  return value
    .toString()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export async function parseGoogleSheetInvoiceData(sheetUrl) {
  if (!sheetUrl) {
    throw new Error("Falta la URL del Google Sheet");
  }


  const spreadsheetId = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ||
    sheetUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/)?.[1];


  if (!spreadsheetId) {
    throw new Error("No se pudo extraer el ID del Google Sheet");
  }

  const { sheets } = await getSheetsClient(spreadsheetId);


  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "A:Z",
  });

  const rows = response?.data?.values || [];
  
  console.log("rows desde el parseGoogle", rows);
  if (!rows.length) return [];

  const headers = rows[0].map((header) => header?.toString() ?? "");
  const headerIndexMap = headers.reduce((acc, header, index) => {
    acc[normalizeHeader(header)] = index;
    return acc;
  }, {});

  const getColumnIndex = (...aliases) => {
    for (const alias of aliases) {
      const normalizedAlias = normalizeHeader(alias);
      if (headerIndexMap[normalizedAlias] !== undefined) {
        return headerIndexMap[normalizedAlias];
      }
    }
    return -1;
  };

  const productIndex = getColumnIndex("producto", "nombre", "descripcion");
  const priceIndex = getColumnIndex("precio", "preciounitario", "monto", "valor");
  const provinceIndex = getColumnIndex("provincia", "localidad");
  const dniIndex = getColumnIndex("dnicuit", "dni", "cuit", "dni/cuit");
  const addressIndex = getColumnIndex("direccion", "domicilio", "direccioncliente");
  const dateIndex = getColumnIndex("fecha", "fechaemision", "fecha de emisión");

  return rows.slice(1).reduce((acc, row) => {
    const producto = row?.[productIndex] ?? "";
    const precioRaw = row?.[priceIndex] ?? "";
    const precio = Number(
      precioRaw
        ?.toString()
        .replace(/\./g, "")
        .replace(/,/g, ".")
    );

    const hasData = [producto, precioRaw, row?.[provinceIndex], row?.[dniIndex], row?.[addressIndex], row?.[dateIndex]].some((value) => value !== undefined && value !== "");

    if (!hasData) return acc;

    acc.push({
      producto: producto?.toString().trim() || "",
      precio: Number.isFinite(precio) ? precio : 0,
      provincia: row?.[provinceIndex]?.toString().trim() || "",
      dniCuit: row?.[dniIndex]?.toString().trim() || "",
      direccion: row?.[addressIndex]?.toString().trim() || "",
      fecha: row?.[dateIndex]?.toString().trim() || "",
    });

    return acc;
  }, []);
}

// export async function getInventoryData() {
//   const { sheets, spreadsheetId } = await getSheetsClient();

//   const response = await sheets.spreadsheets.get({
//     spreadsheetId,
//     ranges: ["LOCAL MAXI!A:M"],
//     includeGridData: true,
//   });

//   const rows = response.data.sheets[0].data[0].rowData || [];

//   return rows
//     .filter((row) => {
//       const cells = row.values || [];

//       return cells.some((cell) => {
//         const value =
//           cell?.formattedValue ||
//           cell?.effectiveValue?.stringValue ||
//           cell?.effectiveValue?.numberValue;

//         return value !== undefined && value !== "";
//       });
//     })
//     .map((row, index) => {
//       const cells = row.values || [];

//       const codigo = getCellText(cells[0]);
//       const descripcion = getCellText(cells[1]);
//       const precio = getCellText(cells[2]);
//       const proveedora = getCellText(cells[10]) || "mío";

//       const estado = getCellText(cells[12]) || "en stock";

//       return {
//         id: index,
//         codigo,
//         descripcion,
//         precio,
//         proveedora,
//         estado,
//       };
//     });
// }

export async function getProvidersData() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    ranges: ["LOCAL MAXI!A:M"],
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

      const estado = getCellText(cells[12]) || "en stock";

      return {
        id: index,
        codigo,
        nombre,
        descripcion,
        precio: precioRaw,
        ganancia: "25%",
        estado,
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

export async function getPendingPayments() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "pagos maxi!A:H",
    });

    const rows = response.data.values || [];

    return rows
      .map((row, index) => ({
        id: index,
        fecha: row[0] || "",
        codigo: row[1] || "",
        descripcion: row[2] || "",
        proveedora: row[3] || "",
        porcentaje: row[4] || "",
        precioSugerido: Number(row[5]) || 0,
        totalProveedor: Number(row[6]) || 0,
        estado: (row[7] || "").toString().trim().toLowerCase() || "pendiente",
      }))
      .filter((payment) => payment.proveedora && payment.codigo);
  } catch (error) {
    console.error("Error cargando pagos maxi:", error);
    return [];
  }
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

// export async function addNewProvider(nombre, apellido, telefono, notas = '') {
//   const { sheets, spreadsheetId } = await getSheetsClient();

//   const values = [[nombre, apellido, telefono, notas]];

//   try {
//     await sheets.spreadsheets.values.append({
//       spreadsheetId,
//       range: 'proveedoras maxi!A:D',
//       valueInputOption: 'RAW',
//       requestBody: { values },
//     });

//     return { success: true, nombre, apellido, telefono };
//   } catch (err) {
//     throw new Error(`Failed to add provider: ${err.message}`);
//   }
// }

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
  const normalizedMetodoPago = (metodoPago || '').toLowerCase();
  const effectiveMetodoPago =
    normalizedMetodoPago === 'debito' || normalizedMetodoPago === 'credito'
      ? 'debito/credito'
      : normalizedMetodoPago;

  let precioVentaValue = { userEnteredValue: { numberValue: 0 } };
  let metodoPagoValue = { userEnteredValue: { stringValue: '' } };
  let gananciaValue = { userEnteredValue: { numberValue: 0 } };
  let pagoValue = { userEnteredValue: { stringValue: 'no' } };

  if (isVendido) {
    const rowData = sheet.data?.[0]?.rowData?.[rowIndex];
    const precioSuggeridoCell = rowData?.values?.[2];
    const precioSuggeridoRaw = getCellText(precioSuggeridoCell);
    const precioSuggeridoNum = Number(precioSuggeridoRaw) || 0;

    const porcentajeDueñaCell = rowData?.values?.[6];
    const porcentajeDueñaRaw = getCellText(porcentajeDueñaCell);
    const porcentajeDueñaNum = Number(porcentajeDueñaRaw) || 0;

    const proveedoraCell = rowData?.values?.[10];
    const proveedoraRaw = getCellText(proveedoraCell);
    const isOwnProduct = !proveedoraRaw || ['mío', 'mio'].includes(proveedoraRaw.toLowerCase());

    let precioVenta = precioVentaManual ? Number(precioVentaManual) : 0;

    if (!precioVentaManual && effectiveMetodoPago) {
      if (effectiveMetodoPago === 'efectivo') {
        precioVenta = precioSuggeridoNum * 0.90; // 10% discount
      } else if (effectiveMetodoPago === 'transferencia') {
        precioVenta = precioSuggeridoNum * 0.95; // 5% discount
      } else if (effectiveMetodoPago === 'debito/credito') {
        precioVenta = precioSuggeridoNum * 0.9441; // 5.59% discount
      }
    }

    const ganancia = precioVenta - porcentajeDueñaNum;

    precioVentaValue = { userEnteredValue: { numberValue: precioVenta } };
    metodoPagoValue = { userEnteredValue: { stringValue: effectiveMetodoPago || 'sin especificar' } };
    gananciaValue = { userEnteredValue: { numberValue: ganancia } };
    pagoValue = { userEnteredValue: { stringValue: isOwnProduct ? 'si' : 'pendiente' } };
  }

  const greenBackground = isVendido
    ? { red: 0.46666667, green: 0.76862745, blue: 0.16470588 }
    : { red: 1, green: 1, blue: 1 };
  const redBackground = isVendido
    ? { red: 1, green: 0, blue: 0 }
    : { red: 1, green: 1, blue: 1 };
  const estadoValue = {
    userEnteredValue: {
      stringValue: isVendido ? "vendido" : "en stock",
    },
  };
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
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 8,
              endColumnIndex: 9,
            },
            cell: pagoValue,
            fields: "userEnteredValue",
          },
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 12,
              endColumnIndex: 13,
            },
            cell: {
              userEnteredValue: {
                stringValue: isVendido ? "vendido" : "en stock",
              },
            },
            fields: "userEnteredValue",
          },
        },
      ],
    },
  });
}

//Agregar items al excel y generar un codigo de barras
export async function appendInventoryItems(items) {
  console.log("Items recibidos:", items.length);
  console.log(items);
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "LOCAL MAXI!A:B",
    majorDimension: "COLUMNS",
  });

  const columnAValues =
    (response.data.values && response.data.values[0]) || [];

  const columnBValues =
    (response.data.values && response.data.values[1]) || [];

  let lastNonEmptyRowB = 0;

  for (let i = columnBValues.length - 1; i >= 0; i--) {
    if (columnBValues[i]?.toString().trim()) {
      lastNonEmptyRowB = i + 1;
      break;
    }
  }

  const startRow = lastNonEmptyRowB + 1;

  const generatedBarcodes = [];
  const values = [];

  for (const item of items) {
    // Código único más seguro
    const codigo = `INV-${crypto.randomUUID().split("-")[0].toUpperCase()}`;

    // imprimir etiqueta
    // await generateBarcodeAndPrint(codigo);


    console.log("ESPERANDO 5 SEGUNDOS");

    await new Promise(resolve => setTimeout(resolve, 2000));


    generatedBarcodes.push({
      codigo,
      printed: true,
    });

    const precioNumber = Number(item.precio) || 0;

    const porcentajeDueña = precioNumber * 0.6;

    const fechaCarga = new Date()
      .toISOString()
      .split("T")[0];

    values.push([
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
      "en stock"
    ]);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `LOCAL MAXI!A${startRow}:M${startRow + values.length - 1
      }`,
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

export async function appendProviderPaymentOrders(items) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  // Filter only items that belong to a provider (not "mío" or empty)
  const providerItems = items.filter((item) => {
    const prov = (item.proveedora || "").trim().toLowerCase();
    return prov && prov !== "mío" && prov !== "mio";
  });

  if (providerItems.length === 0) {
    return { ordersCreated: 0 };
  }

  const fecha = new Date().toLocaleDateString("sv-SE");
  const PROVIDER_PERCENTAGE = 60;

  const values = providerItems.map((item) => {
    const precioSugerido = Number(item.precio) || 0;
    const montoProveedora = precioSugerido * (PROVIDER_PERCENTAGE / 100);

    return [
      fecha,
      item.codigo || "",
      item.descripcion || "",
      item.proveedora || "",
      `${PROVIDER_PERCENTAGE}%`,
      precioSugerido,
      montoProveedora,
      "pendiente",
    ];
  });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "pagos maxi!A:H",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    console.log(
      `Se crearon ${values.length} órdenes de pago en "pagos maxi"`,
    );

    return { ordersCreated: values.length };
  } catch (err) {
    console.error("Error escribiendo en pagos maxi:", err.message);
    throw new Error(`No se pudo registrar la orden de pago: ${err.message}`);
  }
}

export async function appendInvoiceRecord({
  facturaId,
  fecha,
  producto,
  montoTotal,
  metodoPago,
  items,
  cuit,
  tipoFactura,
}) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const values = [[
    facturaId,
    fecha,
    producto,
    montoTotal,
    metodoPago,
    "pendiente",
    tipoFactura,
    cuit,
    "",
    JSON.stringify(items || []),
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "facturacion maxi!A:J",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });

  return { facturaId };
}

export async function getInvoiceRecords() {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "facturacion maxi!A:J",
  });

  const rows = response.data.values || [];

  return rows
    .filter((row) => {
      if (!row.some((value) => value !== undefined && value !== "")) {
        return false;
      }
      const firstCell = (row[0] || "").toString().trim().toLowerCase();
      return firstCell !== "facturaid" && firstCell !== "fecha";
    })
    .map((row, index) => {
      const facturaId = (row[0] || "").toString().trim();
      const fecha = row[1] || "";
      const producto = row[2] || "";
      const montoTotal = Number(row[3]) || 0;
      const metodoPago = row[4] || "";
      const estadoFactura = row[5] || "pendiente";
      const tipoFactura = row[6] || "C";
      const cuit = row[7] || "";
      const comprobante = row[8] || "";
      let items = [];

      if (row[9]) {
        try {
          items = JSON.parse(row[9]);
        } catch {
          items = [];
        }
      }

      return {
        id: index,
        facturaId,
        fecha,
        producto,
        montoTotal,
        metodoPago,
        estadoFactura,
        tipoFactura,
        cuit,
        comprobante,
        items,
      };
    });
}

export async function updateInvoiceRecordStatus(facturaId, estadoFactura, comprobante = "") {
  const { sheets, spreadsheetId } = await getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "facturacion maxi!A:J",
  });

  const rows = response.data.values || [];
  const invoiceRowIndex = rows.findIndex((row) => (row[0] || "").toString().trim() === facturaId);

  if (invoiceRowIndex < 0) {
    throw new Error(`No se encontró la factura ${facturaId}`);
  }

  const sheetRow = invoiceRowIndex + 1;

  const data = [
    {
      range: `facturacion maxi!F${sheetRow}`,
      values: [[estadoFactura]],
    },
    {
      range: `facturacion maxi!I${sheetRow}`,
      values: [[comprobante]],
    },
  ];

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  });

  return { facturaId, estadoFactura, comprobante };
}

export async function updateProviderPaymentStatus(codigos, newStatus) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  // Read all rows from "pagos maxi"
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "pagos maxi!A:H",
  });

  const rows = response.data.values || [];
  const updatedRows = [];

  // Find rows matching the given codigos with status "pendiente"
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const codigo = (row[1] || "").trim();
    const currentStatus = (row[7] || "").trim().toLowerCase();

    if (codigos.includes(codigo) && currentStatus === "pendiente") {
      // Update column H (index 7) — sheet rows are 1-indexed
      const sheetRow = i + 1;
      updatedRows.push(sheetRow);
    }
  }

  if (updatedRows.length === 0) {
    return { updatedCount: 0 };
  }

  // Batch update all matching rows
  const data = updatedRows.map((sheetRow) => ({
    range: `pagos maxi!H${sheetRow}`,
    values: [[newStatus]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data,
    },
  });

  console.log(
    `Se actualizaron ${updatedRows.length} órdenes de pago a "${newStatus}" en "pagos maxi"`,
  );

  return { updatedCount: updatedRows.length };
}

export async function getOwnerTotalForMonth(month, year) {
  const { sheets, spreadsheetId } = await getSheetsClient();

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      ranges: ["LOCAL MAXI!A:L"],
      includeGridData: true,
    });

    const rows = response.data.sheets[0].data[0].rowData || [];

    let total = 0;

    rows.forEach((row) => {
      const cells = row.values || [];

      const fechaVentaRaw = getCellText(cells[4]); // columna E (fecha de venta)
      if (!fechaVentaRaw) return;

      const fechaVenta = new Date(fechaVentaRaw);
      if (Number.isNaN(fechaVenta.getTime())) return;

      if (fechaVenta.getMonth() === month && fechaVenta.getFullYear() === year) {
        const precioVenta = Number(getCellText(cells[3])) || 0; // columna D
        const precioSugerido = Number(getCellText(cells[2])) || 0; // columna C
        const ownerShare = precioVenta - precioSugerido * 0.6;
        total += ownerShare;
      }
    });

    return total;
  } catch (err) {
    console.error('Error calculando total de la dueña:', err.message);
    return 0;
  }
}
