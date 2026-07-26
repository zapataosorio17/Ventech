var Admin = (function () {
  var k = "vt_";
  function get(n) {
    return JSON.parse(localStorage.getItem(k + n) || "[]");
  }
  var productCache = get("products");
  function set(n, v) {
    var json = JSON.stringify(v);
    localStorage.setItem(k + n, json);
    if (n === "products") productCache = v.slice();
    if (n === "products" && Array.isArray(v) && v.length && json.length < 1000000) {
      try { localStorage.setItem(k + "products_backup", json); } catch (_) {}
    }
  }
  function products() {
    var current = get("products");
    if (current.length || !productCache.length) productCache = current;
    return productCache.slice();
  }
  function staff() {
    return get("staff");
  }
  function money(n) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  }
  function orderDate(value) {
    if (!value) return null;
    var text = String(value),
      parts = text.split(/[/-]/);
    if (parts.length === 3 && /^\d{1,2}$/.test(parts[0]))
      return new Date(+parts[2], +parts[1] - 1, +parts[0]);
    var date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  function filterOrdersByDate(source, from, to, status) {
    var min = from ? new Date(from + "T00:00:00") : null;
    var max = to ? new Date(to + "T23:59:59") : null;
    return source.filter(function (order) {
      var date = orderDate(order.date);
      return (
        (!status || order.status === status) &&
        (!min || (date && date >= min)) &&
        (!max || (date && date <= max))
      );
    });
  }
  function esc(s) {
    return String(s || "").replace(/</g, "&lt;");
  }
  function state(p) {
    return p.enabled === false
      ? "Inhabilitado"
      : p.stock <= 5
        ? "Stock bajo"
        : "Activo";
  }
  function pill(s) {
    return (
      '<span class="pill ' +
      (s === "Activo" || s === "Entregado"
        ? "good"
        : s === "Stock bajo" || s === "Procesando" || s === "En camino"
          ? "warn"
          : s === "Inhabilitado" || s === "Cancelado"
            ? "bad"
            : "") +
      '">' +
      s +
      "</span>"
    );
  }
  function log(a) {
    var x = get("activity");
    x.unshift({ date: new Date().toLocaleString("es-CO"), text: a });
    set("activity", x);
  }
  return {
    publishCatalog: function (items, showSuccess) {
      if (!window.VentechSupabaseCatalog) return Promise.resolve(false);
      return window.VentechSupabaseCatalog.syncProducts(items).then(function (count) {
        if (showSuccess) alert(count + " producto(s) sincronizados. Ya se ven en la tienda.");
        return true;
      }).catch(function (error) {
        alert(error.message || "El producto se guardó, pero no fue posible actualizar la tienda.");
        return false;
      });
    },
    syncSupabaseCatalog: async function () {
      if (!window.VentechSupabaseCatalog)
        return alert("La conexión del catálogo aún se está preparando. Intenta nuevamente en unos segundos.");
      await this.publishCatalog(products(), true);
    },
    syncDatabase: async function () {
      var a = products();
      if (!a.length)
        return alert(
          "No hay productos locales para sincronizar. Agrega al menos un producto primero.",
        );
      if (!window.VentechSql)
        return alert(
          "La conexión con SQL Server todavía no está lista. Recarga la página e intenta de nuevo.",
        );
      try {
        var result = await window.VentechSql.guardarProductos(a);
        alert(
          (result.saved || a.length) +
            " producto(s) guardado(s) correctamente en SQL Server.",
        );
      } catch (_) {
        alert(
          "No se pudo guardar en SQL Server. Verifica que Iniciar-Ventech-Api.bat siga abierto e intenta de nuevo.",
        );
      }
    },
    start: function () {
      if (sessionStorage.getItem(k + "staff")) {
        loginView.classList.add("hidden");
        panelView.classList.remove("hidden");
        this.applyAccess();
      } else {
        var exists = staff().length > 0;
        setupTab.classList.toggle("hidden", exists);
        if (!exists) this.mode("setup");
      }
    },
    allowed: function (section) {
      var user = JSON.parse(sessionStorage.getItem(k + "staff") || "null");
      if (!user) return false;
      if (user.role === "Administrador") return true;
      return (
        String(user.access || "dashboard")
          .split(",")
          .indexOf(section) >= 0
      );
    },
    applyAccess: function () {
      var self = this,
        user = JSON.parse(sessionStorage.getItem(k + "staff") || "null");
      document
        .querySelectorAll(".side [data-section]")
        .forEach(function (button) {
          button.classList.toggle(
            "hidden",
            !self.allowed(button.dataset.section),
          );
        });
      var first =
        [
          "dashboard",
          "products",
          "sales",
          "inventory",
          "users",
          "reports",
          "settings",
        ].find(function (section) {
          return self.allowed(section);
        }) || "dashboard";
      this.show(
        first,
        document.querySelector('.side [data-section="' + first + '"]'),
      );
      if (user && user.role !== "Administrador")
        sqlStatus.textContent =
          "Acceso limitado: " + (user.access || "dashboard");
    },
    mode: function (m) {
      signInForm.classList.toggle("hidden", m !== "login");
      setupForm.classList.toggle("hidden", m !== "setup");
      signInTab.classList.toggle("active", m === "login");
      setupTab.classList.toggle("active", m === "setup");
      accessTitle.textContent =
        m === "login" ? "Iniciar sesión" : "Crear primer administrador";
    },
    setup: function (e) {
      e.preventDefault();
      if (setupPassword.value !== setupConfirm.value)
        return alert("Las contraseñas no coinciden");
      var a = staff();
      a.push({
        id: Date.now(),
        name: setupName.value,
        email: setupEmail.value,
        password: setupPassword.value,
        phone: setupPhone.value,
        role: "Administrador",
        access: "dashboard,products,sales,users,inventory,reports,settings",
        enabled: true,
        created: new Date().toLocaleDateString("es-CO"),
      });
      set("staff", a);
      alert("Administrador creado. Ahora ingresa con sus credenciales.");
      this.mode("login");
    },
    login: function (e) {
      e.preventDefault();
      var u = staff().find(function (x) {
        return (
          x.email === loginEmail.value &&
          x.password === loginPassword.value &&
          x.enabled !== false
        );
      });
      if (!u) return alert("Datos inválidos o usuario inhabilitado");
      sessionStorage.setItem(k + "staff", JSON.stringify(u));
      log("Inicio de turno: " + u.name);
      this.trackSession("start", u);
      this.start();
    },
    trackSession: async function (action, u) {
      if (!u || !u.email) return;
      try {
        await fetch("http://localhost:5097/api/staff/sessions/" + action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: u.email, name: u.name || "Empleado" }),
          keepalive: true,
        });
      } catch (_) {
        console.warn("No se pudo registrar el turno en SQL Server.");
      }
    },
    logout: async function () {
      var u = JSON.parse(sessionStorage.getItem(k + "staff") || "null");
      if (u) {
        log("Fin de turno: " + u.name);
        await this.trackSession("end", u);
      }
      sessionStorage.removeItem(k + "staff");
      location.reload();
    },
    show: function (name, b) {
      if (!this.allowed(name))
        return alert("No tienes permiso para acceder a este módulo.");
      var map = [
        "dashboard",
        "products",
        "sales",
        "users",
        "inventory",
        "reports",
        "settings",
      ];
      map.forEach(function (x) {
        var e = document.getElementById(x + "Page");
        if (e) e.classList.toggle("hidden", x !== name);
      });
      document.querySelectorAll(".side button").forEach(function (x) {
        x.classList.remove("active");
      });
      if (b) b.classList.add("active");
      pageTitle.textContent = {
        dashboard: "Dashboard",
        products: "Productos",
        sales: "Ventas",
        users: "Usuarios",
        inventory: "Inventario",
        reports: "Reportes",
        settings: "Configuración",
      }[name];
      addProduct.classList.toggle(
        "hidden",
        name !== "products" && name !== "inventory",
      );
      if (name === "dashboard") this.applyAccess();
      if (name === "products" || name === "inventory") this.products();
      if (name === "sales") this.sales();
      if (name === "users") this.users();
      if (name === "settings") this.loadSettings();
    },
    dashboard: function () {
      var p = products(),
        o = filterOrdersByDate(
          get("orders"),
          dashDateFrom.value,
          dashDateTo.value,
          dashState.value,
        ),
        activity = get("activity"),
        users = get("users").filter(function (x) {
          return x.role === "Cliente";
        }),
        netSales = o
          .filter(function (x) {
            return x.status !== "Cancelado";
          })
          .reduce(function (sum, x) {
            return sum + (x.total || 0);
          }, 0),
        completed = o.filter(function (x) {
          return x.status === "Entregado";
        }).length,
        active = o.filter(function (x) {
          return x.status === "Procesando" || x.status === "En camino";
        }).length;
      salesMetric.textContent = money(netSales);
      ordersMetric.textContent = o.length;
      customersMetric.textContent = users.length;
      productsMetric.textContent = p.length;
      salesChange.textContent = completed + " pedido(s) entregado(s)";
      ordersChange.textContent = active + " pedido(s) en proceso";
      customersChange.textContent = "Base de clientes";
      productsChange.textContent =
        p.filter(function (x) {
          return x.enabled !== false;
        }).length + " producto(s) activos";

      var values = o
        .slice(0, 8)
        .reverse()
        .map(function (x) {
          return x.status === "Cancelado" ? 0 : +x.total || 0;
        });
      if (!values.length) values = [0, 0, 0, 0, 0];
      var max = Math.max.apply(null, values.concat([1])),
        width = 560,
        height = 150;
      var points = values
        .map(function (value, index) {
          var x =
            values.length === 1
              ? width / 2
              : (index / (values.length - 1)) * width;
          var y = height - (value / max) * 118 - 12;
          return x.toFixed(1) + "," + y.toFixed(1);
        })
        .join(" ");
      salesTrend.innerHTML =
        '<svg viewBox="0 0 560 150" role="img" aria-label="Tendencia de ventas"><defs><linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#1877f2" stop-opacity=".28"/><stop offset="1" stop-color="#1877f2" stop-opacity="0"/></linearGradient></defs><path class="trend-grid" d="M0 25H560M0 75H560M0 125H560"/><polygon points="0,150 ' +
        points +
        ' 560,150" fill="url(#trendFill)"/><polyline points="' +
        points +
        '" fill="none" stroke="#1877f2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="trend-labels"><span>Primer pedido</span><span>Último pedido</span></div>';

      var categories = {};
      p.forEach(function (product) {
        categories[product.category || "Sin categoría"] =
          (categories[product.category || "Sin categoría"] || 0) +
          Math.max(1, product.stock || 0);
      });
      var categoryEntries = Object.keys(categories).map(function (name) {
        return { name: name, value: categories[name] };
      });
      if (!categoryEntries.length)
        categoryEntries = [{ name: "Sin datos", value: 1 }];
      var palette = ["#1877f2", "#31b9a5", "#ffbd2e", "#8e6bea", "#ef6c8c"],
        total = categoryEntries.reduce(function (sum, item) {
          return sum + item.value;
        }, 0),
        cursor = 0;
      var slices = categoryEntries
        .map(function (item, index) {
          var start = cursor;
          cursor += (item.value / total) * 100;
          return (
            palette[index % palette.length] +
            " " +
            start.toFixed(1) +
            "% " +
            cursor.toFixed(1) +
            "%"
          );
        })
        .join(", ");
      categoryReport.innerHTML =
        '<div class="donut" style="background:conic-gradient(' +
        slices +
        ')"><span>' +
        categoryEntries.length +
        '<small>categorías</small></span></div><div class="category-list">' +
        categoryEntries
          .map(function (item, index) {
            return (
              '<p><i style="background:' +
              palette[index % palette.length] +
              '"></i><span>' +
              esc(item.name) +
              "</span><b>" +
              Math.round((item.value / total) * 100) +
              "%</b></p>"
            );
          })
          .join("") +
        "</div>";

      var statuses = ["Procesando", "En camino", "Entregado", "Cancelado"];
      orderStatusReport.innerHTML = statuses
        .map(function (name) {
          var count = o.filter(function (order) {
            return order.status === name;
          }).length;
          var percent = o.length ? Math.round((count / o.length) * 100) : 0;
          return (
            '<div class="status-line"><div><span class="status-dot ' +
            name.replace(" ", "-").toLowerCase() +
            '"></span><b>' +
            name +
            "</b><small>" +
            count +
            " pedido(s)</small></div><strong>" +
            percent +
            '%</strong><i><em style="width:' +
            percent +
            '%"></em></i></div>'
          );
        })
        .join("");

      var low = p.filter(function (x) {
        return x.stock <= 5 || x.enabled === false;
      });
      alerts.innerHTML = low.length
        ? low
            .slice(0, 4)
            .map(function (x) {
              return (
                '<div class="report-alert">' +
                pill(state(x)) +
                "<div><b>" +
                esc(x.name) +
                "</b><small>" +
                (x.enabled === false
                  ? "Producto inhabilitado"
                  : x.stock + " unidades disponibles") +
                "</small></div></div>"
              );
            })
            .join("")
        : '<p class="report-empty">✓ No hay alertas de inventario.</p>';

      recentActivity.innerHTML = activity.length
        ? activity
            .slice(0, 6)
            .map(function (item) {
              return (
                "<tr><td>" +
                esc(item.text) +
                "</td><td>" +
                esc(item.date) +
                '</td><td><span class="activity-ok">Registrado</span></td></tr>'
              );
            })
            .join("")
        : '<tr><td colspan="3" class="empty">Aún no hay actividad registrada.</td></tr>';
    },
    clearDashboardFilters: function () {
      dashDateFrom.value = "";
      dashDateTo.value = "";
      dashState.value = "";
      this.dashboard();
    },
    products: function () {
      var q = (productSearch ? productSearch.value : "").toLowerCase(),
        f = productState ? productState.value : "";
      var a = products().filter(function (x) {
        return (
          (!q || x.name.toLowerCase().indexOf(q) >= 0) &&
          (!f ||
            (f === "low" && x.stock <= 5) ||
            (f === "disabled" && x.enabled === false))
        );
      });
      var html = a.length
        ? a
            .map(function (x) {
              return (
                "<tr><td><b>" +
                esc(x.name) +
                "</b></td><td>" +
                esc(x.category) +
                "</td><td>" +
                money(x.price) +
                "</td><td>" +
                x.discount +
                "%</td><td>" +
                x.stock +
                "</td><td>" +
                pill(state(x)) +
                '</td><td><button type="button" onclick="Admin.editProduct(' +
                x.id +
                ')">Editar</button><button type="button" onclick="Admin.toggleProduct(' +
                x.id +
                ')">' +
                (x.enabled === false ? "Habilitar" : "Inhabilitar") +
                '</button><button type="button" onclick="Admin.deleteProduct(' +
                x.id +
                ')">Eliminar</button></td></tr>'
              );
            })
            .join("")
        : '<tr><td colspan="7">No hay productos registrados.</td></tr>';
      if (productRows) productRows.innerHTML = html;
      if (inventoryRows) inventoryRows.innerHTML = html;
    },
    loadCategories: async function (selected) {
      try {
        var r = await fetch("http://localhost:5097/api/categories"),
          a = await r.json();
        productCategory.innerHTML =
          '<option value="">Selecciona una categoría</option>' +
          a
            .map(function (c) {
              return (
                '<option value="' +
                esc(c.name) +
                '">' +
                esc(c.name) +
                "</option>"
              );
            })
            .join("");
        if (selected) productCategory.value = selected;
      } catch (_) {
        productCategory.innerHTML =
          "<option>Portátiles</option><option>Computadores de escritorio</option><option>Celulares y tablets</option><option>Audio</option><option>Accesorios</option><option>Componentes</option><option>Gaming</option><option>Redes y conectividad</option>";
        if (selected) productCategory.value = selected;
      }
    },
    manageCategories: async function () {
      try {
        var r = await fetch("http://localhost:5097/api/categories"),
          a = await r.json();
        categoryRows.innerHTML =
          a
            .map(function (c) {
              return (
                '<div class="category-row"><input id="categoryName' +
                c.id +
                '" value="' +
                esc(c.name) +
                '"><button class="btn alt" type="button" onclick="Admin.renameCategory(' +
                c.id +
                ')">Guardar</button></div>'
              );
            })
            .join("") || '<p class="empty">No hay categorías.</p>';
        categoryDialog.showModal();
      } catch (_) {
        alert("No se pudo cargar las categorías desde SQL Server.");
      }
    },
    createCategory: async function (e) {
      e.preventDefault();
      try {
        var r = await fetch("http://localhost:5097/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newCategoryName.value }),
          }),
          d = await r.json();
        if (!r.ok)
          return alert(d.message || "No fue posible crear la categoría.");
        newCategoryName.value = "";
        await this.loadCategories(d.name);
        await this.manageCategories();
      } catch (_) {
        alert("No se pudo conectar con SQL Server.");
      }
    },
    renameCategory: async function (id) {
      var name = document.getElementById("categoryName" + id).value;
      try {
        var r = await fetch("http://localhost:5097/api/categories/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: name }),
          }),
          d = await r.json();
        if (!r.ok)
          return alert(d.message || "No fue posible modificar la categoría.");
        await this.loadCategories(d.name);
        await this.manageCategories();
      } catch (_) {
        alert("No se pudo conectar con SQL Server.");
      }
    },
    productForm: async function () {
      productFormTitle.textContent = "Agregar producto";
      editProductId.value = "";
      document.querySelector("#productDialog form").reset();
      await this.loadCategories();
      productEnabled.value = "true";
      this.renderColorVariants([]);
      productDialog.showModal();
    },
    editProduct: async function (id) {
      var p = products().find(function (x) {
        return x.id === id;
      });
      if (!p) {
        alert("El producto ya no está disponible. Recarga el panel y vuelve a intentarlo.");
        return;
      }
      productFormTitle.textContent = "Editar producto";
      editProductId.value = p.id;
      productName.value = p.name;
      await this.loadCategories(p.category);
      productPrice.value = p.price;
      productDiscount.value = p.discount;
      productVat.value = p.vat === undefined ? 19 : p.vat;
      productEnabled.value = p.enabled === false ? "false" : "true";
      productDescription.value = p.description;
      productCapacity.value = p.capacity || "";
      productSpecs.value = p.specs || "";
      var variants = p.colorVariants || String(p.colors || "").split(",").map(function (color) { return { color: color.trim(), images: [] }; }).filter(function (variant) { return variant.color; });
      variants = variants.map(function (variant, index) {
        return { color: variant.color, images: variant.images || [], stock: variant.stock === undefined ? (index === 0 ? Math.max(0, Number(p.stock) || 0) : 0) : variant.stock };
      });
      this.renderColorVariants(variants);
      productDialog.showModal();
    },
    renderColorVariants: function (variants) {
      var host = document.getElementById("productColorVariants");
      if (!host) return;
      host.innerHTML = "";
      (variants || []).forEach(function (variant) { Admin.addColorVariant(variant); });
    },
    addColorVariant: function (variant) {
      var host = document.getElementById("productColorVariants");
      if (!host) return;
      var row = document.createElement("div");
      row.className = "color-variant-row";
      row._savedImages = (variant && variant.images ? variant.images : []).filter(Boolean);
      row.innerHTML = '<label>Nombre del color<input class="variant-color" placeholder="Ej. Negro" value="' + esc((variant && variant.color) || "") + '" required></label><label>Cantidad<input class="variant-stock" type="number" min="0" value="' + Math.max(0, Number(variant && variant.stock) || 0) + '" required></label><label>Imágenes de este color<input class="variant-files" type="file" multiple accept="image/*"></label><div class="variant-summary">' + (row._savedImages.length ? row._savedImages.length + " imagen(es) guardada(s)" : "Aún no hay imágenes para este color") + '</div><button class="variant-remove" type="button" aria-label="Eliminar color">Eliminar</button>';
      row.querySelector(".variant-remove").onclick = function () { row.remove(); };
      host.appendChild(row);
    },
    prepareImage: function (file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onerror = reject;
        reader.onload = function () {
          var image = new Image();
          image.onerror = reject;
          image.onload = function () {
            var max = 1000;
            var scale = Math.min(1, max / Math.max(image.width, image.height));
            var canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            var context = canvas.getContext("2d");
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          };
          image.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    },
    readColorVariants: function () {
      return Promise.all(Array.from(document.querySelectorAll(".color-variant-row")).map(function (row) {
        var color = row.querySelector(".variant-color").value.trim();
        var stock = Math.max(0, Number(row.querySelector(".variant-stock").value) || 0);
        var files = Array.from(row.querySelector(".variant-files").files).slice(0, 5);
        if (!files.length) return Promise.resolve({ color: color, stock: stock, images: row._savedImages || [] });
        return Promise.all(files.map(function (file) {
          return Admin.prepareImage(file);
        })).then(function (images) { return { color: color, stock: stock, images: images }; });
      })).then(function (variants) { return variants.filter(function (variant) { return variant.color; }); });
    },
    saveProduct: function (e) {
      e.preventDefault();
      var self = this;
      var done = function (colorVariants) {
        if (!colorVariants.length) {
          alert("Agrega al menos un color con su cantidad disponible.");
          return;
        }
        var totalStock = colorVariants.reduce(function (sum, variant) { return sum + variant.stock; }, 0);
        var imgs = colorVariants[0] && colorVariants[0].images ? colorVariants[0].images : [];
        var a = products(),
          p = {
            id: +editProductId.value || Date.now(),
            name: productName.value,
            category: productCategory.value,
            price: +productPrice.value,
            discount: +productDiscount.value,
            vat: +productVat.value,
            stock: totalStock,
            enabled: productEnabled.value === "true",
            description: productDescription.value,
            capacity: productCapacity.value.trim(),
            colors: colorVariants.map(function (variant) { return variant.color; }).join(", "),
            colorVariants: colorVariants,
            specs: productSpecs.value,
            image: imgs[0] || (colorVariants[0] && colorVariants[0].images[0]) || "",
            images: imgs,
          };
        var i = a.findIndex(function (x) {
          return x.id === p.id;
        });
        if (i < 0) {
          i = a.findIndex(function (x) {
            return String(x.name || "").trim().toLowerCase() === p.name.trim().toLowerCase();
          });
          if (i >= 0) p.id = a[i].id;
        }
        if (i >= 0) a[i] = p;
        else a.push(p);
        a = a.filter(function (item, index, list) {
          var name = String(item.name || "").trim().toLowerCase();
          return list.findIndex(function (other) {
            return String(other.name || "").trim().toLowerCase() === name;
          }) === index;
        });
        try {
          set("products", a);
        } catch (error) {
          alert("No fue posible guardar porque las imágenes ocupan demasiado espacio. Usa hasta 5 imágenes livianas por color (preferiblemente menores de 500 KB).");
          return;
        }
        self.publishCatalog(a, false);
        if (window.VentechSql && /^(localhost|127\.0\.0\.1)$/i.test(location.hostname)) {
          window.VentechSql.guardarProductos(a).catch(function () {
            alert(
              "El producto quedó guardado en esta pantalla, pero no se pudo insertar en SQL Server. Verifica que el servicio esté abierto.",
            );
          });
        }
        log((i >= 0 ? "Producto modificado: " : "Producto creado: ") + p.name);
        productDialog.close();
        self.products();
        self.dashboard();
      };
      this.readColorVariants().then(function (colorVariants) {
        done(colorVariants);
      }).catch(function () {
        alert("No fue posible procesar las imágenes seleccionadas. Intenta con archivos JPG o PNG más livianos.");
      });
    },
    toggleProduct: function (id) {
      var a = products(),
        p = a.find(function (x) {
          return x.id === id;
        });
      if (!p) return alert("No fue posible encontrar el producto. Recarga el panel.");
      p.enabled = p.enabled === false;
      set("products", a);
      log("Estado de producto modificado: " + p.name);
      this.products();
      this.publishCatalog(a, false);
    },
    deleteProduct: function (id) {
      if (confirm("¿Eliminar este producto?")) {
        var p = products().find(function (x) {
          return x.id === id;
        });
        if (!p) return alert("No fue posible encontrar el producto. Recarga el panel.");
        var remaining = products().filter(function (x) {
          return x.id !== id;
        });
        set("products", remaining);
        log("Producto eliminado: " + p.name);
        this.products();
        this.publishCatalog(remaining, false);
      }
    },
    sales: function () {
      var q = (saleSearch ? saleSearch.value : "").toLowerCase(),
        f = saleStatus ? saleStatus.value : "",
        from = saleDateFrom ? saleDateFrom.value : "",
        to = saleDateTo ? saleDateTo.value : "";
      var a = filterOrdersByDate(get("orders"), from, to, f).filter(
        function (x) {
          return (
            !q ||
            String(x.id).indexOf(q) >= 0 ||
            String(x.email || "")
              .toLowerCase()
              .indexOf(q) >= 0
          );
        },
      );
      salesRows.innerHTML = a.length
        ? a
            .map(function (o) {
              return (
                '<article class="card admin-sale-card"><div class="admin-sale-head"><div><span class="sale-label">Pedido</span><h3>#' +
                String(o.id).slice(-6) +
                "</h3></div>" +
                pill(o.status) +
                '</div><div class="admin-sale-info"><div><span>Fecha de compra</span><b>' +
                esc(o.date || "Sin fecha") +
                "</b></div><div><span>Entrega</span><b>" +
                esc(o.address || "Tienda física") +
                "</b></div>" +
                (o.email
                  ? "<div><span>Cliente</span><b>" + esc(o.email) + "</b></div>"
                  : "") +
                '</div><div class="admin-sale-footer"><div class="sale-total"><span>Total de la venta</span><b>' +
                money(o.total) +
                '</b></div><div class="sale-actions"><button class="btn alt" onclick="Admin.status(' +
                o.id +
                ')">Actualizar estado</button><button class="btn alt" onclick="Admin.invoice(' +
                o.id +
                ')">Factura</button><button class="btn" onclick="Admin.email(' +
                o.id +
                ')">Enviar correo</button></div></div></article>'
              );
            })
            .join("")
        : '<p class="empty">No hay ventas registradas.</p>';
    },
    clearSalesFilters: function () {
      saleSearch.value = "";
      saleStatus.value = "";
      saleDateFrom.value = "";
      saleDateTo.value = "";
      this.sales();
    },
    saleForm: function () {
      var p = products().filter(function (x) {
        return x.stock > 0 && x.enabled !== false;
      });
      if (!p.length) return alert("No hay productos disponibles");
      saleProduct.innerHTML = p
        .map(function (x) {
          return (
            '<option value="' +
            x.id +
            '">' +
            esc(x.name) +
            " (" +
            x.stock +
            " disponibles)</option>"
          );
        })
        .join("");
      saleDialog.showModal();
    },
    saveSale: function (e) {
      e.preventDefault();
      var a = products(),
        p = a.find(function (x) {
          return x.id === +saleProduct.value;
        }),
        q = +saleQty.value;
      if (q > p.stock) return alert("Stock insuficiente");
      p.stock -= q;
      set("products", a);
      var os = get("orders"),
        total = q * p.price * (1 - p.discount / 100);
      os.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString("es-CO"),
        items: [{ id: p.id, qty: q }],
        total: total,
        status: "Procesando",
        address: saleDelivery.value,
        email: saleEmail.value,
      });
      set("orders", os);
      log("Venta física registrada: " + p.name);
      saleDialog.close();
      this.sales();
      this.applyAccess();
    },
    status: function (id) {
      var o = get("orders").find(function (x) {
        return x.id === id;
      });
      if (!o) return alert("No se encontró el pedido.");
      if (o.status === "Cancelado")
        return alert("Los pedidos cancelados no se pueden actualizar.");
      orderStatusId.value = o.id;
      orderStatusValue.value = o.status;
      orderStatusInfo.textContent =
        "Pedido #" + String(o.id).slice(-6) + " · Estado actual: " + o.status;
      orderStatusDialog.showModal();
    },
    saveOrderStatus: async function (e) {
      e.preventDefault();
      var id = Number(orderStatusId.value),
        next = orderStatusValue.value,
        orders = get("orders"),
        order = orders.find(function (x) {
          return x.id === id;
        }),
        staffUser = JSON.parse(sessionStorage.getItem(k + "staff") || "null");
      if (!order) return alert("No se encontró el pedido.");
      try {
        var response = await fetch(
          "http://localhost:5097/api/orders/" + id + "/status",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: next,
              changedBy: staffUser ? staffUser.name : "Panel administrativo",
              observation: "Cambio realizado desde Ventas",
            }),
          },
        );
        var data = await response.json().catch(function () {
          return {};
        });
        if (!response.ok)
          throw new Error(data.message || "No se pudo guardar el cambio.");
        order.status = data.status || next;
        set("orders", orders);
        log(
          "Pedido #" + String(id).slice(-6) + " actualizado a " + order.status,
        );
        orderStatusDialog.close();
        this.sales();
        alert("Estado actualizado y guardado en SQL Server.");
      } catch (error) {
        alert(error.message || "No se pudo conectar con SQL Server.");
      }
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
    email: function (id) {
      var o = get("orders").find(function (x) {
        return x.id === id;
      });
      var email = prompt("Correo del cliente", o.email || "");
      if (email) {
        o.email = email;
        var a = get("orders");
        a[
          a.findIndex(function (x) {
            return x.id === id;
          })
        ] = o;
        set("orders", a);
        alert(
          "En una versión publicada, la factura se enviaría a " + email + ".",
        );
      }
    },
    users: function () {
      var a = staff().concat(get("users")),
        q = (userSearch ? userSearch.value : "").toLowerCase(),
        accessLabels = {
          dashboard: "Dashboard",
          products: "Productos",
          sales: "Ventas",
          users: "Usuarios",
          inventory: "Inventario",
          reports: "Reportes",
          settings: "Configuración",
        };
      a = a.filter(function (x) {
        return !q || (x.name + " " + x.email).toLowerCase().indexOf(q) >= 0;
      });
      userRows.innerHTML = a.length
        ? a
            .map(function (u) {
              var initials = String(u.name || "VT")
                .split(" ")
                .filter(Boolean)
                .map(function (part) {
                  return part[0];
                })
                .join("")
                .slice(0, 2)
                .toUpperCase();
              var roleClass = String(u.role || "Cliente")
                .toLowerCase()
                .replace(/[^a-z]/g, "");
              var permissions = String(u.access || "")
                .split(",")
                .filter(Boolean)
                .map(function (permission) {
                  return (
                    '<span class="access-tag">' +
                    (accessLabels[permission.trim()] || permission.trim()) +
                    "</span>"
                  );
                })
                .join("");
              if (!permissions)
                permissions =
                  '<span class="access-tag store-access">Tienda</span>';
              return (
                '<article class="card user-card"><div class="user-card-head"><div class="user-identity"><span class="user-avatar">' +
                initials +
                "</span><div><h3>" +
                esc(u.name) +
                '</h3><a href="mailto:' +
                esc(u.email) +
                '">' +
                esc(u.email) +
                '</a></div></div><div class="user-status">' +
                '<span class="pill user-role role-' +
                roleClass +
                '">' +
                esc(u.role || "Cliente") +
                "</span>" +
                (u.enabled === false
                  ? '<span class="user-disabled">Inhabilitado</span>'
                  : '<span class="user-active">Activo</span>') +
                '</div></div><div class="user-permissions"><span>Permisos habilitados</span><div>' +
                permissions +
                '</div></div><div class="user-actions"><button class="btn alt" onclick="Admin.userStatus(' +
                u.id +
                ')">' +
                (u.enabled === false ? "Habilitar usuario" : "Inhabilitar") +
                '</button><button class="btn" onclick="Admin.reset(' +
                u.id +
                ')">Cambiar contraseña</button></div></article>'
              );
            })
            .join("")
        : '<p class="empty">No hay usuarios registrados.</p>';
    },
    userForm: function () {
      userDialog.showModal();
    },
    saveUser: function (e) {
      e.preventDefault();
      var a = staff();
      a.push({
        id: Date.now(),
        name: userName.value,
        email: userEmail.value,
        role: userRole.value,
        password: userPassword.value,
        access: userAccess.value,
        enabled: true,
        created: new Date().toLocaleDateString("es-CO"),
      });
      set("staff", a);
      log("Empleado creado: " + userName.value);
      userDialog.close();
      this.users();
    },
    userStatus: function (id) {
      var a = staff(),
        u = a.find(function (x) {
          return x.id === id;
        });
      if (!u) return alert("Los clientes se gestionan desde su registro");
      u.enabled = u.enabled === false;
      set("staff", a);
      log("Usuario actualizado: " + u.name);
      this.users();
    },
    reset: function (id) {
      var a = staff(),
        u = a.find(function (x) {
          return x.id === id;
        }),
        p = prompt("Nueva contraseña para " + u.name);
      if (p) {
        u.password = p;
        set("staff", a);
        log("Contraseña restablecida: " + u.name);
        alert("Contraseña actualizada.");
      }
    },
    report: function (which) {
      var rows =
        which === "products"
          ? products()
          : which === "sales"
            ? get("orders")
            : staff().concat(get("users"));
      var text = rows.length
        ? Object.keys(rows[0]).join(",") +
          "\n" +
          rows
            .map(function (r) {
              return Object.keys(r)
                .map(function (x) {
                  return '"' + String(r[x]).replace(/"/g, '""') + '"';
                })
                .join(",");
            })
            .join("\n")
        : "Sin datos";
      var b = new Blob([text], { type: "text/csv" }),
        a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = "reporte-" + which + "-ventech.csv";
      a.click();
    },
    savePromotion: function (e) {
      e.preventDefault();
      var f = promotionFile.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = async function () {
        try {
          var q = await fetch("http://localhost:5097/api/promotion", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: promotionTitle.value,
              text: promotionText.value,
              image: r.result,
            }),
          });
          if (!q.ok) throw 0;
          alert("Promoción publicada en la página principal.");
        } catch (_) {
          alert("No se pudo publicar la promoción.");
        }
      };
      r.readAsDataURL(f);
    },
    loadSettings: function () {
      var c = JSON.parse(localStorage.getItem(k + "company") || "{}");
      companyName.value = c.name || "Ventech";
      companyPhone.value = c.phone || "";
      companyAddress.value = c.address || "";
      profileImage.value = c.profile || "";
    },
    settings: function (e) {
      e.preventDefault();
      localStorage.setItem(
        k + "company",
        JSON.stringify({
          name: companyName.value,
          phone: companyPhone.value,
          address: companyAddress.value,
          profile: profileImage.value,
        }),
      );
      log("Configuración de empresa actualizada");
      alert("Configuración guardada.");
    },
  };
})();
