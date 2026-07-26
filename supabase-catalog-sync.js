import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient("https://yatuqlksqovgkczzumzo.supabase.co", "sb_publishable__KIj1REr4hQXJeoAlYu1lA_1tLL6yDn");
const readLocalProducts = () => JSON.parse(localStorage.getItem("vt_products") || "[]");
const cleanColors = (value) => Array.isArray(value) ? value : String(value || "").split(",").map((x) => x.trim()).filter(Boolean);

async function currentStaff() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Inicia sesión con una cuenta administradora.");
  const { data: profile, error } = await supabase.from("profiles").select("role,active").eq("id", userData.user.id).single();
  if (error || !profile?.active || !["administrador", "supervisor", "empleado"].includes(profile.role)) throw new Error("Tu cuenta no tiene permisos para sincronizar el catálogo.");
}

async function syncProducts(products = readLocalProducts()) {
  if (!products.length) throw new Error("No hay productos locales para migrar.");
  await currentStaff();
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
  return products.length;
}

window.VentechSupabaseCatalog = { syncProducts };
