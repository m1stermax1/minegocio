import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import inventoryRoutes from "./routes/inventoryRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CARGA EXPLICITA DEL .ENV
// dotenv.config({
//   path: path.resolve(__dirname, "../.env"),
// });

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/barcodes', express.static(path.join(__dirname, '..', 'barcodes')));

app.use("/inventory", inventoryRoutes);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(
    `Backend iniciado en http://localhost:${port}`,
  );
});