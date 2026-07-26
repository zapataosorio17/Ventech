import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient("https://yatuqlksqovgkczzumzo.supabase.co", "sb_publishable__KIj1REr4hQXJeoAlYu1lA_1tLL6yDn");
const readLocalProducts = () => {
  const current = JSON.parse(localStorage.getItem("vt_products") || "[]");
  if (current.length) return current;
  return JSON.parse(localStorage.getItem("vt_products_backup") || "[]");
};
const cleanColors = (value) => Array.isArray(value) ? value : String(value || "").split(",").map((x) => x.trim()).filter(Boolean);

async function currentStaff() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Inicia sesión con una cuenta administradora.");
  const { data: profile, error } = await supabase.from("profiles").select("role,active").eq("id", userData.user.id).single();
  if (error || !profile?.active || !["administrador", "supervisor", "empleado"].includes(profile.role)) throw new Error("Tu cuenta no tiene permisos para sincronizar el catálogo.");
}

async function syncProducts(products = readLocalProducts()) {
  const unique = new Map();
  products.forEach((product) => {
    const name = String(product.name || "").trim().toLowerCase();
    if (name) unique.set(name, product);
  });
  products = Array.from(unique.values());
  localStorage.setItem("vt_products", JSON.stringify(products));
  await currentStaff();
  if (!products.length) {
    const { error } = await supabase.from("products").delete().gte("id", 0);
    if (error) throw error;
    return 0;
  }
  const { data: categories, error: categoryError } = await supabase.from("categories").select("id,name");
  if (categoryError) throw categoryError;
  const categoryMap = new Map((categories || []).map((item) => [item.name.toLowerCase(), item.id]));
  for (const product of products) {
    const categoryName = String(product.category || "Sin categoría").trim();
    let categoryId = categoryMap.get(categoryName.toLowerCase());
    if (!categoryId) {
      const { data, error } = await supabase.from("categories").insert({ name: categoryName, active: true }).select("id,name").single();
      if (error) throw error;
      categoryId = data.id;
      categoryMap.set(data.name.toLowerCase(), data.id);
    }
    const colorVariants = Array.isArray(product.colorVariants) ? product.colorVariants : [];
    const images = colorVariants[0]?.images?.length ? colorVariants[0].images : Array.isArray(product.images) && product.images.length ? product.images : product.image ? [product.image] : [];
    const payload = {
      legacy_id: Number(product.id), category_id: categoryId, name: product.name || "Producto sin nombre",
      description: product.description || "", specifications: product.specs || "", price: Number(product.price) || 0,
      discount_percent: Number(product.discount) || 0, vat_percent: Number(product.vat) || 19,
      stock_minimum: 5,
      status: product.enabled === false ? "inhabilitado" : "activo", capacity: product.capacity || null,
      available_colors: cleanColors(product.colors), color_variants: colorVariants, images, featured: Boolean(product.featured || Number(product.discount) > 0),
    };
    const { error } = await supabase.from("products").upsert(payload, { onConflict: "legacy_id" });
    if (error) throw error;
  }
  const localIds = products.map((product) => Number(product.id)).filter(Number.isFinite);
  const { data: remoteProducts, error: remoteError } = await supabase.from("products").select("legacy_id");
  if (remoteError) throw remoteError;
  const staleIds = (remoteProducts || []).map((product) => Number(product.legacy_id)).filter((id) => Number.isFinite(id) && !localIds.includes(id));
  if (staleIds.length) {
    const { error: deleteError } = await supabase.from("products").delete().in("legacy_id", staleIds);
    if (deleteError) throw deleteError;
  }
  const backup = JSON.stringify(products);
  if (backup.length < 1000000) {
    try { localStorage.setItem("vt_products_backup", backup); } catch (_) {}
  }
  return products.length;
}

window.VentechSupabaseCatalog = { syncProducts };
