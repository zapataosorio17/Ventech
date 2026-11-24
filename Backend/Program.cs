using Microsoft.Extensions.FileProviders;
using Microsoft.Data.SqlClient;
using System.Data;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("Ventech")
    ?? throw new InvalidOperationException("Falta la conexión a SQL Server.");

builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseCors();

var siteRoot = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, ".."));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(siteRoot),
    RequestPath = ""
});

SqlConnection Connection() => new(connectionString);

app.MapGet("/api/health", async () =>
{
    await using var cn = Connection();
    await cn.OpenAsync();
    return Results.Ok(new { connected = true, database = cn.Database });
});

app.MapGet("/api/products", async () =>
{
    var products = new List<object>();
    await using var cn = Connection();
    await cn.OpenAsync();
    const string sql = """
        SELECT p.ProductoId, p.Codigo, p.Nombre, c.Nombre Categoria, p.Descripcion,
               p.Especificaciones, p.Precio, p.DescuentoPorcentaje, p.IVAPorcentaje,
               p.StockActual, p.Estado,
               (SELECT TOP 1 RutaImagen FROM vt.ProductoImagenes i
                 WHERE i.ProductoId = p.ProductoId ORDER BY EsPrincipal DESC, Orden) Imagen
        FROM vt.Productos p
        INNER JOIN vt.Categorias c ON c.CategoriaId = p.CategoriaId
        ORDER BY p.ProductoId DESC;
        """;
    await using var cmd = new SqlCommand(sql, cn);
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
    {
        var code = reader.GetString(1);
        var id = code.StartsWith("WEB-") && long.TryParse(code[4..], out var clientId)
            ? clientId : reader.GetInt32(0);
        products.Add(new
        {
            id,
            name = reader.GetString(2),
            category = reader.GetString(3),
            description = reader.IsDBNull(4) ? "" : reader.GetString(4),
            specs = reader.IsDBNull(5) ? "" : reader.GetString(5),
            price = reader.GetDecimal(6),
            discount = reader.GetDecimal(7),
            vat = reader.GetDecimal(8),
            stock = reader.GetInt32(9),
            enabled = reader.GetString(10) == "Activo",
            image = reader.IsDBNull(11) ? "" : reader.GetString(11)
        });
    }
    return Results.Ok(products);
});

app.MapGet("/api/products/{id:long}/ratings", async (long id, string? email) =>
{
    await using var cn = Connection();
    await cn.OpenAsync();
    const string summarySql = """
        SELECT CAST(ISNULL(AVG(CAST(c.Puntuacion AS DECIMAL(9,2))),0) AS DECIMAL(4,2)), COUNT(c.CalificacionId)
        FROM vt.Productos p LEFT JOIN vt.CalificacionesProducto c ON c.ProductoId=p.ProductoId
        WHERE p.ProductoId=@id OR p.Codigo=CONCAT('WEB-',@id);
        """;
    await using var summary = new SqlCommand(summarySql, cn);
    summary.Parameters.AddWithValue("@id", id);
    await using var reader = await summary.ExecuteReaderAsync();
    if (!await reader.ReadAsync()) return Results.NotFound();
    var average = reader.GetDecimal(0);
    var count = reader.GetInt32(1);
    await reader.CloseAsync();
    int? userRating = null;
    if (!string.IsNullOrWhiteSpace(email))
    {
        const string userSql = """
            SELECT c.Puntuacion FROM vt.CalificacionesProducto c
            INNER JOIN vt.Usuarios u ON u.UsuarioId=c.UsuarioId
            INNER JOIN vt.Productos p ON p.ProductoId=c.ProductoId
            WHERE (p.ProductoId=@id OR p.Codigo=CONCAT('WEB-',@id)) AND u.Correo=@correo;
            """;
        await using var userCmd = new SqlCommand(userSql, cn);
        userCmd.Parameters.AddWithValue("@id", id);
        userCmd.Parameters.AddWithValue("@correo", email.Trim().ToLowerInvariant());
        var value = await userCmd.ExecuteScalarAsync();
        userRating = value is null ? null : Convert.ToInt32(value);
    }
    return Results.Ok(new { average, count, userRating });
});

app.MapPost("/api/products/{id:long}/ratings", async (long id, RatingRequest request) =>
{
    if (request.Value is < 1 or > 5 || string.IsNullOrWhiteSpace(request.Email))
        return Results.BadRequest(new { message = "La calificación debe estar entre 1 y 5 estrellas." });
    await using var cn = Connection();
    await cn.OpenAsync();
    const string sql = """
        DECLARE @producto INT=(SELECT TOP 1 ProductoId FROM vt.Productos WHERE ProductoId=@id OR Codigo=CONCAT('WEB-',@id));
        DECLARE @usuario INT=(SELECT UsuarioId FROM vt.Usuarios WHERE Correo=@correo);
        IF @producto IS NULL OR @usuario IS NULL THROW 50001, 'Producto o usuario no encontrado.', 1;
        MERGE vt.CalificacionesProducto AS destino
        USING (SELECT @producto ProductoId,@usuario UsuarioId) AS origen
        ON destino.ProductoId=origen.ProductoId AND destino.UsuarioId=origen.UsuarioId
        WHEN MATCHED THEN UPDATE SET Puntuacion=@puntuacion,FechaActualizacion=SYSDATETIME()
        WHEN NOT MATCHED THEN INSERT(ProductoId,UsuarioId,Puntuacion) VALUES(@producto,@usuario,@puntuacion);
        """;
    await using var cmd = new SqlCommand(sql, cn);
    cmd.Parameters.AddWithValue("@id", id);
    cmd.Parameters.AddWithValue("@correo", request.Email.Trim().ToLowerInvariant());
    cmd.Parameters.AddWithValue("@puntuacion", request.Value);
    try { await cmd.ExecuteNonQueryAsync(); return Results.Ok(new { value = request.Value }); }
    catch (SqlException ex) { return Results.BadRequest(new { message = ex.Message }); }
});
app.MapGet("/api/promotion", async () =>
{
    await using var cn = Connection(); await cn.OpenAsync();
    await using var cmd = new SqlCommand("SELECT TOP 1 PromocionId,Titulo,Texto,Imagen FROM vt.Promociones WHERE Activa=1 ORDER BY FechaActualizacion DESC", cn);
    await using var r = await cmd.ExecuteReaderAsync();
    return await r.ReadAsync() ? Results.Ok(new { id=r.GetInt32(0), title=r.GetString(1), text=r.IsDBNull(2)?"":r.GetString(2), image=r.IsDBNull(3)?"":r.GetString(3) }) : Results.NoContent();
});
app.MapPut("/api/promotion", async (PromotionRequest p) =>
{
    await using var cn = Connection(); await cn.OpenAsync();
    const string sql="UPDATE vt.Promociones SET Activa=0; INSERT INTO vt.Promociones(Titulo,Texto,Imagen,Activa) VALUES(@t,@x,@i,1);";
    await using var cmd=new SqlCommand(sql,cn); cmd.Parameters.AddWithValue("@t",p.Title??"Promoción Ventech");cmd.Parameters.AddWithValue("@x",p.Text??"");cmd.Parameters.AddWithValue("@i",p.Image??"");await cmd.ExecuteNonQueryAsync();return Results.Ok();
});
app.MapGet("/api/categories", async () =>
{
    var categories = new List<object>();
    await using var cn = Connection();
    await cn.OpenAsync();
    await using var cmd = new SqlCommand("SELECT CategoriaId,Nombre FROM vt.Categorias ORDER BY Nombre", cn);
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync()) categories.Add(new { id = reader.GetInt32(0), name = reader.GetString(1) });
    return Results.Ok(categories);
});

app.MapPost("/api/categories", async (CategoryRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Name)) return Results.BadRequest(new { message = "Escribe un nombre para la categoría." });
    await using var cn = Connection();
    await cn.OpenAsync();
    await using var cmd = new SqlCommand("INSERT INTO vt.Categorias(Nombre) VALUES(@nombre); SELECT CAST(SCOPE_IDENTITY() AS INT);", cn);
    cmd.Parameters.AddWithValue("@nombre", request.Name.Trim());
    try { var id = Convert.ToInt32(await cmd.ExecuteScalarAsync()); return Results.Created($"/api/categories/{id}", new { id, name = request.Name.Trim() }); }
    catch (SqlException) { return Results.Conflict(new { message = "Esa categoría ya existe." }); }
});

app.MapPut("/api/categories/{id:int}", async (int id, CategoryRequest request) =>
{
    if (string.IsNullOrWhiteSpace(request.Name)) return Results.BadRequest(new { message = "Escribe un nombre para la categoría." });
    await using var cn = Connection();
    await cn.OpenAsync();
    await using var cmd = new SqlCommand("UPDATE vt.Categorias SET Nombre=@nombre WHERE CategoriaId=@id", cn);
    cmd.Parameters.AddWithValue("@nombre", request.Name.Trim()); cmd.Parameters.AddWithValue("@id", id);
    try { return await cmd.ExecuteNonQueryAsync() == 0 ? Results.NotFound() : Results.Ok(new { id, name = request.Name.Trim() }); }
    catch (SqlException) { return Results.Conflict(new { message = "Esa categoría ya existe." }); }
});
app.MapPost("/api/products/sync", async (List<ProductInput> products) =>
{
    await using var cn = Connection();
    await cn.OpenAsync();
    await using var tx = (SqlTransaction)await cn.BeginTransactionAsync();
    try
    {
        foreach (var product in products)
        {
            var categoryId = await EnsureCategory(cn, tx, product.category);
            var code = $"WEB-{product.id}";
            const string existsSql = "SELECT ProductoId FROM vt.Productos WHERE Codigo=@codigo";
            int? databaseId;
            await using (var exists = new SqlCommand(existsSql, cn, tx))
            {
                exists.Parameters.AddWithValue("@codigo", code);
                var value = await exists.ExecuteScalarAsync();
                databaseId = value == null ? null : Convert.ToInt32(value);
            }
            if (databaseId is null)
            {
                const string insert = """
                    INSERT INTO vt.Productos
                    (Codigo,Nombre,CategoriaId,Descripcion,Especificaciones,Precio,DescuentoPorcentaje,IVAPorcentaje,StockActual,Estado)
                    VALUES(@codigo,@nombre,@categoria,@descripcion,@especificaciones,@precio,@descuento,@iva,@stock,@estado);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);
                    """;
                await using var cmd = ProductCommand(insert, cn, tx, product, code, categoryId);
                databaseId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }
            else
            {
                const string update = """
                    UPDATE vt.Productos SET Nombre=@nombre,CategoriaId=@categoria,Descripcion=@descripcion,
                    Especificaciones=@especificaciones,Precio=@precio,DescuentoPorcentaje=@descuento,
                    IVAPorcentaje=@iva,StockActual=@stock,Estado=@estado,FechaActualizacion=SYSDATETIME()
                    WHERE ProductoId=@productoId;
                    """;
                await using var cmd = ProductCommand(update, cn, tx, product, code, categoryId);
                cmd.Parameters.AddWithValue("@productoId", databaseId.Value);
                await cmd.ExecuteNonQueryAsync();
            }
            if (!string.IsNullOrWhiteSpace(product.image))
            {
                const string imageSql = """
                    IF EXISTS (SELECT 1 FROM vt.ProductoImagenes WHERE ProductoId=@productoId AND EsPrincipal=1)
                      UPDATE vt.ProductoImagenes SET RutaImagen=@imagen WHERE ProductoId=@productoId AND EsPrincipal=1;
                    ELSE INSERT INTO vt.ProductoImagenes(ProductoId,RutaImagen,EsPrincipal,Orden)
                      VALUES(@productoId,@imagen,1,1);
                    """;
                await using var imageCmd = new SqlCommand(imageSql, cn, tx);
                imageCmd.Parameters.AddWithValue("@productoId", databaseId.Value);
                imageCmd.Parameters.AddWithValue("@imagen", product.image);
                await imageCmd.ExecuteNonQueryAsync();
            }
        }
        await tx.CommitAsync();
        return Results.Ok(new { saved = products.Count });
    }
    catch
    {
        await tx.RollbackAsync();
        throw;
    }
});

app.MapGet("/api/inventory/alerts", async () =>
{
    var alerts = new List<object>();
    await using var cn = Connection();
    await cn.OpenAsync();
    const string sql = "SELECT ProductoId, Nombre, StockActual, StockMinimo, Estado FROM vt.Productos WHERE StockActual <= StockMinimo OR Estado='Inhabilitado'";
    await using var cmd = new SqlCommand(sql, cn);
    await using var reader = await cmd.ExecuteReaderAsync();
    while (await reader.ReadAsync())
        alerts.Add(new { id = reader.GetInt32(0), name = reader.GetString(1), stock = reader.GetInt32(2), minimum = reader.GetInt32(3), state = reader.GetString(4) });
    return Results.Ok(alerts);
});

app.MapGet("/api/dashboard", async () =>
{
    await using var cn = Connection();
    await cn.OpenAsync();

    var summary = new Dictionary<string, object?>();
    await using (var command = new SqlCommand("SELECT TOP 1 * FROM vt.vw_PBI_Resumen", cn))
    await using (var reader = await command.ExecuteReaderAsync())
    {
        if (await reader.ReadAsync())
            for (var i = 0; i < reader.FieldCount; i++) summary[reader.GetName(i)] = reader.IsDBNull(i) ? 0 : reader.GetValue(i);
    }

    var categories = new List<object>();
    await using (var command = new SqlCommand("SELECT Categoria, SUM(TotalLinea) Total FROM vt.vw_PBI_DetalleVentas GROUP BY Categoria ORDER BY Total DESC", cn))
    await using (var reader = await command.ExecuteReaderAsync())
        while (await reader.ReadAsync()) categories.Add(new { name = reader.GetString(0), total = reader.GetDecimal(1) });

    var trend = new List<object>();
    await using (var command = new SqlCommand("SELECT CONVERT(date,FechaPedido) Dia, SUM(Total) Total FROM vt.Pedidos WHERE Estado <> 'Cancelado' GROUP BY CONVERT(date,FechaPedido) ORDER BY Dia", cn))
    await using (var reader = await command.ExecuteReaderAsync())
        while (await reader.ReadAsync()) trend.Add(new { date = reader.GetDateTime(0), total = reader.GetDecimal(1) });

    var payments = new List<object>();
    await using (var command = new SqlCommand("SELECT MetodoPago, COUNT(*) Cantidad FROM vt.Pagos GROUP BY MetodoPago ORDER BY Cantidad DESC", cn))
    await using (var reader = await command.ExecuteReaderAsync())
        while (await reader.ReadAsync()) payments.Add(new { name = reader.GetString(0), count = reader.GetInt32(1) });
    var inventory = new List<object>();
    await using (var command = new SqlCommand("SELECT TOP 8 Producto,Categoria,StockActual,StockMinimo,EstadoInventario FROM vt.vw_PBI_Inventario ORDER BY CASE WHEN EstadoInventario='Stock bajo' THEN 0 WHEN EstadoInventario='Inhabilitado' THEN 1 ELSE 2 END, StockActual", cn))
    await using (var reader = await command.ExecuteReaderAsync())
        while (await reader.ReadAsync()) inventory.Add(new { product = reader.GetString(0), category = reader.GetString(1), stock = reader.GetInt32(2), minimum = reader.GetInt32(3), state = reader.GetString(4) });

    var orders = new List<object>();
    await using (var command = new SqlCommand("SELECT TOP 6 NumeroPedido,Cliente,Estado,FechaPedido,Total FROM vt.vw_PBI_Ventas ORDER BY FechaPedido DESC", cn))
    await using (var reader = await command.ExecuteReaderAsync())
        while (await reader.ReadAsync()) orders.Add(new { number = reader.GetString(0), customer = reader.GetString(1), state = reader.GetString(2), date = reader.GetDateTime(3), total = reader.GetDecimal(4) });

    return Results.Ok(new { summary, categories, trend, payments, inventory, orders, updatedAt = DateTime.Now });
});
app.MapVentechBusinessApi(connectionString);

app.Run("http://localhost:5097");

static async Task<int> EnsureCategory(SqlConnection cn, SqlTransaction tx, string? name)
{
    name = string.IsNullOrWhiteSpace(name) ? "Sin categoría" : name.Trim();
    const string sql = """
        IF NOT EXISTS (SELECT 1 FROM vt.Categorias WHERE Nombre=@nombre)
            INSERT INTO vt.Categorias(Nombre) VALUES(@nombre);
        SELECT CategoriaId FROM vt.Categorias WHERE Nombre=@nombre;
        """;
    await using var cmd = new SqlCommand(sql, cn, tx);
    cmd.Parameters.AddWithValue("@nombre", name);
    return Convert.ToInt32(await cmd.ExecuteScalarAsync());
}

static SqlCommand ProductCommand(string sql, SqlConnection cn, SqlTransaction tx, ProductInput p, string code, int categoryId)
{
    var cmd = new SqlCommand(sql, cn, tx);
    cmd.Parameters.AddWithValue("@codigo", code);
    cmd.Parameters.AddWithValue("@nombre", p.name ?? "Producto");
    cmd.Parameters.AddWithValue("@categoria", categoryId);
    cmd.Parameters.AddWithValue("@descripcion", p.description ?? "");
    cmd.Parameters.AddWithValue("@especificaciones", p.specs ?? "");
    cmd.Parameters.AddWithValue("@precio", p.price);
    cmd.Parameters.AddWithValue("@descuento", p.discount);
    cmd.Parameters.AddWithValue("@iva", p.vat ?? 19);
    cmd.Parameters.AddWithValue("@stock", p.stock);
    cmd.Parameters.AddWithValue("@estado", p.enabled == false ? "Inhabilitado" : "Activo");
    return cmd;
}

public sealed record PromotionRequest(string? Title,string? Text,string? Image);
public sealed record CategoryRequest(string Name);
public sealed record RatingRequest(string Email, int Value);

public sealed record ProductInput(
    long id, string? name, string? category, string? description, string? specs, string? capacity, string? colors,
    decimal price, decimal discount, decimal? vat, int stock, bool? enabled, string? image);
