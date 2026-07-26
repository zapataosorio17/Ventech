/*
  Sincroniza el catálogo. En el computador mantiene SQL Server; en el sitio
  publicado consulta Supabase para que todos los dispositivos vean lo mismo.
*/
(function () {
  var base = "http://localhost:5097/api";
  var supabaseUrl = "https://yatuqlksqovgkczzumzo.supabase.co";
  var supabaseKey = "sb_publishable__KIj1REr4hQXJeoAlYu1lA_1tLL6yDn";
  var originalSet = localStorage.setItem.bind(localStorage);
  var sending = false;
  var isPublished = !/^(localhost|127\\.0\\.0\\.1)$/i.test(window.location.hostname);
  var isAdminPage = /(?:administracion|admin)\\.html$/i.test(window.location.pathname);

  function status(message, error) {
    var element = document.getElementById("sqlStatus");
    if (element) {
      element.textContent = message;
      element.style.color = error ? "#b42318" : "#16794c";
    }
  }

  function refreshStore() {
    if (window.VT && typeof window.VT.store === "function") window.VT.store();
    window.dispatchEvent(new Event("ventech:database-ready"));
  }

  function mapSupabaseProduct(product) {
    var images = Array.isArray(product.images) ? product.images : [];
    var colorVariants = Array.isArray(product.color_variants) ? product.color_variants : [];
    var variantStock = colorVariants.reduce(function (total, variant) {
      return total + Math.max(0, Number(variant.stock) || 0);
    }, 0);
    return {
      id: Number(product.id),
      name: product.name,
      category: product.categories && product.categories.name ? product.categories.name : "Sin categoría",
      price: Number(product.price) || 0,
      discount: Number(product.discount_percent) || 0,
      vat: Number(product.vat_percent) || 19,
      stock: colorVariants.length ? variantStock : Number(product.stock) || 0,
      enabled: product.status === "activo",
      description: product.description || "",
      specs: product.specifications || "",
      capacity: product.capacity || "",
      colors: product.available_colors || [],
      colorVariants: colorVariants,
      image: images[0] || "",
      images: images,
      featured: Boolean(product.featured),
    };
  }

  async function hydrateSupabase() {
    var response = await fetch(
      supabaseUrl + "/rest/v1/products?select=id,name,description,specifications,price,discount_percent,vat_percent,stock,status,capacity,available_colors,color_variants,images,featured,categories(name)&status=eq.activo&order=id.desc",
      { headers: { apikey: supabaseKey } },
    );
    if (!response.ok) throw new Error("No fue posible cargar el catálogo compartido.");
    var products = (await response.json()).map(mapSupabaseProduct);
    var localProducts = JSON.parse(localStorage.getItem("vt_products") || "[]");
    var backupProducts = JSON.parse(localStorage.getItem("vt_products_backup") || "[]");
    if (products.length) {
      originalSet("vt_products", JSON.stringify(products));
      originalSet("vt_products_backup", JSON.stringify(products));
    } else if (isAdminPage && localProducts.length) {
      originalSet("vt_products_backup", JSON.stringify(localProducts));
    } else if (isAdminPage && backupProducts.length) {
      originalSet("vt_products", JSON.stringify(backupProducts));
    } else if (!isAdminPage) {
      originalSet("vt_products", "[]");
    }
    refreshStore();
  }

  async function hydrate() {
    if (isPublished) {
      try { await hydrateSupabase(); }
      catch (error) { console.warn("No se pudo cargar el catálogo compartido.", error); refreshStore(); }
      return;
    }
    try {
      var response = await fetch(base + "/products");
      if (!response.ok) throw new Error("SQL Server no respondió.");
      var products = await response.json();
      var localProducts = JSON.parse(localStorage.getItem("vt_products") || "[]");
      if (!products.length && localProducts.length) {
        await pushProducts(JSON.stringify(localProducts));
        products = localProducts;
      }
      if (products.length) originalSet("vt_products", JSON.stringify(products));
      status("Inventario conectado y guardado automáticamente en SQL Server.");
      refreshStore();
    } catch (_) {
      status("No fue posible conectar con SQL Server.", true);
      console.warn("SQL Server no está disponible. Se usa la información local.");
      refreshStore();
    }
  }

  async function pushProducts(value) {
    if (sending) return;
    try {
      sending = true;
      var response = await fetch(base + "/products/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: value });
      if (!response.ok) throw new Error("No fue posible guardar el inventario.");
    } finally { sending = false; }
  }

  localStorage.setItem = function (name, value) {
    originalSet(name, value);
    if (name === "vt_products" && !isPublished) {
      clearTimeout(window.__ventechSyncTimer);
      window.__ventechSyncTimer = setTimeout(function () { pushProducts(value).catch(function () {}); }, 400);
    }
  };

  window.VentechSql = {
    hydrate: hydrate,
    api: base,
    guardarProductos: async function (products) {
      var response = await fetch(base + "/products/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(products) });
      if (!response.ok) throw new Error("No fue posible guardar el inventario en SQL Server.");
      var result = await response.json();
      status((result.saved || products.length) + " producto(s) guardado(s) automáticamente en SQL Server.");
      return result;
    },
  };
  hydrate();
})();
