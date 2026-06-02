import { readFileSync } from "fs";
import Afip from "@afipsdk/afip.js";

const afip = new Afip({
  CUIT: 20391523224,
  cert: readFileSync("./afip/certificado.crt"),
  key: readFileSync("./afip/privada.key"),
  production: true,
});

export default afip;