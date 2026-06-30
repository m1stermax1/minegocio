import express from "express";
import {
  getProviders,
  deleteProviders,
} from "../controllers/providers/providers.controller.js";
import { getUsers } from "../controllers/users/users.controller.js";
import { supabase } from "../services/supabaseService.js";
import authMiddleware from "./authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
        const organizationId = req.user?.organization_id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
    const result = await getProviders(organizationId, page, limit);
    res.json({
      success: true,
      data: result.data,
      total: result.count,
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

router.delete("/", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const { ids, alsoDeleteItems = false } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un array de IDs no vacío",
      });
    }

    const result = await deleteProviders(ids, organizationId, alsoDeleteItems);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Error al eliminar proveedoras:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const organizationId = req.user?.organization_id;
    const { id } = req.params;

    const result = await deleteProviders([id], organizationId, false);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Error al eliminar proveedora:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;