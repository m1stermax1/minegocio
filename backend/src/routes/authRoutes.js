import express from "express";
import { createUserOrganization } from "../services/authService.js";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// router.post("/login", async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization; // "Bearer xxx"
//     console.log("Auth header", authHeader);
//     // if (!authHeader?.startsWith("Bearer ")) {
//     //   return res.status(401).json({
//     //     success: false,
//     //     error: "Missing Authorization Bearer token",
//     //   });
//     // }

//     // const token = authHeader.replace("Bearer ", "");

//     // const supabaseUrl = process.env.SUPABASE_URL;
//     // if (!supabaseUrl) throw new Error("Missing SUPABASE_URL env var");

//     // // Recomendado: usa la publishable key para backend con contexto de Auth (RLS)
//     // const publishableKeysRaw = process.env.SUPABASE_PUBLISHABLE_KEYS;
//     // if (!publishableKeysRaw) throw new Error("Missing SUPABASE_PUBLISHABLE_KEYS env var");

//     // const publishableKeys = JSON.parse(publishableKeysRaw);
//     // const anonKey = publishableKeys?.default;
//     // if (!anonKey) throw new Error("Could not find publishableKeys['default']");

//     // const supabase = createClient(supabaseUrl, anonKey, {
//     //   global: {
//     //     headers: { Authorization: `Bearer ${token}` },
//     //   },
//     // });

//     // // 1) Validar token y obtener user
//     // const {
//     //   data: { user },
//     //   error: userErr,
//     // } = await supabase.auth.getUser(token);

//     // if (userErr || !user) {
//     //   return res.status(401).json({
//     //     success: false,
//     //     error: "Invalid token",
//     //   });
//     // }

//     // const userId = user.id;

//     // // 2) Obtener profile + organization (con join por la FK)
//     // const { data, error } = await supabase
//     //   .from("profiles")
//     //   .select(
//     //     `
//     //     id,
//     //     email,
//     //     name,
//     //     created_at,
//     //     role,
//     //     organization_id,
//     //     organizations:organization_id (
//     //       id,
//     //       name,
//     //       created_at
//     //     )
//     //     `
//     //   )
//     //   .eq("id", userId)
//     //   .maybeSingle();

//     // if (error) {
//     //   return res.status(500).json({
//     //     success: false,
//     //     error: error.message,
//     //   });
//     // }

//     // // Si el profile todavía no existe (por ejemplo, antes de que corra tu /register)
//     // if (!data) {
//     //   return res.json({
//     //     success: true,
//     //     user: { id: user.id, email: user.email },
//     //     profile: null,
//     //     organization: null,
//     //   });
//     // }

//     // return res.json({
//     //   success: true,
//     //   user: { id: user.id, email: user.email },
//     //   profile: {
//     //     id: data.id,
//     //     email: data.email,
//     //     name: data.name,
//     //     created_at: data.created_at,
//     //     role: data.role,
//     //     organization_id: data.organization_id,
//     //   },
//     //   organization: data.organizations
//     //     ? {
//     //         id: data.organizations.id,
//     //         name: data.organizations.name,
//     //         created_at: data.organizations.created_at,
//     //       }
//     //     : null,
//     // });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     });
//   }
// });

router.post("/register", async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      businessName,
      createdAt,
    } = req.body;

    const organization =
      await createUserOrganization({
        name,
        userId,
        email,
        businessName,
      });

    res.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;