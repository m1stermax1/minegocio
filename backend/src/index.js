import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import providersRoutes from "./routes/providersRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import paymentsRoutes from "./routes/paymentsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import invoicesRoutes from "./routes/invoicesRoutes.js";
import profilesRoutes from "./routes/profilesRoutes.js"

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
    credentials: true
  }),
);



app.use(express.json());
app.use("/barcodes", express.static(path.join(__dirname, "..", "barcodes")));
app.use("/api/auth", authRoutes);
app.use("/providers", providersRoutes);
app.use("/inventory", inventoryRoutes); 
app.use("/sales", salesRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/payments", paymentsRoutes);
app.use("/invoices", invoicesRoutes);
app.use("/profiles", profilesRoutes)




const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Backend iniciado en http://localhost:${port}`);
});
