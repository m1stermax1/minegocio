import { supabase } from "../services/supabase.js";

export async function registerUser({ name, email, password, businessName }) {
  console.log(name);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) {
    throw error;
  }

  const response = await fetch("http://localhost:3001/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: data.user.id,
      name,
      email,
      businessName,
    }),
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

  console.log("LOGIN DATA:", data);
  console.log("LOGIN ERROR:", error);

  if (error) throw error;


  return data;
}

export async function logoutUser() {
  await supabase.auth.signOut();
}
