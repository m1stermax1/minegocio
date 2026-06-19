import express from "express";
import { getProviders } from "../controllers/providers/providers.controller.js";
import { getUsers } from "../controllers/users/users.controller.js";
import { supabase } from "../services/supabaseService.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
        const organizationId = req.user?.organization_id
    const providers = await getProviders(organizationId);
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

router.post("/add", async (req, res) => {
  try {
    const { getOrganizationId, nombre, apellido, telefono, bankalias } = req.body;
    console.log("Body: ", req.body);

    const { data, error } = await supabase
      .from("providers")
      .insert([
        {
          organization_id: getOrganizationId,
          first_name: nombre,
          last_name: apellido,
          phone: telefono,
          bankalias: bankalias,
          created_at: new Date().toISOString(),
        },
      ])
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
