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

console.log("Usando certificado:", CERT_PATH);
console.log("Usando clave:", KEY_PATH);

function computeTaxFields(totalAmount) {
  const total = Number(totalAmount) || 0;
  const base = Number((total / 1.21).toFixed(2));
  const iva = Number((total - base).toFixed(2));
  return { base, iva, total };
}

const afip = new Afip({
  CUIT,
  cert: fs.readFileSync(CERT_PATH, "utf8"),
  key: fs.readFileSync(KEY_PATH, "utf8"),
  production: false,
  access_token: process.env.AFIP_ACCESS_TOKEN,
});

export async function issueFacturaC({
  facturaId,
  montoTotal,
  items = [],
  cuit = CUIT,
  puntoVenta = 1,
  clienteDocTipo = 99,
  clienteDocNro = 0,
  concepto = 1,
}) {
  const { base, iva, total } = computeTaxFields(montoTotal);
  const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

  const data = {
    Concepto: 1,
    DocTipo: 99,
    DocNro: 0,
    MonId: "PES",
    MonCotiz: 1,
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: total,
    ImpOpEx: 0,
    ImpIVA: 0,
    ImpTrib: 0,
    PtoVta: 1,
    CbteTipo: 11,
    CondicionIVAReceptorId: 5,
    CbteFch: parseInt(date.replace(/-/g, ""), 10),
  };

  const result = await afip.ElectronicBilling.createNextVoucher(data);
  return result;
}

