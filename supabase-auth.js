import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://yatuqlksqovgkczzumzo.supabase.co",
  "sb_publishable__KIj1REr4hQXJeoAlYu1lA_1tLL6yDn",
);
const USER_KEY = "vt_user";
const RECOVERY_SENT_KEY = "vt_recovery_sent_at";

function authMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  if (
    code === "over_email_send_rate_limit" ||
    message.includes("email rate limit exceeded")
  ) {
    return "Se alcanzó el límite temporal de correos de Supabase. Espera aproximadamente una hora antes de volver a intentarlo.";
  }
  if (message.includes("email address not authorized")) {
    return "El servicio de correo de prueba no autoriza esta dirección. El administrador debe configurar un servidor SMTP propio en Supabase.";
  }
  if (message.includes("same password")) {
    return "La contraseña nueva debe ser diferente de la anterior.";
  }
  if (message.includes("weak") || message.includes("characters")) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }
  return error?.message || "No fue posible completar la solicitud.";
}

function showPanel(panel) {
  ["login", "register", "recover", "resetPassword"].forEach((id) => {
    document.getElementById(id)?.classList.toggle("hide", id !== panel);
  });
  document.getElementById("authTabs")?.classList.toggle(
    "hide",
    panel === "recover" || panel === "resetPassword",
  );
}

function showLogin() {
  showPanel("login");
}

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

async function recover(event) {
  if (!event) {
    const loginEmail = document.querySelector("#login input[type='email']")?.value || "";
    document.getElementById("recoverEmail").value = loginEmail;
    document.getElementById("recoverStatus").textContent = "";
    showPanel("recover");
    return;
  }
  event.preventDefault();
  const email = document.getElementById("recoverEmail").value.trim();
  const status = document.getElementById("recoverStatus");
  const button = document.getElementById("recoverButton");
  const lastSent = Number(localStorage.getItem(RECOVERY_SENT_KEY) || 0);
  const secondsLeft = Math.ceil((lastSent + 60000 - Date.now()) / 1000);
  if (secondsLeft > 0) {
    status.textContent = `Espera ${secondsLeft} segundos antes de solicitar otro enlace.`;
    status.classList.add("error");
    return;
  }
  button.disabled = true;
  status.textContent = "Enviando enlace...";
  status.classList.remove("error", "success");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/auth.html`,
  });
  button.disabled = false;
  if (error) {
    status.textContent = authMessage(error);
    status.classList.add("error");
    return;
  }
  localStorage.setItem(RECOVERY_SENT_KEY, String(Date.now()));
  status.textContent =
    "Si el correo está registrado y el servicio está disponible, recibirás un enlace de recuperación. Revisa también spam.";
  status.classList.add("success");
}

async function updatePassword(event) {
  event.preventDefault();
  const password = document.getElementById("newPassword").value;
  const confirmation = document.getElementById("confirmNewPassword").value;
  const status = document.getElementById("resetStatus");
  const button = document.getElementById("resetButton");
  status.classList.remove("error", "success");
  if (password !== confirmation) {
    status.textContent = "Las contraseñas no coinciden.";
    status.classList.add("error");
    return;
  }
  button.disabled = true;
  status.textContent = "Guardando contraseña...";
  const { error } = await supabase.auth.updateUser({ password });
  button.disabled = false;
  if (error) {
    status.textContent = authMessage(error);
    status.classList.add("error");
    return;
  }
  status.textContent = "Contraseña actualizada. Ya puedes iniciar sesión.";
  status.classList.add("success");
  localStorage.removeItem(USER_KEY);
  await supabase.auth.signOut();
  setTimeout(showLogin, 1200);
}

window.VentechSupabase = { supabase, profileFor, saveSession };
window.VT.register = register;
window.VT.login = login;
window.VT.recover = recover;
window.VT.updatePassword = updatePassword;
window.VT.showLogin = showLogin;

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") showPanel("resetPassword");
});

supabase.auth.getUser().then(async ({ data }) => {
  if (data.user) {
    try { await saveSession(data.user); } catch (_) { /* La validación se realiza al ingresar. */ }
  }
});
