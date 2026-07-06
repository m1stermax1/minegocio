import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Afip from "@afipsdk/afip.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERT_PATH = process.env.TEST_CERT_PATH_KEY;
const KEY_PATH = process.env.TEST_KEY_PATH_ID;
const CUIT = process.env.ARCA_CUIT;

// console.log("Usando certificado:", CERT_PATH);
// console.log("Usando clave:", KEY_PATH);

function computeTaxFields(totalAmount) {
  const total = Number(totalAmount) || 0;
  const base = Number((total / 1.21).toFixed(2));
  const iva = Number((total - base).toFixed(2));
  return { base, iva, total };
}

// const afip = new Afip({
//   CUIT,
//   cert: fs.readFileSync(CERT_PATH, "utf8"),
//   key: fs.readFileSync(KEY_PATH, "utf8"),
//   production: false,
//   access_token: process.env.AFIP_ACCESS_TOKEN,
// });

export async function issueFacturaC({
  facturaId,
  montoTotal,
  items = [],
  cuit = CUIT,
  puntoVenta = 1,
  clienteDocTipo = 99,
  clienteDocNro = 0,
  concepto = 1,
  clienteNombre = "Consumidor Final",
  clienteProvincia = "",
  clienteDomicilio = "",
  clienteDoc = "",
  tipoFactura = "C",
  monotributista = true,
}) {
  const { base, iva, total } = computeTaxFields(montoTotal);
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const data = {
    Concepto: concepto,
    DocTipo: clienteDocTipo,
    DocNro: clienteDocNro,
    MonId: "PES",
    MonCotiz: 1,
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: total,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0,
    PtoVta: puntoVenta,
    CbteTipo: tipoFactura === "C" ? 11 : 6,
    CondicionIVAReceptorId: 5,
    CbteFch: parseInt(date.replace(/-/g, ""), 10),
    Observaciones: monotributista
      ? "Factura C emitida a consumidor final desde monotributista"
      : "Factura emitida",
    Cliente: {
      nombre: clienteNombre,
      provincia: clienteProvincia,
      domicilio: clienteDomicilio,
      documento: clienteDoc || clienteDocNro,
    },
    Items: items.map((item) => ({
      descripcion: item?.descripcion || item?.nombre || "Producto",
      precio: Number(item?.precio ?? item?.monto ?? 0),
      cantidad: item?.cantidad ?? 1,
    })),
  };

  // PROD
  // const certPath = process.env.CERT_PATH_KEY || process.env.TEST_CERT_PATH_KEY;
  // const keyPath = process.env.KEY_PATH_ID || process.env.TEST_KEY_PATH_ID;

  // TEST
    const certPath = process.env.TEST_CERT_PATH_KEY;
  const keyPath = process.env.TEST_KEY_PATH_ID;


  if (!certPath || !keyPath) {
    return {
      success: true,
      mocked: true,
      facturaId,
      message: "No hay credenciales ARCA configuradas; se devolvió un resultado simulado.",
      data,
    };
  }

  const certFilePath = path.resolve(__dirname, "..", "..", certPath);
  const keyFilePath = path.resolve(__dirname, "..", "..", keyPath);

  if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    return {
      success: true,
      mocked: true,
      facturaId,
      message: "No se encontró el certificado o la clave ARCA; se devolvió un resultado simulado.",
      data,
    };
  }

  const afip = new Afip({
    CUIT: cuit,
    cert: fs.readFileSync(certFilePath, "utf8"),
    key: fs.readFileSync(keyFilePath, "utf8"),
    production: false,
    access_token: process.env.AFIP_ACCESS_TOKEN,
  });

  const result = await afip.ElectronicBilling.createNextVoucher(data);
  return { success: true, mocked: false, facturaId, result };
}

