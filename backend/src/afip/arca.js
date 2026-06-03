
import dotenv from "dotenv";
import { readFileSync } from "fs";
import Afip from "@afipsdk/afip.js";

dotenv.config();

const afip = new Afip({
  CUIT: 20391523224,
  cert: process.env.MINEGOCIO_KEY,
  key: process.env.MINEGOCIO_KEY,
  production: true,
});

export default afip;