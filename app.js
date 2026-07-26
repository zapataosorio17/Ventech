var VT = (function () {
  var key = "vt_";
  function get(n) {
    return JSON.parse(localStorage.getItem(key + n) || "[]");
  }
  function set(n, v) {
    localStorage.setItem(key + n, JSON.stringify(v));
  }
  function money(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  }
  function esc(s) {
    return String(s || "").replace(/</g, "&lt;");
  }
  function products() {
    return get("products");
  }
  function cart() {
    return get("cart");
  }
  function val(id) {
    var e = document.getElementById(id);
    return e ? e.value : "";
  }
  function pic(p) {
    return p.image
      ? '<div class="product-image" style="background-image:url(' +
          p.image +
          ')"></div>'
      : '<div class="product-image">' +
          (p.category && p.category.toLowerCase().indexOf("cel") >= 0
            ? "📱"
            : p.category && p.category.toLowerCase().indexOf("audio") >= 0
              ? "🎧"
              : "💻") +
          "</div>";
  }
  function price(p) {
    var x = p.price * (1 - (p.discount || 0) / 100);
    return (
      (p.discount ? "<s>" + money(p.price) + "</s> " : "") +
      "<b>" +
      money(x) +
      "</b>"
    );
  }
  function card(p) {
    var discount = Number(p.discount) || 0;
    var saving = ((Number(p.price) || 0) * discount) / 100;
    var finalPrice = (Number(p.price) || 0) - saving;
    return (
      '<article class="product" onclick="VT.detail(' +
      p.id +
      ')"><div class="product-media">' +
      pic(p) +
      (discount
        ? '<span class="discount-badge">-' + discount + "%</span>"
        : "") +
      '</div><div class="product-info"><span class="tag">' +
      p.category +
      "</span><h3>" +
      p.name +
      '</h3><p class="product-rating">★★★★★ <small>Producto destacado</small></p><div class="product-prices">' +
      (discount ? "<s>" + money(p.price) + "</s>" : "") +
      "<b>" +
      money(finalPrice) +
      "</b>" +
      (discount
        ? '<span class="saving">Ahorras ' + money(saving) + "</span>"
        : "") +
      '</div><div class="product-footer"><small>' +
      (p.stock > 0 ? p.stock + " disponibles" : "Sin existencias") +
      '</small><button class="add-card" onclick="event.stopPropagation();VT.add(' +
      p.id +
      ')">Agregar al carrito</button></div></div></article>'
    );
  }
  function refreshCount() {
    var e = document.getElementById("count");
    if (e)
      e.textContent = cart().reduce(function (s, x) {
        return s + x.qty;
      }, 0);
  }
  return {
    store: function () {
      var list = products(),
        c = val("category"),
        q = val("search").toLowerCase(),
        limit = +val("price");
      var cats = [];
      list.forEach(function (p) {
        if (cats.indexOf(p.category) < 0) cats.push(p.category);
      });
      var select = document.getElementById("category");
      if (select && select.options.length === 1) {
        cats.forEach(function (x) {
          select.innerHTML += "<option>" + x + "</option>";
        });
      }
      var a = list.filter(function (p) {
        return (
          p.stock > 0 &&
          (!c || p.category === c) &&
          (!q ||
            (p.name + " " + p.category + " " + p.description)
              .toLowerCase()
              .indexOf(q) >= 0) &&
          (!limit || p.price <= limit)
        );
      });
      document.getElementById("products").innerHTML = a.length
        ? a.map(card).join("")
        : '<div class="empty">No hay productos disponibles. El administrador puede agregarlos desde el panel interno.</div>';
      var o = list.filter(function (p) {
        return p.stock > 0 && p.discount > 0;
      });
      document.getElementById("offers").innerHTML = o.length
        ? o.map(card).join("")
        : '<div class="empty">No hay ofertas activas por ahora.</div>';
      refreshCount();
    },
    detail: function (id) {
      var p = products().find(function (x) {
        return x.id === id;
      });
      if (!p) return;
      var colorVariants = (p.colorVariants || []).filter(function (variant) {
        return variant && variant.color;
      });
      var gallery = (colorVariants[0] && colorVariants[0].images && colorVariants[0].images.length
        ? colorVariants[0].images
        : p.images && p.images.length ? p.images : [p.image]).filter(Boolean);
      var user = JSON.parse(localStorage.getItem(key + "user") || "null");
      var savedRating = user
        ? get("ratings").find(function (r) {
            return +r.productId === +id && r.email === user.email;
          })
        : null;
      var userRating = savedRating ? +savedRating.value : 0;
      var ratings = get("ratings").filter(function (r) {
        return +r.productId === +id;
      });
      var average = ratings.length
        ? ratings.reduce(function (sum, r) {
            return sum + (+r.value || 0);
          }, 0) / ratings.length
        : 0;
      var thumbnails = gallery
        .map(function (src, index) {
          return (
            '<button class="detail-thumb' +
            (index === 0 ? " selected" : "") +
            '" type="button" onclick="VT.selectDetailImage(this.querySelector(&quot;img&quot;))" aria-label="Ver imagen ' +
            (index + 1) +
            '"><img src="' +
            src +
            '" alt="Imagen ' +
            (index + 1) +
            " de " +
            esc(p.name) +
            '" onclick="VT.selectDetailImage(this)"></button>'
          );
        })
        .join("");
      var stars = [1, 2, 3, 4, 5]
        .map(function (value) {
          return (
            '<button class="rating-star' +
            (value <= userRating ? " selected" : "") +
            '" data-value="' +
            value +
            '" type="button" onclick="VT.rateProduct(' +
            id +
            "," +
            value +
            ')" aria-label="Calificar con ' +
            value +
            ' estrellas">★</button>'
          );
        })
        .join("");
      var specList = String(p.specs || "Sin especificaciones adicionales.")
        .split(/\n+/)
        .filter(function (line) {
          return line.trim();
        })
        .map(function (line) {
          return "<li>" + esc(line.trim()) + "</li>";
        })
        .join("");
      var available = Math.max(0, +p.stock || 0);
      var discount = +p.discount || 0;
      document.getElementById("detailBody").innerHTML =
        '<div class="commerce-detail"><section class="commerce-gallery"><div class="commerce-thumbs">' +
        thumbnails +
        '</div><div class="commerce-image">' +
        (gallery.length
          ? '<img id="detailMainImage" src="' +
            gallery[0] +
            '" alt="' +
            esc(p.name) +
            '" onclick="VT.expandImage(this.src, this.alt)">'
          : '<span class="detail-placeholder">💻</span>') +
        '</div></section><section class="commerce-info"><p class="commerce-kicker">' +
        esc(p.category) +
        " <span>· Producto disponible</span></p><h2>" +
        esc(p.name) +
        '</h2><div class="commerce-rating">★ ' +
        (ratings.length
          ? average.toFixed(1) +
            " de 5 · " +
            ratings.length +
            " calificación(es)"
          : "Aún sin calificaciones") +
        '</div><div class="commerce-price">' +
        price(p) +
        (discount
          ? '<span class="commerce-discount">' + discount + "% OFF</span>"
          : "") +
        '</div><p class="commerce-description">' +
        esc(p.description) +
        '</p><div class="commerce-quick-info">' +
        (p.capacity
          ? "<div><span>Capacidad</span><b>" + esc(p.capacity) + "</b></div>"
          : "") +
        (colorVariants.length
          ? '<div class="commerce-color-picker"><label for="detailColorSelect">Color</label><select id="detailColorSelect" onchange="VT.selectProductColor(' + id + ',this.value)">' +
            colorVariants.map(function (variant, index) { return '<option value="' + index + '">' + esc(variant.color) + '</option>'; }).join("") +
            '</select></div>'
          : p.colors ? "<div><span>Color disponible</span><b>" + esc(p.colors) + "</b></div>" : "") +
        '</div><section class="commerce-specs"><h3>Lo que debes saber de este producto</h3><ul>' +
        specList +
        '</ul></section><section class="detail-rating commerce-review"><h3>Califica este producto</h3><p class="rating-summary">' +
        (ratings.length
          ? "★ " +
            average.toFixed(1) +
            " de 5 · " +
            ratings.length +
            " calificación(es)"
          : "Aún no hay calificaciones. Sé el primero en opinar.") +
        '</p><div class="rating-stars">' +
        stars +
        '</div><small>Debes iniciar sesión para enviar tu calificación.</small></section></section><aside class="commerce-buy"><div class="buy-card"><span class="buy-label">Compra segura</span><h3>' +
        price(p) +
        '</h3><p class="buy-benefit">Envío gratis y seguimiento de tu pedido.</p><hr><p class="buy-stock"><b>Stock disponible</b><span>' +
        available +
        ' unidad(es) disponibles</span></p><button class="button buy-now" onclick="VT.add(' +
        id +
        ');detail.close();VT.cart()">Comprar ahora</button><button class="button pale buy-cart" onclick="VT.add(' +
        id +
        ')">Agregar al carrito</button><small class="buy-note">Productos originales · Pago seguro</small></div></aside></div>';
      detail.showModal();
      this.loadRatings(id);
    },
    loadRatings: async function (productId) {
      var user = JSON.parse(localStorage.getItem(key + "user") || "null");
      try {
        var url =
          "http://localhost:5097/api/products/" +
          productId +
          "/ratings" +
          (user && user.email
            ? "?email=" + encodeURIComponent(user.email)
            : "");
        var response = await fetch(url);
        if (!response.ok) return;
        var data = await response.json();
        var summary = document.querySelector(".rating-summary");
        if (summary)
          summary.textContent = data.count
            ? "★ " +
              Number(data.average).toFixed(1) +
              " de 5 · " +
              data.count +
              " calificación(es)"
            : "Aún no hay calificaciones. Sé el primero en opinar.";
        document.querySelectorAll(".rating-star").forEach(function (star) {
          star.classList.toggle(
            "selected",
            +star.dataset.value <= (+data.userRating || 0),
          );
        });
      } catch (_) {}
    },
    expandImage: function (src, alt) {
      var image = document.getElementById("zoomedProductImage");
      var dialog = document.getElementById("imageZoom");
      if (!image || !dialog || !src) return;
      image.src = src;
      image.alt = alt || "Imagen ampliada del producto";
      dialog.showModal();
    },
    selectDetailImage: function (image) {
      var main = document.getElementById("detailMainImage");
      if (!main || !image) return;
      main.src = image.src;
      document.querySelectorAll(".detail-thumb").forEach(function (button) {
        button.classList.toggle("selected", button.contains(image));
      });
    },
    selectProductColor: function (productId, variantIndex) {
      var product = products().find(function (item) { return item.id === productId; });
      var variant = product && product.colorVariants ? product.colorVariants[+variantIndex] : null;
      if (!variant) return;
      var gallery = (variant.images || []).filter(Boolean);
      if (!gallery.length) gallery = (product.images && product.images.length ? product.images : [product.image]).filter(Boolean);
      var thumbs = document.querySelector(".commerce-thumbs");
      var main = document.getElementById("detailMainImage");
      if (thumbs) {
        thumbs.innerHTML = gallery.map(function (src, index) {
          return '<button class="detail-thumb' + (index === 0 ? " selected" : "") + '" type="button" onclick="VT.selectDetailImage(this.querySelector(&quot;img&quot;))" aria-label="Ver imagen ' + (index + 1) + ' de color ' + esc(variant.color) + '"><img src="' + src + '" alt="' + esc(product.name + " color " + variant.color) + '"></button>';
        }).join("");
      }
      if (main && gallery.length) { main.src = gallery[0]; main.alt = product.name + " color " + variant.color; }
    },    rateProduct: async function (productId, value) {
      var user = JSON.parse(localStorage.getItem(key + "user") || "null");
      if (!user || !user.email) {
        alert("Inicia sesión o crea una cuenta para calificar este producto.");
        location.href = "auth.html?modo=login";
        return;
      }
      try {
        var response = await fetch(
          "http://localhost:5097/api/products/" + productId + "/ratings",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, value: value }),
          },
        );
        var result = await response.json();
        if (!response.ok)
          return alert(
            result.message || "No fue posible guardar la calificación.",
          );
      } catch (_) {
        return alert(
          "No se pudo guardar la calificación en SQL Server. Verifica que el servicio de Ventech esté iniciado.",
        );
      }
      var ratings = get("ratings");
      var index = ratings.findIndex(function (rating) {
        return +rating.productId === +productId && rating.email === user.email;
      });
      var record = {
        productId: productId,
        email: user.email,
        value: value,
        date: new Date().toISOString(),
      };
      if (index >= 0) ratings[index] = record;
      else ratings.push(record);
      set("ratings", ratings);
      this.detail(productId);
    },
    add: function (id) {
      var p = products().find(function (x) {
        return x.id === id;
      });
      if (!p || p.stock < 1) return alert("Producto sin existencias");
      var a = cart(),
        x = a.find(function (y) {
          return y.id === id;
        });
      if (x) x.qty++;
      else a.push({ id: id, qty: 1 });
      set("cart", a);
      refreshCount();
      this.cart();
    },
    cart: function () {
      var a = cart(),
        box = document.getElementById("cartItems"),
        total = 0;
      box.innerHTML = a.length
        ? a
            .map(function (x) {
              var p = products().find(function (y) {
                return y.id === x.id;
              }) || { name: "Producto", price: 0, discount: 0 };
              var v = x.qty * p.price * (1 - (p.discount || 0) / 100);
              total += v;
              return (
                '<div class="cart-line"><div class="cart-product"><b>' +
                p.name +
                "</b><small>" +
                money(v / x.qty) +
                " por unidad · " +
                p.stock +
                ' disponibles</small></div><div class="cart-actions"><div class="quantity-control"><button type="button" aria-label="Disminuir cantidad" onclick="VT.changeQty(' +
                x.id +
                ', -1)">−</button><span>' +
                x.qty +
                '</span><button type="button" aria-label="Aumentar cantidad" onclick="VT.changeQty(' +
                x.id +
                ', 1)">+</button></div><button class="remove-cart" type="button" aria-label="Eliminar producto" onclick="VT.remove(' +
                x.id +
                ')">×</button></div></div>'
              );
            })
            .join("")
        : "<p>Tu carrito está vacío.</p>";
      document.getElementById("total").textContent = money(total);
      drawer.classList.add("on");
      shade.classList.add("on");
    },
    close: function () {
      drawer.classList.remove("on");
      shade.classList.remove("on");
    },
    changeQty: function (id, delta) {
      var a = cart();
      var item = a.find(function (x) {
        return x.id === id;
      });
      var product = products().find(function (x) {
        return x.id === id;
      });
      if (!item || !product) return;
      var next = item.qty + delta;
      if (next < 1) return this.remove(id);
      if (next > product.stock)
        return alert(
          "Solo hay " + product.stock + " unidad(es) disponible(s).",
        );
      item.qty = next;
      set("cart", a);
      refreshCount();
      this.cart();
    },
    remove: function (id) {
      set(
        "cart",
        cart().filter(function (x) {
          return x.id !== id;
        }),
      );
      refreshCount();
      this.cart();
    },
    goCheckout: function () {
      var user = JSON.parse(localStorage.getItem(key + "user") || "null");
      if (user && user.email) {
        location.href = "mi-cuenta.html?origen=checkout";
        return;
      }
      var box = document.getElementById("cartItems");
      if (!document.getElementById("loginRequired"))
        box.insertAdjacentHTML(
          "beforeend",
          '<div class="login-required" id="loginRequired"><b>Inicia sesión para continuar</b><span>Necesitas una cuenta para registrar la entrega, tu factura y el seguimiento del pedido.</span><div><a class="button" href="auth.html?modo=login">Iniciar sesión</a><a class="button pale" href="auth.html?modo=registro">Crear cuenta</a></div></div>',
        );
    },
    auth: function (which) {
      document
        .getElementById("login")
        .classList.toggle("hide", which !== "login");
      document
        .getElementById("register")
        .classList.toggle("hide", which !== "register");
    },
    register: async function (e) {
      e.preventDefault();
      var i = e.target.querySelectorAll("input");
      if (i[5].value !== i[6].value)
        return alert("Las contraseñas no coinciden");
      try {
        var r = await fetch("http://localhost:5097/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            names: i[0].value,
            lastNames: i[1].value,
            document: i[2].value,
            phone: i[3].value,
            email: i[4].value,
            password: i[5].value,
          }),
        });
        var data = await r.json();
        if (!r.ok)
          return alert(data.message || "No fue posible crear la cuenta.");
        set("users", get("users").concat([data]));
        localStorage.setItem(key + "user", JSON.stringify(data));
        alert("Cuenta creada y guardada en SQL Server.");
        location.href = "mi-cuenta.html";
      } catch (_) {
        alert(
          "No se pudo conectar con SQL Server. Inicia el servicio de Ventech e intenta de nuevo.",
        );
      }
    },
    login: async function (e) {
      e.preventDefault();
      var fields = e.target.querySelectorAll("input");
      try {
        var r = await fetch("http://localhost:5097/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: fields[0].value,
            password: fields[1].value,
          }),
        });
        if (!r.ok) return alert("Correo o contraseña incorrectos.");
        var data = await r.json();
        localStorage.setItem(key + "user", JSON.stringify(data));
        location.href = "mi-cuenta.html";
      } catch (_) {
        alert(
          "No se pudo conectar con SQL Server. Inicia el servicio de Ventech e intenta de nuevo.",
        );
      }
    },
    recover: function () {
      alert(
        "En una tienda publicada se enviaría un código al correo registrado. Esta demostración no envía correos reales.",
      );
    },
    terms: function () {
      terms.showModal();
    },
    checkout: function () {
      var a = cart(),
        u = JSON.parse(localStorage.getItem(k + "user") || "null"),
        button = document.querySelector("form button.button");
      customer.textContent = u
        ? (u.name || "Cliente") + " - " + (u.email || "")
        : "Inicia sesion para continuar";
      if (!a.length) {
        checkoutItems.innerHTML =
          '<p class="notice">Tu carrito esta vacio. Regresa a la tienda y agrega al menos un producto.</p>';
        checkoutTotal.textContent = money(0);
        if (button) button.disabled = true;
        return;
      }
      if (button) button.disabled = false;
      var base = 0,
        discount = 0;
      checkoutItems.innerHTML = a
        .map(function (x) {
          var p = products().find(function (y) {
              return y.id === x.id;
            }) || { name: "Producto no disponible", price: 0, discount: 0 },
            unit = Number(p.price) || 0,
            d = (unit * x.qty * (Number(p.discount) || 0)) / 100;
          base += unit * x.qty;
          discount += d;
          return (
            "<p>" +
            x.qty +
            " x " +
            p.name +
            " <b>" +
            money(unit * x.qty - d) +
            "</b></p>"
          );
        })
        .join("");
      var subtotal = base - discount,
        iva = Math.round(subtotal * 0.19),
        shipping = 0,
        total = subtotal + iva + shipping;
      checkoutItems.innerHTML +=
        "<hr><p>Productos <b>" +
        money(base) +
        "</b></p><p>Descuento <b>- " +
        money(discount) +
        "</b></p><p>IVA (19%) <b>" +
        money(iva) +
        "</b></p><p>Envio <b>" +
        money(shipping) +
        "</b></p>";
      checkoutTotal.textContent = money(total);
    },
    order: async function (e) {
      e.preventDefault();
      var a = cart(),
        u = JSON.parse(localStorage.getItem(key + "user") || "null");
      if (!a.length) return alert("No hay productos en el carrito.");
      if (!u || !u.email)
        return alert("Inicia sesión antes de confirmar el pedido.");
      var payment = document.querySelector('input[name="pay"]:checked');
      try {
        var r = await fetch("http://localhost:5097/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: u.email,
            deliveryType: "Domicilio",
            department: val("dept"),
            city: val("city"),
            address: val("address"),
            neighborhood: val("neighborhood"),
            paymentMethod: payment ? payment.value : "PSE",
            shipping: 0,
            items: a.map(function (x) {
              return { productId: x.id, quantity: x.qty };
            }),
          }),
        });
        var data = await r.json();
        if (!r.ok)
          return alert(data.message || "No fue posible registrar el pedido.");
        var os = get("orders");
        os.unshift({
          id: data.id,
          date: new Date().toLocaleDateString("es-CO"),
          items: a,
          total: data.total,
          status: "Procesando",
          address: val("dept") + ", " + val("city") + " - " + val("address"),
          payment: payment ? payment.value : "PSE",
        });
        set("orders", os);
        set("cart", []);
        alert("Pedido registrado en SQL Server.");
        location.href = "mi-cuenta.html";
      } catch (_) {
        alert(
          "No se pudo conectar con SQL Server. Inicia el servicio de Ventech e intenta de nuevo.",
        );
      }
    },
    orders: function () {
      var q = val("orderSearch").toLowerCase(),
        state = val("orderState"),
        a = get("orders").filter(function (o) {
          return (
            (!state || o.status === state) &&
            (!q || String(o.id).indexOf(q) >= 0)
          );
        });
      orderList.innerHTML = a.length
        ? a
            .map(function (o) {
              return (
                '<article class="order"><b>Pedido #' +
                String(o.id).slice(-6) +
                '</b> <span class="status">' +
                o.status +
                "</span><p>" +
                o.date +
                " · " +
                o.address +
                "</p><p>" +
                o.items
                  .map(function (x) {
                    var p = products().find(function (y) {
                      return y.id === x.id;
                    });
                    return x.qty + " × " + (p ? p.name : "Producto");
                  })
                  .join(", ") +
                "</p><b>Total: " +
                money(o.total) +
                '</b><p><button class="button ghost" onclick="VT.invoice(' +
                o.id +
                ')">Descargar factura</button></p></article>'
              );
            })
            .join("")
        : '<div class="empty">No tienes compras registradas. <a href="Ventech.html">Ver productos</a></div>';
    },
    invoice: function (id) {
      var o = get("orders").find(function (x) {
        return x.id === id;
      });
      if (!o) return;
      var u = JSON.parse(localStorage.getItem(k + "user") || "null") || {};
      var base = 0,
        discountTotal = 0,
        rows = (o.items || [])
          .map(function (x, i) {
            var p = products().find(function (y) {
              return y.id === x.id;
            }) || { name: "Producto", price: 0, discount: 0 };
            var unit = Number(p.price) || 0,
              discount = (unit * x.qty * (Number(p.discount) || 0)) / 100,
              net = unit * x.qty - discount;
            base += unit * x.qty;
            discountTotal += discount;
            return (
              "<tr><td>" +
              (i + 1) +
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
      var subtotal = base - discountTotal,
        iva = Math.round(subtotal * 0.19),
        total = subtotal + iva,
        now = new Date(),
        date = now.toLocaleDateString("es-CO"),
        hour = now.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        number = "FAC-" + String(id).slice(-6),
        html =
          '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' +
          number +
          '</title><style>body{font-family:Arial,sans-serif;margin:0;color:#080d18;font-size:12px}.invoice{width:760px;margin:24px auto;padding:26px}.head{display:flex;justify-content:space-between;border-bottom:1px solid #666;padding-bottom:24px}.brand{font-size:23px;font-weight:800;letter-spacing:.5px}.sub{margin:6px 0 14px}.meta{text-align:left;padding-top:35px}.client{margin:18px 0}.client h3{font-size:12px;margin:0 0 8px}.client p{margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:20px}th{text-align:left;border-bottom:1px solid #777;padding:8px 0}td{padding:10px 0;border-bottom:0}th:nth-child(n+3),td:nth-child(n+3){text-align:right}.totals{width:320px;margin:22px 0 25px auto;border-top:1px solid #555;padding-top:8px}.totals p{display:flex;justify-content:space-between;margin:7px 0}.total{font-size:16px;font-weight:bold}.payment{margin-top:25px}.signatures{display:flex;justify-content:space-between;margin-top:65px;text-align:center}.signatures div{width:210px;border-top:1px solid #555;padding-top:6px}.thanks{text-align:center;margin-top:35px}@media print{.invoice{margin:0;width:auto;padding:22px}}</style></head><body><main class="invoice"><section class="head"><div><div class="brand">VENTECH</div><div class="sub">Sistema de Facturacion</div><div>Factura: ' +
          number +
          '</div></div><div class="meta">Fecha: ' +
          date +
          "<br>Hora: " +
          hour +
          '</div></section><section class="client"><h3>DATOS DEL CLIENTE</h3><p>Cliente: ' +
          esc(u.name || "Cliente registrado") +
          "</p><p>Documento: " +
          esc(u.document || "No registrado") +
          "</p><p>Telefono: " +
          esc(u.phone || "No registrado") +
          "</p><p>Correo: " +
          esc(u.email || o.email || "No registrado") +
          "</p><p>Direccion: " +
          esc(o.address || "No registrada") +
          "</p></section><table><thead><tr><th>#</th><th>Producto</th><th>Cant.</th><th>Precio</th><th>IVA</th><th>Total</th></tr></thead><tbody>" +
          rows +
          '</tbody></table><section class="totals"><p><b>Subtotal:</b><b>' +
          money(base) +
          "</b></p><p><b>IVA:</b><b>" +
          money(iva) +
          "</b></p><p><b>Descuento:</b><b>" +
          money(discountTotal) +
          '</b></p><p class="total"><span>TOTAL:</span><span>' +
          money(total) +
          '</span></p></section><section class="payment"><p>Metodo de pago: ' +
          esc(o.payment || "Pago registrado") +
          "</p><p>Dinero recibido: " +
          money(total) +
          '</p><p>Cambio: $0</p><br><b>Observaciones:</b><p>Compra generada desde Ventech.</p></section><section class="signatures"><div>Firma Cliente</div><div>Firma Responsable</div></section><p class="thanks">Gracias por comprar en VENTECH.</p></main></body></html>';
      var w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
      setTimeout(function () {
        w.print();
      }, 250);
    },
    tab: function (n) {
      ["dash", "inventory", "sales", "users", "reports"].forEach(function (x) {
        document.getElementById(x).classList.toggle("hide", x !== n);
      });
      tabTitle.textContent = {
        dash: "Dashboard",
        inventory: "Inventario",
        sales: "Ventas",
        users: "Usuarios",
        reports: "Reportes",
      }[n];
      if (n === "inventory") this.inventory();
    },
    admin: function () {
      productsN.textContent = products().length;
      lowN.textContent = products().filter(function (p) {
        return p.stock <= 5;
      }).length;
      salesN.textContent = get("orders").length;
      usersN.textContent = get("users").length;
      this.inventory();
      salesList.innerHTML = get("orders").length
        ? get("orders")
            .map(function (o) {
              return (
                "<p>Pedido #" +
                String(o.id).slice(-6) +
                " · " +
                money(o.total) +
                " · " +
                o.status +
                "</p>"
              );
            })
            .join("")
        : "No hay ventas registradas.";
      userList.innerHTML = get("users").length
        ? get("users")
            .map(function (u) {
              return "<p><b>" + u.name + "</b> · " + u.email + "</p>";
            })
            .join("")
        : "No hay usuarios registrados.";
    },
    inventory: function () {
      var q = val("adminSearch").toLowerCase(),
        a = products().filter(function (p) {
          return p.name.toLowerCase().indexOf(q) >= 0;
        });
      inventoryList.innerHTML = a.length
        ? a
            .map(function (p) {
              return (
                "<tr><td><b>" +
                p.name +
                "</b></td><td>" +
                p.category +
                "</td><td>" +
                money(p.price) +
                "</td><td>" +
                p.discount +
                "%</td><td>" +
                p.stock +
                '</td><td><button class="update" onclick="VT.edit(' +
                p.id +
                ')">Editar</button> <button class="update" onclick="VT.del(' +
                p.id +
                ')">Eliminar</button></td></tr>'
              );
            })
            .join("")
        : '<tr><td colspan="6">No hay productos registrados.</td></tr>';
    },
    form: function () {
      formTitle.textContent = "Agregar producto";
      id.value = "";
      document.querySelector("#productForm form").reset();
      productForm.showModal();
    },
    edit: function (n) {
      var p = products().find(function (x) {
        return x.id === n;
      });
      formTitle.textContent = "Editar producto";
      id.value = p.id;
      name.value = p.name;
      cat.value = p.category;
      productPrice.value = p.price;
      discount.value = p.discount;
      stock.value = p.stock;
      description.value = p.description;
      specs.value = p.specs || "";
      image.value = p.image || "";
      productForm.showModal();
    },
    save: function (e) {
      e.preventDefault();
      var a = products(),
        p = {
          id: +id.value || Date.now(),
          name: name.value,
          category: cat.value,
          price: +productPrice.value,
          discount: +discount.value,
          stock: +stock.value,
          description: description.value,
          specs: specs.value,
          image: image.value,
        },
        i = a.findIndex(function (x) {
          return x.id === p.id;
        });
      if (i >= 0) a[i] = p;
      else a.push(p);
      set("products", a);
      productForm.close();
      this.admin();
    },
    del: function (n) {
      if (confirm("¿Eliminar producto?")) {
        set(
          "products",
          products().filter(function (x) {
            return x.id !== n;
          }),
        );
        this.admin();
      }
    },
    report: function () {
      var text =
          "Nombre,Categoría,Precio,Stock,Descuento\n" +
          products()
            .map(function (p) {
              return (
                p.name +
                "," +
                p.category +
                "," +
                p.price +
                "," +
                p.stock +
                "," +
                p.discount
              );
            })
            .join("\n"),
        b = new Blob([text], { type: "text/csv" }),
        a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "inventario-ventech.csv";
      a.click();
    },
  };
})();
