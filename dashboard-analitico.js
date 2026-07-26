(function () {
  var money = function (value) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };
  var text = function (value) {
    return String(value || "").replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  };
  function load() {
    document.getElementById("updated").textContent = "Actualizando datos…";
    fetch("http://localhost:5097/api/dashboard")
      .then(function (r) {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(render)
      .catch(function () {
        document.getElementById("updated").textContent =
          "No fue posible cargar los datos de SQL Server.";
      });
  }
  function render(data) {
    var s = data.summary || {};
    document.getElementById("sales").textContent = money(s.VentasNetas);
    document.getElementById("orders").textContent = s.TotalPedidos || 0;
    document.getElementById("ordersDetail").textContent =
      (s.PedidosEnProceso || 0) +
      " en proceso · " +
      (s.PedidosEntregados || 0) +
      " entregados";
    document.getElementById("customers").textContent =
      s.ClientesRegistrados || 0;
    document.getElementById("products").textContent = s.ProductosActivos || 0;
    document.getElementById("stockDetail").textContent =
      (s.AlertasInventario || 0) + " alertas de inventario";
    document.getElementById("alertCount").textContent =
      (s.AlertasInventario || 0) + " alerta(s)";
    document.getElementById("updated").textContent =
      "Actualizado: " + new Date(data.updatedAt).toLocaleString("es-CO");
    var max = Math.max.apply(
      null,
      (data.categories || [])
        .map(function (x) {
          return Number(x.total);
        })
        .concat([1]),
    );
    document.getElementById("categoryChart").innerHTML = (data.categories || [])
      .length
      ? data.categories
          .map(function (x) {
            return (
              '<div class="bar-row"><span>' +
              text(x.name) +
              '</span><div class="track"><div class="fill" style="width:' +
              Math.max(5, (Number(x.total) / max) * 100) +
              '%"></div></div><b>' +
              money(x.total) +
              "</b></div>"
            );
          })
          .join("")
      : '<p class="empty">Aún no hay ventas por categoría.</p>';
    var trend = data.trend || [],
      trendMax = Math.max.apply(
        null,
        trend
          .map(function (x) {
            return Number(x.total);
          })
          .concat([1]),
      );
    document.getElementById("trendChart").innerHTML = trend.length
      ? trend
          .map(function (x) {
            return (
              '<div class="trend-bar"><b>' +
              money(x.total) +
              '</b><i style="height:' +
              Math.max(8, (Number(x.total) / trendMax) * 100) +
              '%"></i><span>' +
              new Date(x.date).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "short",
              }) +
              "</span></div>"
            );
          })
          .join("")
      : '<p class="empty">Aún no hay suficientes ventas para mostrar una tendencia.</p>';
    document.getElementById("paymentChart").innerHTML = (data.payments || [])
      .length
      ? data.payments
          .map(function (x) {
            return (
              '<div class="payment"><span>' +
              text(x.name) +
              "</span><b>" +
              x.count +
              " pedido(s)</b></div>"
            );
          })
          .join("")
      : '<p class="empty">No hay pagos registrados.</p>';
    document.getElementById("cancelValue").textContent = money(
      s.ValorCancelado,
    );
    var statuses = [
      ["Procesando", s.PedidosEnProceso, ""],
      ["Entregado", s.PedidosEntregados, "delivered"],
      ["Cancelado", s.PedidosCancelados, "cancel"],
    ];
    document.getElementById("orderStatus").innerHTML = statuses
      .map(function (x) {
        return (
          '<div class="status-line"><span><i class="dot ' +
          x[2] +
          '"></i>' +
          x[0] +
          "</span><b>" +
          Number(x[1] || 0) +
          "</b></div>"
        );
      })
      .join("");
    document.getElementById("inventoryRows").innerHTML =
      (data.inventory || [])
        .map(function (x) {
          var low = x.state !== "Disponible";
          return (
            "<tr><td>" +
            text(x.product) +
            "</td><td>" +
            text(x.category) +
            "</td><td>" +
            x.stock +
            "</td><td>" +
            x.minimum +
            '</td><td><span class="pill ' +
            (low ? "low" : "") +
            '">' +
            text(x.state) +
            "</span></td></tr>"
          );
        })
        .join("") ||
      '<tr><td colspan="5">No hay productos registrados.</td></tr>';
    document.getElementById("recentOrders").innerHTML =
      (data.orders || [])
        .map(function (x) {
          return (
            '<div class="recent-item"><div class="recent-top"><b>' +
            text(x.number) +
            "</b><b>" +
            money(x.total) +
            "</b></div><small>" +
            text(x.customer) +
            " · " +
            text(x.state) +
            " · " +
            new Date(x.date).toLocaleDateString("es-CO") +
            "</small></div>"
          );
        })
        .join("") || '<p class="empty">Aún no hay pedidos.</p>';
  }
  document.getElementById("refresh").addEventListener("click", load);
  load();
})();
