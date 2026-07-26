import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://yatuqlksqovgkczzumzo.supabase.co",
  "sb_publishable__KIj1REr4hQXJeoAlYu1lA_1tLL6yDn",
);

const { data: sessionData } = await supabase.auth.getUser();
if (!sessionData.user) {
  location.replace("auth.html?modo=login&next=administracion.html");
} else {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,active,permissions")
    .eq("id", sessionData.user.id)
    .maybeSingle();
  const allowed = profile && profile.active && ["administrador", "supervisor", "empleado"].includes(profile.role);
  if (!allowed) {
    await supabase.auth.signOut();
    alert("No tienes autorización para ingresar al panel administrativo.");
    location.replace("auth.html?modo=login&next=administracion.html");
  } else {
    localStorage.setItem("vt_user", JSON.stringify({
      id: profile.id,
      email: profile.email,
      name: profile.full_name || profile.email,
      role: profile.role,
      active: profile.active,
      permissions: profile.permissions || [],
    }));
    document.documentElement.classList.add("vt-authorized");
    document.body.style.display = "";
  }
}
