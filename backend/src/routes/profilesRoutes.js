import express from "express";
import { getProfiles } from "../controllers/profiles/profiles.controller.js";
import { supabase } from "../services/supabaseService.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

router.get("/",authMiddleware, async (req, res) => {
    try {
        const organizationId = req.user?.organization_id
        const profiles = await getProfiles(organizationId);

        res.json(profiles);
    } catch (error) {
        console.error("Error al cargar profiles:", error);

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;