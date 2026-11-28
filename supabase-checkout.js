import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://yatuqlksqovgkczzumzo.supabase.co",
  "sb_publishable__KIj1REr4hQXJeoAlYu1lA_1tLL6yDn",
);

async function placeOrder(request, cart) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Tu sesion vencio. Inicia sesion nuevamente.");
  }

  const items = cart.map((item) => ({
    productId: Number(item.id),
    quantity: Number(item.qty),
    color: item.color || null,
  }));

  const { data, error } = await supabase.rpc("place_order", {
    p_department: request.department || "",
    p_city: request.city || "",
    p_address: request.address || "",
    p_neighborhood: request.neighborhood || "",
    p_payment_method: request.paymentMethod || "PSE",
    p_items: items,
  });

  if (error) throw new Error(error.message || "No fue posible registrar el pedido.");
  return data;
}

async function cancelOrder(orderId) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Tu sesion vencio. Inicia sesion nuevamente.");
  }

  const { data, error } = await supabase.rpc("cancel_order", {
    p_order_id: Number(orderId),
  });

  if (error) throw new Error(error.message || "No fue posible cancelar el pedido.");
  return data;
}

async function getOrderStatuses() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select("id,status")
    .eq("customer_id", userData.user.id);

  if (error) throw new Error(error.message || "No fue posible actualizar los pedidos.");
  return data || [];
}

window.VentechSupabaseCheckout = { placeOrder, cancelOrder, getOrderStatuses };

if (window.Customer && typeof window.Customer.syncOrderStatuses === "function") {
  window.Customer.syncOrderStatuses().then(() => {
    window.Customer.overview();
    window.Customer.orders();
    window.Customer.invoices();
  }).catch(() => {});
}
