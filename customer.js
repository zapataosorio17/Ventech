var Customer = (function () {
  var k = "vt_";
  function storageKey(n) {
    if (n !== "orders") return k + n;
    var current = JSON.parse(localStorage.getItem(k + "user") || "null");
    var identity = current && (current.id || current.email);
    if (!identity) return k + "orders_anonymous";
    return k + "orders_" + encodeURIComponent(String(identity).toLowerCase());
  }
  function get(n) {
    return JSON.parse(localStorage.getItem(storageKey(n)) || "[]");
  }
  function set(n, v) {
    localStorage.setItem(storageKey(n), JSON.stringify(v));
  }
  function user() {
    return JSON.parse(localStorage.getItem(k + "user") || "null");
  }
  function money(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  }
  function products() {
    return get("products");
  }
  function esc(s) {
    return String(s || "").replace(/</g, "&lt;");
  }
  function status(s) {
    return (
      '<span class="status ' +
      String(s || "").replace(" ", "_") +
      '">' +
      (s || "Procesando") +
      "</span>"
    );
  }
  function items(o) {
    return (o.items || [])
      .map(function (x) {
        var p = products().find(function (y) {
          return y.id === x.id;
        });
        return x.qty + " x " + (p ? p.name : x.name || "Producto");
      })
      .join(", ");
  }
  return {
    start: async function () {
      if (!user()) {
        location.href = "auth.html";
        return;
      }
      this.profile();
      this.overview();
      this.orders();
      this.invoices();
      if (new URLSearchParams(location.search).get("origen") === "checkout") {
        this.show("cartProfile", document.getElementById("cartNav"));
      }
      var self = this;
      window.addEventListener(
        "ventech:database-ready",
        function () {
          var cartSection = document.getElementById("cartProfile");
          if (cartSection && !cartSection.classList.contains("hidden")) {
            self.cartProfile();
          }
        },
        { once: true },
      );
    },
    syncOrderStatuses: async function () {
      var currentUser = user();
      if (!currentUser || !currentUser.email) return;
      try {
        var isPublished = !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
        if (isPublished) {
          if (
            !window.VentechSupabaseCheckout ||
            typeof window.VentechSupabaseCheckout.getOrders !== "function"
          )
            return;
          var publishedOrders = await window.VentechSupabaseCheckout.getOrders();
          var synchronizedOrders = publishedOrders.map(function (remote) {
            var remoteStatus = String(remote.status || "").toLowerCase();
            var displayStatus =
              remoteStatus === "procesando"
                ? "Procesando"
                : remoteStatus === "en_camino"
                  ? "En camino"
                  : remoteStatus === "entregado"
                    ? "Entregado"
                    : remoteStatus === "cancelado"
                      ? "Cancelado"
                      : remote.status || "Procesando";
            return {
              id: remote.id,
              date: new Date(remote.created_at).toLocaleDateString("es-CO"),
              items: (remote.order_items || []).map(function (item) {
                return {
                  id: Number(item.product_id),
                  qty: Number(item.quantity),
                  color: item.selected_color || null,
                  name: item.product_name || "Producto",
                };
              }),
              total: Number(remote.total) || 0,
              status: displayStatus,
              address:
                [remote.department, remote.city].filter(Boolean).join(", ") +
                (remote.address ? " - " + remote.address : ""),
              payment: remote.payment_method || "Pago registrado",
            };
          });
          set("orders", synchronizedOrders);
          localStorage.removeItem(k + "orders");
          return;
        }
        var response = await fetch(
          "http://localhost:5097/api/customers/" +
            encodeURIComponent(currentUser.email) +
            "/orders",
        );
        if (!response.ok) return;
        var remoteOrders = await response.json(),
          localOrders = get("orders"),
          changed = false;
        remoteOrders.forEach(function (remote) {
          var local = localOrders.find(function (order) {
            return String(order.id) === String(remote.id);
          });
          if (local && local.status !== remote.status) {
            local.status = remote.status;
            changed = true;
          }
        });
        if (changed) set("orders", localOrders);
      } catch (_) {
        /* Conserva los datos locales si SQL Server no está disponible. */
      }
    },
    show: function (n, b) {
      ["overview", "cartProfile", "orders", "invoices", "profile"].forEach(
        function (x) {
          document.getElementById(x).classList.toggle("hidden", x !== n);
        },
      );
      document.querySelectorAll(".side button").forEach(function (x) {
        x.classList.remove("active");
      });
      if (b) b.classList.add("active");
      if (n === "cartProfile") this.cartProfile();
      if (n === "orders") this.orders();
      if (n === "invoices") this.invoices();
      if (n === "profile") this.profile();
    },
    profile: function () {
      var u = user();
      profileName.textContent = u.name || "Cliente";
      profileEmail.textContent = u.email || "";
      greeting.textContent = (u.name || "cliente").split(" ")[0];
      avatar.textContent = (u.name || "VT")
        .split(" ")
        .map(function (x) {
          return x[0];
        })
        .join("")
        .slice(0, 2)
        .toUpperCase();
      if (customerName) {
        customerName.value = u.name || "";
        customerEmail.value = u.email || "";
        customerPhone.value = u.phone || "";
        customerDocument.value = u.document || "No registrado";
        customerAddress.value = u.address || "";
      }
    },
    overview: function () {
      var a = get("orders"),
        active = a.filter(function (o) {
          return o.status !== "Entregado" && o.status !== "Cancelado";
        }),
        spent = a.reduce(function (s, o) {
          return s + (o.total || 0);
        }, 0);
      orderMetric.textContent = a.length;
      activeMetric.textContent = active.length;
      invoiceMetric.textContent = a.length;
      spentMetric.textContent = money(spent);
      recentOrders.innerHTML = a.length
        ? a
            .slice(0, 3)
            .map(function (o) {
              return (
                '<div class="order"><div class="order-head"><b>Pedido #' +
                String(o.id).slice(-6) +
                "</b>" +
                status(o.status) +
                "</div><p>" +
                o.date +
                " · " +
                items(o) +
                "</p><b>" +
                money(o.total) +
                "</b></div>"
              );
            })
            .join("")
        : '<p class="empty">Aún no tienes compras. Visita la tienda para comenzar.</p>';
      var o = active[0];
      trackingSummary.innerHTML = o
        ? "<b>Pedido #" +
          String(o.id).slice(-6) +
          "</b><p>" +
          esc(o.address || "Dirección pendiente") +
          "</p>" +
          this.track(o.status)
        : '<p class="empty">No tienes pedidos en proceso.</p>';
    },
    track: function (s) {
      var steps = ["Procesando", "En camino", "Entregado"],
        i = steps.indexOf(s);
      if (s === "Cancelado")
        return '<p class="notice">Este pedido fue cancelado.</p>';
      return (
        '<div class="track">' +
        steps
          .map(function (x, n) {
            return (
              '<div class="step ' + (n <= i ? "done" : "") + '">' + x + "</div>"
            );
          })
          .join("") +
        "</div>"
      );
    },
    orders: function () {
      var q = (orderSearch ? orderSearch.value : "").toLowerCase(),
        f = orderFilter ? orderFilter.value : "",
        a = get("orders").filter(function (o) {
          return (
            (!f || o.status === f) &&
            (!q ||
              String(o.id).indexOf(q) >= 0 ||
              items(o).toLowerCase().indexOf(q) >= 0)
          );
        });
      ordersList.innerHTML = a.length
        ? a
            .map(function (o) {
              var canCancel = o.status === "Procesando";
              return (
                '<article class="card customer-order-card"><div class="customer-order-head"><div><p class="order-number">Pedido #' +
                String(o.id).slice(-6) +
                '</p><p class="order-meta"><span>' +
                o.date +
                "</span><span>" +
                esc(o.address || "Dirección pendiente") +
                "</span></p></div>" +
                status(o.status) +
                "</div>" +
                '<div class="order-progress">' +
                Customer.track(o.status) +
                "</div>" +
                '<div class="customer-order-details"><div class="order-products"><span>Productos del pedido</span><p>' +
                items(o) +
                '</p></div><div class="order-total"><span>Total</span><b>' +
                money(o.total) +
                "</b></div></div>" +
                '<div class="order-actions"><button class="button alt" onclick="Customer.invoice(' +
                o.id +
                ')">Ver factura</button><button class="button" onclick="alert(\'Estado actual: ' +
                o.status +
                "')\">Rastrear pedido</button>" +
                (canCancel
                  ? '<button class="button cancel-order" onclick="Customer.cancel(' +
                    o.id +
                    ')">Cancelar pedido</button>'
                  : "") +
                "</div></article>"
              );
            })
            .join("")
        : '<p class="empty">No hay pedidos que coincidan.</p>';
    },
    cancel: async function (id) {
      var a = get("orders"),
        o = a.find(function (x) {
          return x.id === id;
        }),
        u = user();
      if (!o || o.status !== "Procesando") {
        alert("Este pedido ya no puede cancelarse desde la cuenta.");
        return;
      }
      if (!confirm("¿Deseas cancelar este pedido?")) return;
      var isPublished = !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
      if (isPublished) {
        try {
          if (
            !window.VentechSupabaseCheckout ||
            typeof window.VentechSupabaseCheckout.cancelOrder !== "function"
          ) {
            throw new Error("El servicio de cancelaciones aun no esta disponible.");
          }
          var canceled = await window.VentechSupabaseCheckout.cancelOrder(id);
          o.status =
            String(canceled.status || "").toLowerCase() === "cancelado"
              ? "Cancelado"
              : canceled.status || "Cancelado";
          set("orders", a);
          alert(
            canceled.message ||
              "Pedido cancelado. El inventario fue restaurado.",
          );
          this.orders();
          this.overview();
          this.invoices();
        } catch (error) {
          alert(
            error && error.message
              ? error.message
              : "No fue posible cancelar el pedido.",
          );
        }
        return;
      }
      var cancelLocal = function (message) {
        var ps = products();
        (o.items || []).forEach(function (x) {
          var p = ps.find(function (y) {
            return y.id === x.id;
          });
          if (p) p.stock = (p.stock || 0) + x.qty;
        });
        o.status = "Cancelado";
        set("products", ps);
        set("orders", a);
        alert(message);
        Customer.orders();
        Customer.overview();
        Customer.invoices();
      };
      try {
        var r = await fetch(
          "http://localhost:5097/api/orders/" + id + "/cancel",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: u.email }),
          },
        );
        if (r.ok) {
          o.status = "Cancelado";
          set("orders", a);
          alert(
            "Pedido cancelado en SQL Server. El inventario fue actualizado.",
          );
          this.orders();
          this.overview();
          this.invoices();
          return;
        }
        if (r.status === 404) {
          cancelLocal(
            "Pedido anterior cancelado correctamente. Las nuevas compras se guardaran directamente en SQL Server.",
          );
          return;
        }
        var message = await r.text();
        alert(message || "No fue posible cancelar el pedido.");
      } catch (_) {
        cancelLocal(
          "Pedido cancelado localmente. Verifica que el servicio de Ventech este iniciado para sincronizar nuevas compras.",
        );
      }
    },
    invoices: function () {
      var a = get("orders");
      invoiceList.innerHTML = a.length
        ? a
            .map(function (o) {
              return (
                '<div class="invoice-row"><div><b>Factura FAC-' +
                String(o.id).slice(-6) +
                "</b><br><small>Pedido #" +
                String(o.id).slice(-6) +
                " · " +
                o.date +
                "</small></div><div>" +
                status(o.status) +
                ' <button class="button alt" onclick="Customer.invoice(' +
                o.id +
                ')">Ver / descargar</button></div></div>'
              );
            })
            .join("")
        : '<p class="empty">Tus facturas aparecerán aquí después de realizar una compra.</p>';
    },
    invoice: function (id) {
      var o = get("orders").find(function (x) {
          return x.id === id;
        }),
        u = user(),
        base = 0,
        disc = 0;
      var rows = (o.items || [])
        .map(function (x, i) {
          var p = products().find(function (y) {
            return y.id === x.id;
          }) || { name: "Producto", price: 0, discount: 0 };
          var unit = p.price || 0,
            d = (unit * x.qty * (p.discount || 0)) / 100,
            net = unit * x.qty - d;
          base += unit * x.qty;
          disc += d;
          return (
            "<tr><td>" +
            String(i + 1) +
            "</td><td>" +
            esc(p.name) +
            "</td><td>" +
            x.qty +
            "</td><td>" +
            money(unit) +
            "</td><td>19%</td><td>" +
            money(net + Math.round(net * 0.19)) +
            "</td></tr>"
          );
        })
        .join("");
      var sub = base - disc,
        iva = Math.round(sub * 0.19),
        total = sub + iva,
        canceled =
          o.status === "Cancelado"
            ? '<div style="margin:16px 0;padding:12px;border:2px solid #c94747;background:#fff0f0;color:#a52f2f;font-weight:bold;text-align:center">PEDIDO CANCELADO - No se realizara entrega ni cobro.</div>'
            : "";
      invoicePreview.innerHTML =
        '<div style="font:12px Arial;color:#090d17"><div style="display:flex;justify-content:space-between;border-bottom:1px solid #666;padding-bottom:20px"><div><h1 style="margin:0;font:800 23px Arial">VENTECH</h1><p>Sistema de Facturación</p><p>Factura: FAC-' +
        String(id).slice(-6) +
        '</p></div><div style="padding-top:35px">Fecha: ' +
        o.date +
        "<br>Hora: " +
        new Date().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }) +
        "</div></div>" +
        canceled +
        "<h3>DATOS DEL CLIENTE</h3><p>Cliente: " +
        esc(u.name || "Cliente registrado") +
        "<br>Documento: " +
        esc(u.document || "No registrado") +
        "<br>Teléfono: " +
        esc(u.phone || "No registrado") +
        "<br>Correo: " +
        esc(u.email || "No registrado") +
        "<br>Dirección: " +
        esc(o.address || u.address || "No registrada") +
        '</p><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #666"><th>#</th><th>Producto</th><th>Cant.</th><th>Precio</th><th>IVA</th><th>Total</th></tr></thead><tbody>' +
        rows +
        '</tbody></table><div style="margin:20px 0 0 auto;width:290px;border-top:1px solid #555;padding-top:8px"><p>Subtotal: <b style="float:right">' +
        money(base) +
        '</b></p><p>IVA: <b style="float:right">' +
        money(iva) +
        '</b></p><p>Descuento: <b style="float:right">' +
        money(disc) +
        '</b></p><h3>TOTAL: <span style="float:right">' +
        money(total) +
        "</span></h3></div><p>Método de pago: " +
        esc(o.payment || "Pago registrado") +
        '</p><p>Observaciones: Compra generada desde Ventech.</p><div style="display:flex;justify-content:space-between;margin-top:55px;text-align:center"><span style="width:190px;border-top:1px solid #555;padding-top:5px">Firma Cliente</span><span style="width:190px;border-top:1px solid #555;padding-top:5px">Firma Responsable</span></div><p style="text-align:center;margin-top:32px">Gracias por comprar en VENTECH.</p><button class="button" onclick="Customer.printInvoice()">Imprimir / guardar PDF</button></div>';
      invoiceDialog.showModal();
    },
    printInvoice: function () {
      var w = window.open("", "_blank");
      w.document.write(
        "<html><head><title>Factura Ventech</title></head><body>" +
          invoicePreview.innerHTML.replace(/<button[\s\S]*?<\/button>/, "") +
          "</body></html>",
      );
      w.document.close();
      setTimeout(function () {
        w.print();
      }, 250);
    },
    cartProfile: function () {
      var u = user();
      var cart = get("cart");
      var list = products();
      var base = 0,
        discount = 0,
        vat = 0;
      if (cartCustomer)
        cartCustomer.textContent =
          (u.name || "Cliente") + " · " + (u.email || "");
      if (cartDepartment) {
        cartDepartment.value = u.department || "";
        cartCity.value = u.city || "";
        cartAddress.value = u.address || "";
        cartNeighborhood.value = u.neighborhood || "";
      }
      if (!cart.length) {
        profileCartSummary.innerHTML =
          '<p class="empty">Tu carrito está vacío. <a href="Ventech.html">Ver productos</a></p>';
        if (profileOrderButton) profileOrderButton.disabled = true;
        return;
      }
      var rows = cart
        .map(function (item) {
          var p = list.find(function (product) {
            return product.id === item.id;
          }) || { name: "Producto", price: 0, discount: 0, vat: 19 };
          var lineBase = (Number(p.price) || 0) * item.qty;
          var lineDiscount = (lineBase * (Number(p.discount) || 0)) / 100;
          var net = lineBase - lineDiscount;
          base += lineBase;
          discount += lineDiscount;
          vat += Math.round((net * (Number(p.vat) || 19)) / 100);
          return (
            '<div class="cart-summary-item"><div class="cart-summary-main"><button class="cart-product-link" type="button" onclick="Customer.productDetails(' +
            item.id +
            ')">' +
            esc(p.name) +
            "</button><small>" +
            money(net / item.qty) +
            ' por unidad</small></div><div class="cart-summary-actions"><div class="profile-quantity"><button type="button" aria-label="Disminuir cantidad" onclick="Customer.changeCartQty(' +
            item.id +
            ', -1)">−</button><b>' +
            item.qty +
            '</b><button type="button" aria-label="Aumentar cantidad" onclick="Customer.changeCartQty(' +
            item.id +
            ', 1)">+</button></div><button class="profile-remove" type="button" aria-label="Eliminar producto" onclick="Customer.removeCartItem(' +
            item.id +
            ')">×</button><b>' +
            money(net) +
            "</b></div></div>"
          );
        })
        .join("");
      var total = base - discount + vat;
      profileCartSummary.innerHTML =
        rows +
        '<hr><div class="summary-line"><span>Productos</span><b>' +
        money(base) +
        '</b></div><div class="summary-line"><span>Descuento</span><b>- ' +
        money(discount) +
        '</b></div><div class="summary-line"><span>IVA</span><b>' +
        money(vat) +
        '</b></div><div class="summary-line"><span>Envío</span><b>$0</b></div><hr><div class="summary-total"><span>Total</span><b>' +
        money(total) +
        '</b></div><p class="delivery-note">Entrega estimada: 2 a 5 días hábiles.</p>';
      if (profileOrderButton) profileOrderButton.disabled = false;
    },
    productDetails: function (id) {
      var p = products().find(function (product) {
        return product.id === id;
      });
      if (!p) return;
      var images = (p.images && p.images.length ? p.images : [p.image]).filter(
        Boolean,
      );
      var thumbs = images
        .map(function (src, index) {
          return (
            '<button class="preview-thumb" type="button" onclick="Customer.selectPreviewImage(this.querySelector(&quot;img&quot;))"><img src="' +
            src +
            '" alt="Imagen ' +
            (index + 1) +
            " de " +
            esc(p.name) +
            '"></button>'
          );
        })
        .join("");
      productPreviewBody.innerHTML =
        '<div class="product-preview"><section><div class="preview-main">' +
        (images.length
          ? '<img id="previewMainImage" src="' +
            images[0] +
            '" alt="' +
            esc(p.name) +
            '">'
          : "<span>💻</span>") +
        '</div><div class="preview-thumbs">' +
        thumbs +
        '</div></section><section class="preview-info"><span class="tag">' +
        esc(p.category) +
        "</span><h2>" +
        esc(p.name) +
        "</h2><h3>" +
        money((Number(p.price) || 0) * (1 - (Number(p.discount) || 0) / 100)) +
        "</h3><p>" +
        esc(p.description || "Sin descripción disponible.") +
        "</p><h3>Especificaciones</h3><pre>" +
        esc(p.specs || "Sin especificaciones adicionales.") +
        "</pre></section></div>";
      productPreviewDialog.showModal();
    },
    selectPreviewImage: function (image) {
      var main = document.getElementById("previewMainImage");
      if (main && image) main.src = image.src;
    },
    changeCartQty: function (id, delta) {
      var cart = get("cart");
      var item = cart.find(function (x) {
        return x.id === id;
      });
      var product = products().find(function (x) {
        return x.id === id;
      });
      if (!item || !product) return;
      var next = item.qty + delta;
      if (next < 1) return this.removeCartItem(id);
      if (next > product.stock)
        return alert(
          "Solo hay " + product.stock + " unidad(es) disponible(s).",
        );
      item.qty = next;
      set("cart", cart);
      this.cartProfile();
    },
    removeCartItem: function (id) {
      set(
        "cart",
        get("cart").filter(function (item) {
          return item.id !== id;
        }),
      );
      this.cartProfile();
    },
    placeOrder: async function (event) {
      event.preventDefault();
      var u = user(),
        cart = get("cart");
      if (!cart.length) return alert("Tu carrito está vacío.");
      var pay = document.querySelector('input[name="profilePay"]:checked');
      var request = {
        email: u.email,
        deliveryType: "Domicilio",
        department: cartDepartment.value,
        city: cartCity.value,
        address: cartAddress.value,
        neighborhood: cartNeighborhood.value,
        paymentMethod: pay ? pay.value : "PSE",
        shipping: 0,
        items: cart.map(function (item) {
          return { productId: item.id, quantity: item.qty };
        }),
      };
      try {
        var isPublished = !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
        var data;
        if (isPublished) {
          if (!window.VentechSupabaseCheckout)
            throw new Error("El servicio de pedidos aun no esta disponible.");
          data = await window.VentechSupabaseCheckout.placeOrder(request, cart);
        } else {
          var response = await fetch("http://localhost:5097/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          });
          data = await response.json();
          if (!response.ok)
            throw new Error(data.message || "No fue posible registrar el pedido.");
        }
        var orders = get("orders");
        orders.unshift({
          id: data.id,
          date: new Date().toLocaleDateString("es-CO"),
          items: cart,
          total: data.total,
          status:
            String(data.status || "").toLowerCase() === "procesando"
              ? "Procesando"
              : data.status || "Procesando",
          address:
            request.department + ", " + request.city + " - " + request.address,
          payment: request.paymentMethod,
        });
        set("orders", orders);
        set("cart", []);
        alert(
          "Pedido confirmado. Puedes consultar su seguimiento y factura en tu cuenta.",
        );
        this.overview();
        this.orders();
        this.invoices();
        this.show(
          "orders",
          document.querySelector('.side button[onclick*="orders"]'),
        );
      } catch (error) {
        alert(
          error && error.message
            ? error.message
            : "No se pudo registrar el pedido. Intenta nuevamente.",
        );
      }
    },
    saveProfile: function (e) {
      e.preventDefault();
      var u = user(),
        users = get("users");
      u.name = customerName.value;
      u.email = customerEmail.value;
      u.phone = customerPhone.value;
      u.address = customerAddress.value;
      if (customerPassword.value) u.password = customerPassword.value;
      localStorage.setItem(k + "user", JSON.stringify(u));
      var i = users.findIndex(function (x) {
        return x.email === u.email || x.id === u.id;
      });
      if (i >= 0) users[i] = u;
      set("users", users);
      alert("Datos actualizados correctamente.");
      this.profile();
    },
    logout: function () {
      localStorage.removeItem(k + "user");
      location.href = "Ventech.html";
    },
  };
})();
