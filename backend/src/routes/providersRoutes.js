import express from "express";
import { getProviders } from "../controllers/providers/providers.controller.js";

const router = express.Router();

router.get("/", async (req, res) => {
   

    try {
        const providers = await getProviders();

        res.json({
            success: true,
            data: providers || [],
        });
    } catch (error) {
        console.error("Error al cargar proveedoras:", error);

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

router.post("/add", async (req, res) => { });

export default router