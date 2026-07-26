import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://yatuqlksqovgkczzumzo.supabase.co",
  "sb_publishable__KIj1REr4hQXJeoAlYu1lA_1tLL6yDn",
);
const USER_KEY = "vt_user";

async function profileFor(user) {
  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,active,permissions")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email,
    name: data?.full_name || user.user_metadata?.full_name || user.email,
    role: data?.role || "cliente",
    active: data?.active !== false,
    permissions: data?.permissions || [],
  };
}

async function saveSession(user) {
  const profile = await profileFor(user);
  if (!profile.active) throw new Error("Tu cuenta está deshabilitada.");
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
  return profile;
}

async function register(event) {
  event.preventDefault();
  const inputs = event.target.querySelectorAll("input");
  if (inputs[5].value !== inputs[6].value) return alert("Las contraseñas no coinciden.");
  const fullName = `${inputs[0].value} ${inputs[1].value}`.trim();
  const { data, error } = await supabase.auth.signUp({
    email: inputs[4].value.trim(),
    password: inputs[5].value,
    options: { data: { full_name: fullName, document: inputs[2].value, phone: inputs[3].value } },
  });
  if (error) return alert(error.message);
  if (!data.session) {
    alert("Cuenta creada. Revisa tu correo y confirma tu cuenta antes de ingresar.");
    return;
  }
  await saveSession(data.user);
  location.href = new URLSearchParams(location.search).get("next") || "mi-cuenta.html";
}

async function login(event) {
  event.preventDefault();
  const fields = event.target.querySelectorAll("input");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: fields[0].value.trim(),
    password: fields[1].value,
  });
  if (error || !data.user) return alert(error?.message || "No fue posible iniciar sesión.");
  try {
    await saveSession(data.user);
    location.href = new URLSearchParams(location.search).get("next") || "mi-cuenta.html";
  } catch (reason) {
    await supabase.auth.signOut();
    alert(reason instanceof Error ? reason.message : "No fue posible validar la cuenta.");
  }
}

async function recover() {
  const email = prompt("Escribe tu correo registrado:");
  if (!email) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}${location.pathname}`,
  });
  alert(error ? error.message : "Revisa tu correo para restablecer la contraseña.");
}

window.VentechSupabase = { supabase, profileFor, saveSession };
window.VT.register = register;
window.VT.login = login;
window.VT.recover = recover;

supabase.auth.getUser().then(async ({ data }) => {
  if (data.user) {
    try { await saveSession(data.user); } catch (_) { /* La validación se realiza al ingresar. */ }
  }
});
