import express from "express";
import { getInvoices } from "../controllers/invoices/invoices.controller.js";
import { supabase } from "../services/supabaseService.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const invoices = await getInvoices();

        res.json({
            success: true,
            data: invoices || [],
        });
    } catch (error) {
        console.error("Error al cargar payments:", error);

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

router.post("/add", async (req, res) => {
    try {
        const { orgId, total_amout } = req.body;
        console.log("Body: ", req.body);

        const { data, error } = await supabase
            .from("invoices")
            .insert({
                organization_id: orgId,
                price: total_amout,
                created_at: new Date().toISOString(),
            })
            .select();

        if (error) {
            throw error;
        }

        return res.status(201).json({
            success: true,
            provider: "test",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});


export default router;