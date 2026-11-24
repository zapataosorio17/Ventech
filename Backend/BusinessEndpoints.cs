using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using System.Data;

public static class BusinessEndpoints
{
    public static void MapVentechBusinessApi(this WebApplication app, string connectionString)
    {
        SqlConnection Open() => new(connectionString);
        var hasher = new PasswordHasher<AuthUser>();

        app.MapPost("/api/auth/register", async (RegisterRequest request) =>
        {
            await using var cn = Open();
            await cn.OpenAsync();
            const string existsSql = "SELECT COUNT(*) FROM vt.Usuarios WHERE Correo=@correo";
            await using var exists = new SqlCommand(existsSql, cn);
            exists.Parameters.AddWithValue("@correo", request.Email.Trim().ToLowerInvariant());
            if (Convert.ToInt32(await exists.ExecuteScalarAsync()) > 0)
                return Results.Conflict(new { message = "El correo ya está registrado." });

            var user = new AuthUser(0, request.Names.Trim(), request.LastNames?.Trim() ?? "", request.Email.Trim().ToLowerInvariant());
            var passwordHash = hasher.HashPassword(user, request.Password);
            const string insertSql = """
                INSERT INTO vt.Usuarios(Nombres,Apellidos,Documento,Telefono,Correo,PasswordHash,Direccion,Departamento,Ciudad,Barrio)
                VALUES(@nombres,@apellidos,@documento,@telefono,@correo,@hash,@direccion,@departamento,@ciudad,@barrio);
                SELECT CAST(SCOPE_IDENTITY() AS INT);
                """;
            await using var insert = new SqlCommand(insertSql, cn);
            insert.Parameters.AddWithValue("@nombres", user.Names);
            insert.Parameters.AddWithValue("@apellidos", user.LastNames);
            insert.Parameters.AddWithValue("@documento", (object?)request.Document ?? DBNull.Value);
            insert.Parameters.AddWithValue("@telefono", (object?)request.Phone ?? DBNull.Value);
            insert.Parameters.AddWithValue("@correo", user.Email);
            insert.Parameters.AddWithValue("@hash", passwordHash);
            insert.Parameters.AddWithValue("@direccion", (object?)request.Address ?? DBNull.Value);
            insert.Parameters.AddWithValue("@departamento", (object?)request.Department ?? DBNull.Value);
            insert.Parameters.AddWithValue("@ciudad", (object?)request.City ?? DBNull.Value);
            insert.Parameters.AddWithValue("@barrio", (object?)request.Neighborhood ?? DBNull.Value);
            var userId = Convert.ToInt32(await insert.ExecuteScalarAsync());

            const string roleSql = """
                INSERT INTO vt.UsuarioRoles(UsuarioId,RolId)
                SELECT @usuario, RolId FROM vt.Roles WHERE Nombre='Cliente';
                """;
            await using var role = new SqlCommand(roleSql, cn);
            role.Parameters.AddWithValue("@usuario", userId);
            await role.ExecuteNonQueryAsync();
            return Results.Created($"/api/users/{userId}", new { id = userId, name = $"{user.Names} {user.LastNames}".Trim(), email = user.Email, role = "Cliente" });
        });

        app.MapPost("/api/auth/login", async (LoginRequest request) =>
        {
            await using var cn = Open();
            await cn.OpenAsync();
            const string sql = "SELECT UsuarioId,Nombres,Apellidos,Correo,PasswordHash,Activo,Telefono,Documento,Direccion FROM vt.Usuarios WHERE Correo=@correo";
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@correo", request.Email.Trim().ToLowerInvariant());
            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return Results.Unauthorized();
            if (!reader.GetBoolean(5)) return Results.Forbid();
            var user = new AuthUser(reader.GetInt32(0), reader.GetString(1), reader.IsDBNull(2) ? "" : reader.GetString(2), reader.GetString(3));
            var verified = hasher.VerifyHashedPassword(user, reader.GetString(4), request.Password);
            if (verified == PasswordVerificationResult.Failed) return Results.Unauthorized();
            return Results.Ok(new
            {
                id = user.Id,
                name = $"{user.Names} {user.LastNames}".Trim(),
                email = user.Email,
                phone = reader.IsDBNull(6) ? "" : reader.GetString(6),
                document = reader.IsDBNull(7) ? "" : reader.GetString(7),
                address = reader.IsDBNull(8) ? "" : reader.GetString(8),
                role = "Cliente"
            });
        });

        app.MapPost("/api/staff/sessions/start", async (StaffSessionRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest(new { message = "Nombre y correo son obligatorios." });
            await using var cn = Open();
            await cn.OpenAsync();
            await using var tx = (SqlTransaction)await cn.BeginTransactionAsync();
            var userId = await GetOrCreateStaffUserId(cn, tx, request.Name, request.Email);
            const string sql = """
                UPDATE vt.SesionesEmpleados SET FinTurno=SYSDATETIME()
                WHERE UsuarioId=@usuario AND FinTurno IS NULL;
                INSERT INTO vt.SesionesEmpleados(UsuarioId) VALUES(@usuario);
                SELECT CAST(SCOPE_IDENTITY() AS BIGINT);
                """;
            await using var cmd = new SqlCommand(sql, cn, tx);
            cmd.Parameters.AddWithValue("@usuario", userId);
            var sessionId = Convert.ToInt64(await cmd.ExecuteScalarAsync());
            await tx.CommitAsync();
            return Results.Ok(new { sessionId, userId, startedAt = DateTime.Now });
        });

        app.MapPost("/api/staff/sessions/end", async (StaffSessionRequest request) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email)) return Results.BadRequest();
            await using var cn = Open();
            await cn.OpenAsync();
            const string sql = """
                ;WITH UltimaSesion AS
                (
                    SELECT TOP 1 s.SesionId
                    FROM vt.SesionesEmpleados s
                    INNER JOIN vt.Usuarios u ON u.UsuarioId=s.UsuarioId
                    WHERE u.Correo=@correo AND s.FinTurno IS NULL
                    ORDER BY s.InicioTurno DESC
                )
                UPDATE s SET FinTurno=SYSDATETIME()
                FROM vt.SesionesEmpleados s INNER JOIN UltimaSesion us ON us.SesionId=s.SesionId;
                SELECT @@ROWCOUNT;
                """;
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@correo", request.Email.Trim().ToLowerInvariant());
            var updated = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            return updated > 0 ? Results.Ok(new { endedAt = DateTime.Now }) : Results.NotFound();
        });
        app.MapGet("/api/customers/{email}/orders", async (string email) =>
        {
            var orders = new List<object>();
            await using var cn = Open();
            await cn.OpenAsync();
            const string sql = """
                SELECT p.PedidoId,p.NumeroPedido,p.Estado,p.FechaPedido,p.Subtotal,p.Descuento,p.IVA,p.CostoEnvio,p.Total,
                       p.Departamento,p.Ciudad,p.Direccion,p.Barrio,f.NumeroFactura,f.Estado
                FROM vt.Pedidos p INNER JOIN vt.Usuarios u ON u.UsuarioId=p.UsuarioId
                LEFT JOIN vt.Facturas f ON f.PedidoId=p.PedidoId
                WHERE u.Correo=@correo ORDER BY p.PedidoId DESC;
                """;
            await using var cmd = new SqlCommand(sql, cn);
            cmd.Parameters.AddWithValue("@correo", email.Trim().ToLowerInvariant());
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                orders.Add(new
                {
                    id = reader.GetInt64(0), number = reader.GetString(1), status = reader.GetString(2),
                    date = reader.GetDateTime(3), subtotal = reader.GetDecimal(4), discount = reader.GetDecimal(5),
                    vat = reader.GetDecimal(6), shipping = reader.GetDecimal(7), total = reader.GetDecimal(8),
                    address = $"{reader.GetString(9)}, {reader.GetString(10)} - {reader.GetString(11)}",
                    invoice = reader.IsDBNull(13) ? null : reader.GetString(13),
                    invoiceStatus = reader.IsDBNull(14) ? null : reader.GetString(14)
                });
            return Results.Ok(orders);
        });

        app.MapPost("/api/orders", async (CreateOrderRequest request) =>
        {
            await using var cn = Open();
            await cn.OpenAsync();
            await using var tx = (SqlTransaction)await cn.BeginTransactionAsync();
            try
            {
                var userId = await GetUserId(cn, tx, request.Email);
                if (userId is null) return Results.NotFound(new { message = "Cliente no encontrado." });
                var number = $"PED-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
                const string headerSql = """
                    INSERT INTO vt.Pedidos(UsuarioId,NumeroPedido,TipoEntrega,Departamento,Ciudad,Direccion,Barrio)
                    VALUES(@usuario,@numero,@entrega,@departamento,@ciudad,@direccion,@barrio);
                    SELECT CAST(SCOPE_IDENTITY() AS BIGINT);
                    """;
                await using var header = new SqlCommand(headerSql, cn, tx);
                header.Parameters.AddWithValue("@usuario", userId.Value);
                header.Parameters.AddWithValue("@numero", number);
                header.Parameters.AddWithValue("@entrega", request.DeliveryType ?? "Domicilio");
                header.Parameters.AddWithValue("@departamento", request.Department ?? "");
                header.Parameters.AddWithValue("@ciudad", request.City ?? "");
                header.Parameters.AddWithValue("@direccion", request.Address ?? "");
                header.Parameters.AddWithValue("@barrio", request.Neighborhood ?? "");
                var orderId = Convert.ToInt64(await header.ExecuteScalarAsync());

                decimal subtotal = 0, discount = 0, vat = 0;
                foreach (var item in request.Items)
                {
                    var product = await GetProduct(cn, tx, item.ProductId);
                    if (product is null || product.Stock < item.Quantity)
                        throw new InvalidOperationException("Producto no disponible o sin stock suficiente.");
                    var lineBase = product.Price * item.Quantity;
                    var lineDiscount = lineBase * product.Discount / 100m;
                    var lineNet = lineBase - lineDiscount;
                    var lineVat = Math.Round(lineNet * product.Vat / 100m, 2);
                    subtotal += lineBase; discount += lineDiscount; vat += lineVat;
                    const string detailSql = """
                        INSERT INTO vt.DetallePedidos(PedidoId,ProductoId,Cantidad,PrecioUnitario,Descuento,IVAPorcentaje,IVA,TotalLinea)
                        VALUES(@pedido,@producto,@cantidad,@precio,@descuento,@ivaPorcentaje,@iva,@total);
                        UPDATE vt.Productos SET StockActual=StockActual-@cantidad WHERE ProductoId=@producto;
                        """;
                    await using var detail = new SqlCommand(detailSql, cn, tx);
                    detail.Parameters.AddWithValue("@pedido", orderId);
                    detail.Parameters.AddWithValue("@producto", product.Id);
                    detail.Parameters.AddWithValue("@cantidad", item.Quantity);
                    detail.Parameters.AddWithValue("@precio", product.Price);
                    detail.Parameters.AddWithValue("@descuento", lineDiscount);
                    detail.Parameters.AddWithValue("@ivaPorcentaje", product.Vat);
                    detail.Parameters.AddWithValue("@iva", lineVat);
                    detail.Parameters.AddWithValue("@total", lineNet + lineVat);
                    await detail.ExecuteNonQueryAsync();
                }
                var total = subtotal - discount + vat + request.Shipping;
                const string finalSql = """
                    UPDATE vt.Pedidos SET Subtotal=@subtotal,Descuento=@descuento,IVA=@iva,CostoEnvio=@envio,Total=@total WHERE PedidoId=@pedido;
                    INSERT INTO vt.Pagos(PedidoId,MetodoPago,Estado,Valor) VALUES(@pedido,@metodo,'Pendiente',@total);
                    INSERT INTO vt.Facturas(PedidoId,NumeroFactura) VALUES(@pedido,CONCAT('FAC-',FORMAT(@pedido,'000000')));
                    """;
                await using var final = new SqlCommand(finalSql, cn, tx);
                final.Parameters.AddWithValue("@pedido", orderId);
                final.Parameters.AddWithValue("@subtotal", subtotal);
                final.Parameters.AddWithValue("@descuento", discount);
                final.Parameters.AddWithValue("@iva", vat);
                final.Parameters.AddWithValue("@envio", request.Shipping);
                final.Parameters.AddWithValue("@total", total);
                final.Parameters.AddWithValue("@metodo", request.PaymentMethod ?? "PSE");
                await final.ExecuteNonQueryAsync();
                const string initialHistorySql = """
                    INSERT INTO vt.HistorialEstadosPedido(PedidoId,EstadoAnterior,EstadoNuevo,Responsable,Observacion)
                    VALUES(@pedido,NULL,'Procesando','Sistema','Pedido creado');
                    """;
                await using var initialHistory = new SqlCommand(initialHistorySql, cn, tx);
                initialHistory.Parameters.AddWithValue("@pedido", orderId);
                await initialHistory.ExecuteNonQueryAsync();
                await tx.CommitAsync();
                return Results.Created($"/api/orders/{orderId}", new { id = orderId, number, total, status = "Procesando" });
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        app.MapPatch("/api/orders/{orderId:long}/status", async (long orderId, OrderStatusRequest request) =>
        {
            var allowedStatuses = new[] { "Procesando", "En camino", "Entregado" };
            var nextStatus = request.Status?.Trim() ?? "";
            if (!allowedStatuses.Contains(nextStatus))
                return Results.BadRequest(new { message = "Estado de pedido no válido." });

            await using var cn = Open();
            await cn.OpenAsync();
            await using var tx = (SqlTransaction)await cn.BeginTransactionAsync();
            const string currentSql = "SELECT Estado FROM vt.Pedidos WHERE PedidoId=@pedido";
            await using var current = new SqlCommand(currentSql, cn, tx);
            current.Parameters.AddWithValue("@pedido", orderId);
            var previousStatus = await current.ExecuteScalarAsync() as string;
            if (previousStatus is null) return Results.NotFound(new { message = "Pedido no encontrado." });
            if (previousStatus == "Cancelado") return Results.BadRequest(new { message = "Un pedido cancelado no puede actualizarse." });

            const string updateSql = """
                UPDATE vt.Pedidos SET Estado=@nuevo,FechaActualizacion=SYSDATETIME() WHERE PedidoId=@pedido;
                INSERT INTO vt.HistorialEstadosPedido(PedidoId,EstadoAnterior,EstadoNuevo,Responsable,Observacion)
                VALUES(@pedido,@anterior,@nuevo,@responsable,@observacion);
                """;
            await using var update = new SqlCommand(updateSql, cn, tx);
            update.Parameters.AddWithValue("@pedido", orderId);
            update.Parameters.AddWithValue("@anterior", previousStatus);
            update.Parameters.AddWithValue("@nuevo", nextStatus);
            update.Parameters.AddWithValue("@responsable", string.IsNullOrWhiteSpace(request.ChangedBy) ? "Panel administrativo" : request.ChangedBy.Trim());
            update.Parameters.AddWithValue("@observacion", string.IsNullOrWhiteSpace(request.Observation) ? "Estado actualizado desde el panel administrativo." : request.Observation.Trim());
            await update.ExecuteNonQueryAsync();
            await tx.CommitAsync();
            return Results.Ok(new { id = orderId, status = nextStatus, previousStatus, changedAt = DateTime.Now });
        });
        app.MapPatch("/api/orders/{orderId:long}/cancel", async (long orderId, CancelRequest request) =>
        {
            await using var cn = Open();
            await cn.OpenAsync();
            await using var tx = (SqlTransaction)await cn.BeginTransactionAsync();
            const string statusSql = """
                SELECT p.Estado FROM vt.Pedidos p INNER JOIN vt.Usuarios u ON u.UsuarioId=p.UsuarioId
                WHERE p.PedidoId=@pedido AND u.Correo=@correo;
                """;
            await using var statusCmd = new SqlCommand(statusSql, cn, tx);
            statusCmd.Parameters.AddWithValue("@pedido", orderId);
            statusCmd.Parameters.AddWithValue("@correo", request.Email.Trim().ToLowerInvariant());
            var status = await statusCmd.ExecuteScalarAsync() as string;
            if (status is null) return Results.NotFound();
            if (status != "Procesando") return Results.BadRequest(new { message = "Solo se pueden cancelar pedidos en proceso." });
            const string cancelSql = """
                INSERT INTO vt.PedidosCancelados(PedidoId,UsuarioId,NumeroPedido,Motivo,EstadoAnterior,Total,FechaPedido)
                SELECT PedidoId,UsuarioId,NumeroPedido,'Cancelado por el cliente',Estado,Total,FechaPedido
                FROM vt.Pedidos WHERE PedidoId=@pedido;UPDATE pr SET pr.StockActual=pr.StockActual+d.Cantidad
                FROM vt.Productos pr INNER JOIN vt.DetallePedidos d ON d.ProductoId=pr.ProductoId WHERE d.PedidoId=@pedido;
                UPDATE vt.Pedidos SET Estado='Cancelado',FechaActualizacion=SYSDATETIME() WHERE PedidoId=@pedido;
                INSERT INTO vt.HistorialEstadosPedido(PedidoId,EstadoAnterior,EstadoNuevo,Responsable,Observacion)
                VALUES(@pedido,@status,'Cancelado','Cliente','Cancelado por el cliente');
                UPDATE vt.Facturas SET Estado='Anulada',FechaAnulacion=SYSDATETIME(),Observacion='Pedido cancelado por el cliente' WHERE PedidoId=@pedido;
                UPDATE vt.Pagos SET Estado='Reembolsado' WHERE PedidoId=@pedido AND Estado='Aprobado';
                """;
            await using var cancel = new SqlCommand(cancelSql, cn, tx);
            cancel.Parameters.AddWithValue("@pedido", orderId);
            cancel.Parameters.AddWithValue("@status", status);
            await cancel.ExecuteNonQueryAsync();
            await tx.CommitAsync();
            return Results.Ok(new { status = "Cancelado" });
        });
    }

    private static async Task<int> GetOrCreateStaffUserId(SqlConnection cn, SqlTransaction tx, string name, string email)
    {
        email = email.Trim().ToLowerInvariant();
        await using var find = new SqlCommand("SELECT UsuarioId FROM vt.Usuarios WHERE Correo=@correo", cn, tx);
        find.Parameters.AddWithValue("@correo", email);
        var existing = await find.ExecuteScalarAsync();
        if (existing is not null) return Convert.ToInt32(existing);

        var names = name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        const string insertSql = """
            INSERT INTO vt.Usuarios(Nombres,Apellidos,Correo,PasswordHash)
            VALUES(@nombres,@apellidos,@correo,'PANEL-LOCAL');
            SELECT CAST(SCOPE_IDENTITY() AS INT);
            """;
        await using var insert = new SqlCommand(insertSql, cn, tx);
        insert.Parameters.AddWithValue("@nombres", names.FirstOrDefault() ?? "Empleado");
        insert.Parameters.AddWithValue("@apellidos", names.Length > 1 ? names[1] : "");
        insert.Parameters.AddWithValue("@correo", email);
        var userId = Convert.ToInt32(await insert.ExecuteScalarAsync());
        const string roleSql = """
            INSERT INTO vt.UsuarioRoles(UsuarioId,RolId)
            SELECT @usuario,RolId FROM vt.Roles WHERE Nombre='Empleado';
            """;
        await using var role = new SqlCommand(roleSql, cn, tx);
        role.Parameters.AddWithValue("@usuario", userId);
        await role.ExecuteNonQueryAsync();
        return userId;
    }
    private static async Task<int?> GetUserId(SqlConnection cn, SqlTransaction tx, string email)
    {
        await using var cmd = new SqlCommand("SELECT UsuarioId FROM vt.Usuarios WHERE Correo=@correo", cn, tx);
        cmd.Parameters.AddWithValue("@correo", email.Trim().ToLowerInvariant());
        var result = await cmd.ExecuteScalarAsync();
        return result is null ? null : Convert.ToInt32(result);
    }

    private static async Task<ProductDb?> GetProduct(SqlConnection cn, SqlTransaction tx, long clientId)
    {
        const string sql = """
            SELECT TOP 1 ProductoId,Precio,DescuentoPorcentaje,IVAPorcentaje,StockActual
            FROM vt.Productos WHERE ProductoId=@id OR Codigo=CONCAT('WEB-',@id);
            """;
        await using var cmd = new SqlCommand(sql, cn, tx);
        cmd.Parameters.AddWithValue("@id", clientId);
        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync()
            ? new ProductDb(reader.GetInt32(0), reader.GetDecimal(1), reader.GetDecimal(2), reader.GetDecimal(3), reader.GetInt32(4))
            : null;
    }
}

public sealed record ProductDb(int Id, decimal Price, decimal Discount, decimal Vat, int Stock);
public sealed record AuthUser(int Id, string Names, string LastNames, string Email);
public sealed record RegisterRequest(string Names, string? LastNames, string Email, string Password, string? Document, string? Phone, string? Address, string? Department, string? City, string? Neighborhood);
public sealed record LoginRequest(string Email, string Password);
public sealed record OrderItemRequest(long ProductId, int Quantity);
public sealed record CreateOrderRequest(string Email, string? DeliveryType, string? Department, string? City, string? Address, string? Neighborhood, string? PaymentMethod, decimal Shipping, List<OrderItemRequest> Items);
public sealed record CancelRequest(string Email);
public sealed record OrderStatusRequest(string? Status, string? ChangedBy, string? Observation);
public sealed record StaffSessionRequest(string Email, string? Name);
