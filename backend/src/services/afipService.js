import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Afip from "@afipsdk/afip.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CERT_PATH = path.join(__dirname, "..\\afip\\minegociokey.crt");
const KEY_PATH = path.join(__dirname, "..\\afip\\privada.key");
const CUIT = 2039152322;

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
    Concepto: concepto,
    DocTipo: clienteDocTipo,
    DocNro: clienteDocNro,
    MonId: "PES",
    MonCotiz: 1,
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: base,
    ImpOpEx: 0,
    ImpIVA: iva,
    ImpTrib: 0,
    PtoVta: puntoVenta,
    CbteTipo: 11,
    CbteFch: parseInt(date.replace(/-/g, ""), 10),
    Compradores: [
      {
        DocTipo: clienteDocTipo,
        DocNro: clienteDocNro,
        Porcentaje: 100,
      },
    ],
    Iva: [
      {
        Id: 5,
        BaseImp: base,
        Importe: iva,
      },
    ],
    Opcionales: [
      {
        Id: 17,
        Valor: facturaId,
      },
    ],
  };

  const result = await afip.ElectronicBilling.createNextVoucher(data);
  return result;
}
