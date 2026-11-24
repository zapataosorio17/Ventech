USE Ventech;
GO

CREATE OR ALTER VIEW vt.vw_PBI_Resumen AS
SELECT
    (SELECT COUNT(*) FROM vt.Productos WHERE Estado = 'Activo') AS ProductosActivos,
    (SELECT COUNT(*) FROM vt.Productos WHERE StockActual <= StockMinimo OR Estado = 'Inhabilitado') AS AlertasInventario,
    (SELECT COUNT(*) FROM vt.Usuarios WHERE Activo = 1) AS ClientesRegistrados,
    (SELECT COUNT(*) FROM vt.Pedidos) AS TotalPedidos,
    (SELECT COUNT(*) FROM vt.Pedidos WHERE Estado = 'Procesando') AS PedidosEnProceso,
    (SELECT COUNT(*) FROM vt.Pedidos WHERE Estado = 'Entregado') AS PedidosEntregados,
    (SELECT COUNT(*) FROM vt.PedidosCancelados) AS PedidosCancelados,
    ISNULL((SELECT SUM(Total) FROM vt.Pedidos WHERE Estado <> 'Cancelado'), 0) AS VentasNetas,
    ISNULL((SELECT SUM(Total) FROM vt.Pedidos), 0) AS VentasBrutas,
    ISNULL((SELECT SUM(Total) FROM vt.PedidosCancelados), 0) AS ValorCancelado;
GO

CREATE OR ALTER VIEW vt.vw_PBI_Ventas AS
SELECT
    p.PedidoId, p.NumeroPedido, p.FechaPedido, p.Estado,
    p.TipoEntrega, p.Ciudad, p.Departamento,
    u.UsuarioId, CONCAT(u.Nombres, ' ', ISNULL(u.Apellidos, '')) AS Cliente,
    u.Correo AS CorreoCliente,
    p.Subtotal, p.Descuento, p.IVA, p.CostoEnvio, p.Total,
    f.NumeroFactura, f.Estado AS EstadoFactura,
    pg.MetodoPago, pg.Estado AS EstadoPago
FROM vt.Pedidos p
INNER JOIN vt.Usuarios u ON u.UsuarioId = p.UsuarioId
LEFT JOIN vt.Facturas f ON f.PedidoId = p.PedidoId
LEFT JOIN vt.Pagos pg ON pg.PedidoId = p.PedidoId;
GO

CREATE OR ALTER VIEW vt.vw_PBI_DetalleVentas AS
SELECT
    p.PedidoId, p.NumeroPedido, p.FechaPedido, p.Estado AS EstadoPedido,
    pr.ProductoId, pr.Nombre AS Producto, c.Nombre AS Categoria,
    d.Cantidad, d.PrecioUnitario, d.Descuento, d.IVA, d.TotalLinea
FROM vt.DetallePedidos d
INNER JOIN vt.Pedidos p ON p.PedidoId = d.PedidoId
INNER JOIN vt.Productos pr ON pr.ProductoId = d.ProductoId
INNER JOIN vt.Categorias c ON c.CategoriaId = pr.CategoriaId;
GO

CREATE OR ALTER VIEW vt.vw_PBI_Inventario AS
SELECT
    p.ProductoId, p.Codigo, p.Nombre AS Producto, c.Nombre AS Categoria,
    p.Precio, p.DescuentoPorcentaje, p.IVAPorcentaje,
    p.StockActual, p.StockMinimo, p.Estado,
    CASE WHEN p.Estado = 'Inhabilitado' THEN 'Inhabilitado'
         WHEN p.StockActual <= p.StockMinimo THEN 'Stock bajo'
         ELSE 'Disponible' END AS EstadoInventario
FROM vt.Productos p
INNER JOIN vt.Categorias c ON c.CategoriaId = p.CategoriaId;
GO

CREATE OR ALTER VIEW vt.vw_PBI_Cancelados AS
SELECT
    pc.CancelacionId, pc.PedidoId, pc.NumeroPedido, pc.Motivo,
    pc.EstadoAnterior, pc.Total, pc.FechaPedido, pc.FechaCancelacion,
    CONCAT(u.Nombres, ' ', ISNULL(u.Apellidos, '')) AS Cliente, u.Correo
FROM vt.PedidosCancelados pc
INNER JOIN vt.Usuarios u ON u.UsuarioId = pc.UsuarioId;
GO

CREATE OR ALTER VIEW vt.vw_PBI_Clientes AS
SELECT
    u.UsuarioId, CONCAT(u.Nombres, ' ', ISNULL(u.Apellidos, '')) AS Cliente,
    u.Correo, u.Telefono, u.Ciudad, u.Departamento, u.FechaCreacion,
    COUNT(p.PedidoId) AS CantidadPedidos,
    ISNULL(SUM(CASE WHEN p.Estado <> 'Cancelado' THEN p.Total ELSE 0 END), 0) AS TotalComprado
FROM vt.Usuarios u
LEFT JOIN vt.Pedidos p ON p.UsuarioId = u.UsuarioId
GROUP BY u.UsuarioId, u.Nombres, u.Apellidos, u.Correo, u.Telefono, u.Ciudad, u.Departamento, u.FechaCreacion;
GO
