import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventoryRoutes.js";

import authRoutes from "./routes/authRoutes.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CARGA EXPLICITA DEL .ENV
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://minegocio-gold.vercel.app",
    ],
  }),
);

app.use(express.json());
app.use("/barcodes", express.static(path.join(__dirname, "..", "barcodes")));
app.use("/api/auth", authRoutes);
app.use("/inventory", inventoryRoutes);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Backend iniciado en http://localhost:${port}`);
});
