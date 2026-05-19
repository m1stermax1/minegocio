import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import inventoryRoutes from "./routes/inventoryRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/inventory", inventoryRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Backend iniciado en http://localhost:${port}`);
});
