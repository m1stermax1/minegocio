import { supabase } from "../services/supabase.js";
import axios from "axios";
import { getSessionUser } from "./users";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
});

export async function registerUser({
  name,
  email,
  password,
  businessName,
  genre,
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    throw error;
  }

  const response = await api.post("/api/auth/register", {
    userId: data.user.id,
    name,
    email,
    businessName,
    genre,
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error);
  }

  return result;
}

export async function loginUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function logoutUser() {
  await supabase.auth.signOut();
}
