import express from "express";
import { getInvoices } from "../controllers/invoices/invoices.controller.js";
import { supabase } from "../services/supabaseService.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const organizationId = req.user?.organization_id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const result = await getInvoices(organizationId, page, limit);

        res.json({
            success: true,
            data: result.data,
            total: result.count,
        });
    } catch (error) {
        console.error("Error al cargar facturas:", error);

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