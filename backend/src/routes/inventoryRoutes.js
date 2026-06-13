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
} from "../services/sheetsService.js";
import {
  issueFacturaC,
} from "../services/afipService.js";
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
import { getInventory, addItemToInventory } from "../controllers/inventory/inventory.controller.js";

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;
const client = twilio(accountSid, authToken);

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

router.get("/", async (req, res) => {
  try {
    const inventory = await getInventory();
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
  for (const item of items) {
    const codigo = `INV${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    const nombre = item.nombre?.toString().trim();
    const precio = item.precio?.toString().trim();
    const proveedora = item.proveedora?.toString().trim();
    const orgId = item.orgId;
    const providerName = item?.providerName;

    if (!nombre || !precio || !proveedora) {
      return res
        .status(400)
        .json({
          error:
            "Campos inválidos. nombre, precio y proveedora son obligatorios.",
        });
    }

    const precioNumero = Number(precio.replace(/,/g, "."));
    if (Number.isNaN(precioNumero)) {
      return res.status(400).json({ error: "Precio inválido" });
    }

    preparedItems.push({ nombre, precio: precioNumero, proveedora, orgId, providerName, barcode: codigo });

    // imprimir etiqueta
    await generateBarcodeAndPrint(codigo);
    console.log("ESPERANDO 5 SEGUNDOS");

    await new Promise(resolve => setTimeout(resolve, 2000));
  }



  try {
    const result = await addItemToInventory(preparedItems);

    // const barcodeUrls = result?.data?.generatedBarcodes.map(
    //   ({ codigo, fileName }) => ({
    //     codigo,
    //     url: `/barcodes/${fileName}`,
    //   }),
    // );
    console.log("Lista de codigos de barras: ", barcodeUrls);
    res.json({ success: true, barcodes: "test" });
  } catch (error) {
    console.error("Error agregando item en Sheets:", error);
    res.status(500).json({ error: "No se pudo agregar el item" });
  }
});

router.put("/:id/status", async (req, res) => {
  const rowIndex = Number(req.params.id);
  const { estado, metodoPago, precioVentaManual } = req.body;

  if (Number.isNaN(rowIndex) || rowIndex < 0) {
    return res.status(400).json({ error: "ID de fila inválido" });
  }

  if (!estado || !["vendido", "en stock"].includes(estado.toLowerCase())) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  try {
    await setInventoryRowStatus(
      rowIndex,
      estado,
      metodoPago,
      precioVentaManual,
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error actualizando estado en Sheets:", error);
    res.status(500).json({ error: "No se pudo actualizar el estado" });
  }
});

// Endpoints para Proveedoras
// router.get("/providers-list", async (req, res) => {
//   try {
//     const providers = await getProvidersListComplete();
//     res.json(providers);
//   } catch (error) {
//     console.error("Error al cargar lista completa de proveedoras:", error);
//     res
//       .status(500)
//       .json({ error: "No se pudo cargar la lista de proveedoras" });
//   }
// });

// router.get("/providers/payments", async (req, res) => {
//   try {
//     const providers = await getPendingPayments();
//     res.json(providers);
//   } catch (error) {
//     console.error("Error al cargar lista completa de proveedoras:", error);
//     res
//       .status(500)
//       .json({ error: "No se pudo cargar la lista de proveedoras" });
//   }
// });

// router.put("/providers/payments/status", async (req, res) => {
//   const { codigos, status } = req.body;

//   if (!Array.isArray(codigos) || codigos.length === 0) {
//     return res.status(400).json({ error: "Debe enviar al menos un código de producto." });
//   }

//   const validStatuses = ["contactado", "pagado", "pendiente"];
//   if (!status || !validStatuses.includes(status.toLowerCase())) {
//     return res.status(400).json({ error: `Estado inválido. Valores válidos: ${validStatuses.join(", ")}` });
//   }

//   try {
//     const result = await updateProviderPaymentStatus(codigos, status.toLowerCase());
//     res.json({ success: true, updatedCount: result.updatedCount });
//   } catch (error) {
//     console.error("Error actualizando estado de pago:", error);
//     res.status(500).json({ error: "No se pudo actualizar el estado de pago" });
//   }
// });

// router.post("/providers", async (req, res) => {
//   const { nombre, apellido, telefono, notas } = req.body;

//   if (!nombre || !apellido || !telefono) {
//     return res
//       .status(400)
//       .json({ error: "nombre, apellido y telefono son obligatorios" });
//   }

//   try {
//     const result = await addNewProvider(
//       nombre,
//       apellido,
//       telefono,
//       notas || "",
//     );
//     res.json(result);
//   } catch (error) {
//     console.error("Error agregando proveedora:", error);
//     res.status(500).json({ error: "No se pudo agregar la proveedora" });
//   }
// });

// WhatsApp endpoint
// router.post("/whatsapp/send", async (req, res) => {
//   const { phoneNumber, message, items } = req.body;

//   if (!phoneNumber || !message) {
//     return res
//       .status(400)
//       .json({ error: "phoneNumber y message son obligatorios" });
//   }

//   await client.messages.create({
//     from: `whatsapp:${twilioPhoneNumber}`,
//     to: `whatsapp:+${phoneNumber}`,
//     body: message,
//   });

//   try {
//     // Validar y formatear número de teléfono
//     if (!isValidPhoneNumber(phoneNumber)) {
//       return res.status(400).json({ error: "Número de teléfono inválido" });
//     }

//     const formattedPhone = formatPhoneNumber(phoneNumber);
//     const whatsappProvider = process.env.WHATSAPP_PROVIDER || "twilio";

//     // Enviar mensaje
//     const result = await sendWhatsAppMessage(
//       formattedPhone,
//       message,
//       whatsappProvider,
//     );

//     console.log(
//       `WhatsApp enviado a ${formattedPhone}: ${message.substring(0, 50)}...`,
//     );

//     res.json({
//       success: true,
//       message: "Mensaje de WhatsApp enviado exitosamente",
//       phoneNumber: formattedPhone,
//       provider: whatsappProvider,
//       messageId: result.messageId,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Error enviando WhatsApp:", error);
//     res.status(500).json({
//       error: "No se pudo enviar el mensaje de WhatsApp",
//       details: error.message,
//     });
//   }
// });

// // Mercado Pago endpoint
// router.post("/mercadopago/transfer", async (req, res) => {
//   const { alias, cbu, amount, proveedora } = req.body;

//   if (!alias && !cbu) {
//     return res.status(400).json({ error: "Se requiere alias o CBU" });
//   }

//   if (!amount || amount <= 0) {
//     return res.status(400).json({ error: "Monto inválido" });
//   }

//   try {
//     // Validar alias o CBU
//     if (alias && !isValidAlias(alias)) {
//       return res
//         .status(400)
//         .json({
//           error:
//             "Alias inválido (6-20 caracteres, solo letras, números, punto y guión)",
//         });
//     }

//     if (cbu && !isValidCBU(cbu)) {
//       return res
//         .status(400)
//         .json({ error: "CBU inválido (debe tener 22 dígitos)" });
//     }

//     // Generar URL de transferencia
//     const redirectUrl = await createTransferLink(
//       alias,
//       cbu,
//       amount,
//       proveedora || "Proveedor",
//     );

//     console.log(
//       `Transferencia Mercado Pago: ${amount} a ${alias || cbu} para ${proveedora}`,
//     );

//     res.json({
//       success: true,
//       redirectUrl: redirectUrl,
//       message: `Transferencia de $${amount} a ${proveedora || alias || cbu}`,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("Error con Mercado Pago:", error);
//     res.status(500).json({
//       error: "No se pudo procesar la transferencia de Mercado Pago",
//       details: error.message,
//     });
//   }
// });

export default router;
