import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bwipjs from "bwip-js";
import sharp from "sharp";
import crypto from "crypto";
import { exec } from "child_process";
import {
  getProvidersData,
  setInventoryRowStatus,
  appendInventoryItems,
  getProvidersListComplete,
  appendSaleRecord,
  appendProviderPaymentOrders,
  appendInvoiceRecord,
  getInvoiceRecords,
  updateInvoiceRecordStatus,
  updateProviderPaymentStatus,
  getOwnerTotalForMonth,
  getPendingPayments,
  parseGoogleSheetInvoiceData,
} from "../services/sheetsService.js";
import { parsePrice } from "../utils/parsePrice.js";
import { issueFacturaC } from "../services/afipService.js";
import {
  sendWhatsAppMessage,
  formatPhoneNumber,
  isValidPhoneNumber,
} from "../services/whatsappService.js";
import {
  createTransferLink,
  isValidAlias,
  isValidCBU,
} from "../services/mercadoPagoService.js";
import twilio from "twilio";
import {
  getInventory,
  addItemToInventory,
  changeItemStatus,
  deleteInventoryItems,
} from "../controllers/inventory/inventory.controller.js";
import { supabase } from "../services/supabaseService.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const client = twilio(accountSid, authToken);

const STORE_ID = process.env.TIENDANUBE_STORE_ID;
const ACCESS_TOKEN = process.env.TIENDANUBE_ACCESS_TOKEN;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "..", "..", "temp");
fs.mkdirSync(TEMP_DIR, { recursive: true });

async function generateBarcodeAndPrint(code) {
  const safeCode = code.replace(/[^A-Za-z0-9_-]/g, "_");

  const filePath = path.join(TEMP_DIR, `${safeCode}-${Date.now()}.png`);

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

  const NIIM_MODEL = process.env.NIIM_MODEL || "d110";
  const NIIM_CONN = process.env.NIIM_CONN || "usb";
  const NIIM_ADDR = process.env.NIIM_ADDR || ""; // vacío = auto-detect
  const NIIM_DENSITY = process.env.NIIM_DENSITY || "3";
  const addrFlag = NIIM_ADDR ? `-a "${NIIM_ADDR}"` : "";
  const cmd = [
    "python -m niimprint",
    `-m ${NIIM_MODEL}`,
    `-c ${NIIM_CONN}`,
    addrFlag,
    `--density ${NIIM_DENSITY}`,
    `-i "${filePath}"`,
  ]
    .filter(Boolean) // elimina el addrFlag vacío
    .join(" ");
  console.log("INICIO IMPRESION:", code);
  console.log("CMD:", cmd);

  await new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      console.log("FIN IMPRESION:", code);
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      if (error) {
        reject(stderr || error.message);
        return;
      }

      resolve();
    });
  });


  fs.unlinkSync(filePath);

  return {
    success: true,
    code,
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const all = req.query.all === "true" || req.query.all === "1";
    const selectedProvider = req.query.provider_id || null;

    const inventory = await getInventory(
      organizationId,
      page,
      limit,
      selectedProvider,
      all,
    );

    res.json(inventory);
  } catch (error) {
    console.error("Error al cargar inventario:", error);
    res.status(500).json({ error: "No se pudo cargar el inventario" });
  }
});

router.post("/add", async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];

  if (!items.length) {
    return res
      .status(400)
      .json({ error: "No se recibieron items para agregar." });
  }

  const preparedItems = [];
  const generatedBarcodes = [];
  for (const item of items) {
    const codigo = `INV${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    const nombre = item?.nombre?.toString().trim();
    const precio = item?.precio?.toString().trim();
    const proveedora = item?.proveedora?.toString().trim();
    const profile = item?.profile_id?.toString().trim();
    const orgId = item?.orgId;
    const providerName = item?.providerName;

    if (!nombre || !precio) {
      return res.status(400).json({
        error:
          "Campos inválidos. nombre, precio y proveedora son obligatorios.",
      });
    }

    const precioNumero = parsePrice(precio);
    if (!Number.isFinite(precioNumero)) {
      return res.status(400).json({ error: "Precio inválido" });
    }

    preparedItems.push({
      nombre,
      precio: precioNumero,
      proveedora,
      orgId,
      providerName,
      barcode: codigo,
      profile,
    });

    generatedBarcodes.push({ codigo });
  }

  try {
    const result = await addItemToInventory(preparedItems);

    res.json({
      success: true,
      data: result?.data,
      barcodes: generatedBarcodes,
    });
  } catch (error) {
    console.error("Error agregando item en Sheets:", error);
    res.status(500).json({ error: "No se pudo agregar el item" });
  }
});

router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log("Llego aca?", req.body);

  const { data, error } = await supabase
    .from("inventory")
    .update({ status })
    .eq("id", id)
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
});

router.post("/facturas/desde-tabla", authMiddleware, async (req, res) => {
  try {
    const { rows = [], status = "OK" } = req.body || {};

    if (!Array.isArray(rows) || rows.length === 0) {
      return res
        .status(400)
        .json({ error: "No hay registros para actualizar." });
    }

    console.log("Rows de la tabla", rows);

    for (const [index, row] of rows.entries()) {
      const invoiceResult = await issueFacturaC({
        facturaId: `GS-${Date.now()}-${index + 1}`,
        montoTotal: parsePrice(row.precio),
        items: [
          {
            descripcion: "producto",
            precio: parsePrice(row.precio),
          },
        ],
        clienteNombre: "Consumidor Final",
        clienteProvincia: row?.provincia || '',
        clienteDomicilio: row?.direccion || '',
        clienteDoc: row?.dniCuit || '',
        tipoFactura: "C",
        monotributista: true,
      });
    }

    const updatedRows = [];
    for (const row of rows) {
      const facturaId = row?.facturaId || row?.id || row?.factura_id;
      const currentStatus = String(row?.status || "").trim().toUpperCase();

      if (!facturaId || currentStatus !== "PENDING") {
        continue;
      }

      const { data, error } = await supabase
        .from("invoices")
        .update({
          status: status,
        })
        .eq("id", facturaId)
        .select();

      if (error) {
        console.error("Error actualizando factura desde tabla:", error);
        continue;
      }

      if (Array.isArray(data) && data.length > 0) {
        updatedRows.push(data[0]);
      }
    }

    return res.json({
      success: true,
      updatedCount: updatedRows.length,
      rows: updatedRows,
    });
  } catch (error) {
    console.error("Error al actualizar facturas desde la tabla:", error);
    return res.status(500).json({
      error: error.message || "No se pudieron actualizar las facturas",
    });
  }
});

router.post("/facturas/google-sheets", authMiddleware, async (req, res) => {
  try {
    const { sheetUrl, preview = false } = req.body || {};

    if (!sheetUrl) {
      return res
        .status(400)
        .json({ error: "Se requiere una URL de Google Sheets" });
    }
    const products = await parseGoogleSheetInvoiceData(sheetUrl);
    console.log("Product de inventoryRoutes", products);

    if (!products.length) {
      return res.status(400).json({
        error: "No se encontraron productos para facturar en la hoja",
      });
    }

    if (preview) {
      return res.json({
        success: true,
        count: products.length,
        preview: {
          productCount: products.length,
          products: products.slice(0, 3),
        },
      });
    }

    const invoices = [];
    for (const [index, product] of products.entries()) {
      const invoiceResult = await issueFacturaC({
        facturaId: `GS-${Date.now()}-${index + 1}`,
        montoTotal: parsePrice(product.precio),
        items: [
          {
            descripcion: product.producto,
            precio: parsePrice(product.precio),
          },
        ],
        clienteNombre: "Consumidor Final",
        clienteProvincia: product.provincia,
        clienteDomicilio: product.direccion,
        clienteDoc: product.dniCuit,
        tipoFactura: "C",
        monotributista: true,
      });

      invoices.push({
        producto: product?.producto,
        precio: product?.precio,
        provincia: product?.provincia,
        dniCuit: product?.dniCuit,
        direccion: product?.direccion,
        fecha: product?.fecha,
        invoiceResult,
      });
    }

    return res.json({ success: true, count: invoices.length, invoices });
  } catch (error) {
    console.error("Error al facturar desde Google Sheets:", error);
    return res
      .status(500)
      .json({ error: error.message || "No se pudo facturar" });
  }
});

  // await new Promise((resolve) => setTimeout(resolve, 2000));


router.post("/print-barcode", async (req, res) => {
  try {
    const codigo = req.body?.barcode;

    await generateBarcodeAndPrint(codigo);

    return res.json({
      success: true,
      barcode: codigo,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

router.delete("/", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const { ids, onlyAvailable = true } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un array de IDs no vacío",
      });
    }

    const result = await deleteInventoryItems(
      ids,
      organizationId,
      onlyAvailable,
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Error al eliminar items:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const { id } = req.params;

    const result = await deleteInventoryItems([id], organizationId, false);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Error al eliminar item:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
