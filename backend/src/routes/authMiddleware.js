import { supabase } from "../services/supabaseService.js";
import { getOrganizationIdByUser } from "../controllers/users/users.controller.js";

export default async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(
      "Bearer ",
      ""
    );

    if (!token) {
      return res.status(401).json({
        error: "Token requerido",
      });
    }

    const {
      data: {user},
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Token inválido",
      });
    }

    const organizationId = await getOrganizationIdByUser(user.id)
    req.user = {
      ...user,
      ...organizationId
    }

    next();
  } catch (err) {
    return res.status(401).json({
      error: "No autorizado",
    });
  }
};